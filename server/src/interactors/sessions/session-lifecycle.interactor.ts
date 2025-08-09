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
      await this.dockerEngine.startContainer(session.containerId);
      session.start();
      await this.sessionRepository.save(session);

      // Mark as running after container start
      session.markAsRunning();
      await this.sessionRepository.save(session);

      this.logger.log('Session started', { sessionId: sessionId.toString() });
    } catch (error) {
      session.markAsError();
      await this.sessionRepository.save(session);
      this.logger.error('Failed to start session', error);
      throw error;
    }
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

  async restartSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.containerId) {
      throw new Error('Session has no associated container');
    }

    try {
      // Stop if running
      if (session.status === SessionStatus.RUNNING) {
        await this.dockerEngine.stopContainer(session.containerId);
      }

      // Start container - we'll add a startContainer method to DockerEngineService
      // For now, create a new container if restart is needed
      throw new Error(
        'Container restart not yet implemented - delete and recreate session instead',
      );

      this.logger.log('Session restarted', { sessionId: sessionId.toString() });
    } catch (error) {
      session.markAsError();
      await this.sessionRepository.save(session);
      this.logger.error('Failed to restart session', error);
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

    const claudeReady = await this.checkTerminalEndpoint(session.ports.claudePort);
    const manualReady = session.config.terminalMode === 'DUAL' 
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
