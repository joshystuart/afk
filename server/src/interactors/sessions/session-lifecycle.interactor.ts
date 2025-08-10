import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../../services/docker/docker-engine.service';
import { SessionRepository } from '../../services/repositories/session.repository';
import { PortManagerService } from '../../services/docker/port-manager.service';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import * as http from 'http';

@Injectable()
export class SessionLifecycleInteractor {
  private readonly logger = new Logger(SessionLifecycleInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly sessionRepository: SessionRepository,
    private readonly portManager: PortManagerService,
  ) {}

  async stopSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }

    try {
      await this.dockerEngine.stopContainer(session.containerId!);
      session.stop();
      await this.sessionRepository.save(session);

      this.logger.log('Session stopped', { sessionId: sessionId.toString() });
    } catch (error) {
      this.logger.error('Failed to stop session', error);
      throw error;
    }
  }

  async startSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.STOPPED) {
      throw new Error('Session is not stopped');
    }

    if (!session.containerId) {
      throw new Error('Session has no associated container');
    }

    try {
      // Check if container exists and its current state
      let containerInfo;
      try {
        containerInfo = await this.dockerEngine.getContainerInfo(
          session.containerId,
        );
      } catch (error) {
        // Container doesn't exist or is corrupted, recreate it
        this.logger.warn('Container not found or corrupted, recreating', {
          sessionId: sessionId.toString(),
          containerId: session.containerId,
        });
        await this.recreateContainer(session);

        // Transition through proper states: stopped -> starting -> running
        session.start();
        await this.sessionRepository.save(session);
        session.markAsRunning();
        await this.sessionRepository.save(session);

        // Start health check in background
        this.performBackgroundHealthCheck(session);
        return;
      }

      // If container exists but is in an inconsistent state, recreate it
      if (
        containerInfo.state !== 'running' &&
        containerInfo.state !== 'exited'
      ) {
        this.logger.warn('Container in inconsistent state, recreating', {
          sessionId: sessionId.toString(),
          containerState: containerInfo.state,
        });
        await this.dockerEngine.removeContainer(session.containerId);
        await this.recreateContainer(session);

        // Transition through proper states: stopped -> starting -> running
        session.start();
        await this.sessionRepository.save(session);
        session.markAsRunning();
        await this.sessionRepository.save(session);

        // Start health check in background
        this.performBackgroundHealthCheck(session);
        return;
      }

      // Try to start the existing container
      await this.dockerEngine.startContainer(session.containerId);

      // First mark as starting, then as running
      session.start();
      await this.sessionRepository.save(session);

      // Optimistically mark as running immediately
      session.markAsRunning();
      await this.sessionRepository.save(session);

      this.logger.log('Session started (optimistically)', {
        sessionId: sessionId.toString(),
      });

      // Start health check in background with longer timeout
      this.performBackgroundHealthCheck(session);
    } catch (error) {
      session.markAsError();
      await this.sessionRepository.save(session);
      this.logger.error('Failed to start session', error);
      throw error;
    }
  }

  private async recreateContainer(session: any): Promise<void> {
    // Remove old container if it exists
    if (session.containerId) {
      try {
        await this.dockerEngine.removeContainer(session.containerId);
      } catch (error) {
        this.logger.warn('Failed to remove old container, continuing', {
          error: error.message,
        });
      }
    }

    // Create new container with same configuration
    const container = await this.dockerEngine.createContainer({
      sessionId: session.id,
      sessionName: session.name,
      repoUrl: session.config.repoUrl,
      branch: session.config.branch,
      gitUserName: session.config.gitUserName,
      gitUserEmail: session.config.gitUserEmail,
      terminalMode: session.config.terminalMode,
      sshPrivateKey: session.config.sshPrivateKey,
      claudeToken: session.config.claudeToken,
      ports: session.ports,
    });

    // Update session with new container ID
    session.containerId = container.id;
    await this.sessionRepository.save(session);

    this.logger.log('Container recreated successfully', {
      sessionId: session.id,
      newContainerId: container.id,
    });
  }

  private async waitForContainerHealth(
    session: any,
    maxAttempts: number = 15,
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const health = await this.checkTerminalHealth(
          new SessionIdDto(session.id),
        );
        if (health.allReady) {
          this.logger.log('Container health check passed', {
            sessionId: session.id,
          });
          return;
        }
      } catch (error) {
        this.logger.debug('Health check attempt failed', {
          sessionId: session.id,
          attempt: attempts + 1,
          error: error.message,
        });
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    }

    throw new Error(
      `Container failed health check after ${maxAttempts} attempts`,
    );
  }

  private async performBackgroundHealthCheck(session: any): Promise<void> {
    // Run health check in background without blocking
    (async () => {
      const maxAttempts = 30; // 60 seconds total (30 * 2 seconds)
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const health = await this.checkTerminalHealth(
            new SessionIdDto(session.id),
          );
          if (health.allReady) {
            this.logger.log('Background health check passed', {
              sessionId: session.id,
              attempts: attempts + 1,
            });
            return;
          }
        } catch (error) {
          this.logger.debug('Background health check attempt failed', {
            sessionId: session.id,
            attempt: attempts + 1,
            error: error.message,
          });
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }

      // If we get here, health check failed after all attempts
      this.logger.error('Background health check failed after all attempts', {
        sessionId: session.id,
        maxAttempts,
      });

      // Mark session as error
      session.markAsError();
      await this.sessionRepository.save(session);
    })().catch((error) => {
      this.logger.error('Background health check error', {
        sessionId: session.id,
        error: error.message,
      });
    });
  }

  async deleteSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.canBeDeleted()) {
      throw new Error('Session must be stopped before deletion');
    }

    try {
      // Remove container
      if (session.containerId) {
        await this.dockerEngine.removeContainer(session.containerId);
      }

      // Release ports
      if (session.ports) {
        await this.portManager.releasePortPair(session.ports);
      }

      // Delete from repository
      await this.sessionRepository.delete(sessionId);

      this.logger.log('Session deleted', { sessionId: sessionId.toString() });
    } catch (error) {
      this.logger.error('Failed to delete session', error);
      throw error;
    }
  }

  async getSessionInfo(sessionId: SessionIdDto): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.containerId) {
      return {
        session,
        container: null,
      };
    }

    try {
      const containerInfo = await this.dockerEngine.getContainerInfo(
        session.containerId,
      );
      return {
        session,
        container: containerInfo,
      };
    } catch (error) {
      this.logger.error('Failed to get container info', error);
      return {
        session,
        container: null,
        error: error.message,
      };
    }
  }

  async checkTerminalHealth(sessionId: SessionIdDto): Promise<{
    claudeTerminalReady: boolean;
    manualTerminalReady: boolean;
    allReady: boolean;
  }> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING || !session.ports) {
      return {
        claudeTerminalReady: false,
        manualTerminalReady: false,
        allReady: false,
      };
    }

    const claudeReady = await this.checkTerminalEndpoint(
      session.ports.claudePort,
    );
    const manualReady =
      session.config.terminalMode === 'DUAL'
        ? await this.checkTerminalEndpoint(session.ports.manualPort)
        : true; // Manual terminal not needed in simple mode

    return {
      claudeTerminalReady: claudeReady,
      manualTerminalReady: manualReady,
      allReady: claudeReady && manualReady,
    };
  }

  private async checkTerminalEndpoint(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 2000,
      };

      const req = http.request(options, (res) => {
        // If we get any HTTP response, the terminal is ready
        resolve(res.statusCode === 200 || res.statusCode === 404);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.setTimeout(2000);
      req.end();
    });
  }
}
