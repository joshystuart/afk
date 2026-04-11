import { Injectable, Logger } from '@nestjs/common';
import { PassThrough } from 'stream';
import { DEFAULT_EXEC_WORKING_DIR } from './docker.constants';
import { DockerClientService } from './docker-client.service';

@Injectable()
export class DockerContainerExecService {
  private readonly logger = new Logger(DockerContainerExecService.name);

  constructor(private readonly dockerClient: DockerClientService) {}

  async openContainerFollowLogStream(
    containerId: string,
  ): Promise<NodeJS.ReadableStream> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);

    return await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 1000,
    });
  }

  async execInContainer(
    containerId: string,
    cmd: string[],
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise((resolve, reject) => {
      const stdoutBuffers: Buffer[] = [];
      const stderrBuffers: Buffer[] = [];

      const stdoutPassthrough = new PassThrough();
      const stderrPassthrough = new PassThrough();

      container.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);

      stdoutPassthrough.on('data', (chunk: Buffer) =>
        stdoutBuffers.push(chunk),
      );
      stderrPassthrough.on('data', (chunk: Buffer) =>
        stderrBuffers.push(chunk),
      );

      stream.on('end', async () => {
        try {
          const inspectResult = await exec.inspect();
          resolve({
            stdout: Buffer.concat(stdoutBuffers).toString('utf8').trim(),
            stderr: Buffer.concat(stderrBuffers).toString('utf8').trim(),
            exitCode: inspectResult.ExitCode ?? -1,
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  async execInteractive(
    containerId: string,
    cols: number,
    rows: number,
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{
    stream: NodeJS.ReadWriteStream;
    execId: string;
    resize: (cols: number, rows: number) => Promise<void>;
    destroy: () => void;
  }> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({
      hijack: true,
      stdin: true,
      Tty: true,
    });

    await exec.resize({ h: rows, w: cols });

    this.logger.debug('Interactive PTY exec created', {
      containerId,
      execId: exec.id,
      cols,
      rows,
    });

    const resize = async (c: number, r: number) => {
      await exec.resize({ h: r, w: c });
    };

    const destroy = () => {
      try {
        stream.destroy();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Error destroying interactive exec stream', {
          containerId,
          execId: exec.id,
          error: message,
        });
      }
    };

    return { stream, execId: exec.id, resize, destroy };
  }

  async execStreamInContainer(
    containerId: string,
    cmd: string[],
    onData: (data: string) => void,
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{ stream: NodeJS.ReadableStream; kill: () => Promise<void> }> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    const stdoutPassthrough = new PassThrough();
    const stderrPassthrough = new PassThrough();

    container.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);

    stdoutPassthrough.on('data', (chunk: Buffer) => {
      onData(chunk.toString('utf8'));
    });

    stderrPassthrough.on('data', (chunk: Buffer) => {
      this.logger.debug('execStream stderr', chunk.toString('utf8'));
    });

    const kill = async () => {
      try {
        stream.destroy();
        stdoutPassthrough.destroy();
        stderrPassthrough.destroy();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Error killing exec stream', {
          containerId,
          error: message,
        });
      }
    };

    return { stream: stdoutPassthrough, kill };
  }
}
