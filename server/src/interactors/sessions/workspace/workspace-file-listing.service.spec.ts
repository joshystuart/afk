import { BadRequestException } from '@nestjs/common';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { WorkspaceFileListingService } from './workspace-file-listing.service';

describe('WorkspaceFileListingService', () => {
  let service: WorkspaceFileListingService;
  let execService: jest.Mocked<Pick<DockerEngineService, 'execInContainer'>>;

  beforeEach(() => {
    execService = {
      execInContainer: jest.fn(),
    };

    service = new WorkspaceFileListingService(
      execService as unknown as DockerEngineService,
    );
  });

  it('rejects path traversal outside the workspace', () => {
    expect(() =>
      service.resolveSafePath('/workspace', '../etc/passwd'),
    ).toThrow(new BadRequestException('Path traversal detected'));
  });

  it('falls back to find and filters gitignored entries', async () => {
    execService.execInContainer.mockImplementation(
      async (_containerId, cmd) => {
        if (cmd[0] === 'git' && cmd[1] === 'ls-files') {
          return {
            stdout: '',
            stderr: 'git failed',
            exitCode: 1,
          };
        }

        if (cmd[0] === 'find') {
          return {
            stdout: 'README.md\nnode_modules\nsrc\n',
            stderr: '',
            exitCode: 0,
          };
        }

        if (cmd[0] === 'cat' && cmd[1] === '/workspace/.gitignore') {
          return {
            stdout: 'node_modules\n',
            stderr: '',
            exitCode: 0,
          };
        }

        if (
          cmd[0] === 'test' &&
          cmd[1] === '-d' &&
          cmd[2] === '/workspace/src'
        ) {
          return {
            stdout: '',
            stderr: '',
            exitCode: 0,
          };
        }

        if (
          cmd[0] === 'test' &&
          cmd[1] === '-d' &&
          cmd[2] === '/workspace/README.md'
        ) {
          return {
            stdout: '',
            stderr: '',
            exitCode: 1,
          };
        }

        if (
          cmd[0] === 'stat' &&
          cmd[1] === '-c' &&
          cmd[2] === '%s' &&
          cmd[3] === '/workspace/README.md'
        ) {
          return {
            stdout: '120',
            stderr: '',
            exitCode: 0,
          };
        }

        throw new Error(`Unexpected command: ${cmd.join(' ')}`);
      },
    );

    const entries = await service.listDirectory(
      'container-1',
      '/',
      '/workspace',
    );

    expect(entries).toMatchObject([
      {
        name: 'src',
        path: 'src',
        type: 'directory',
      },
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        size: 120,
      },
    ]);
  });

  it('returns binary metadata without reading the file body', async () => {
    execService.execInContainer.mockResolvedValueOnce({
      stdout: '42',
      stderr: '',
      exitCode: 0,
    });

    const file = await service.getFileContent(
      'container-1',
      'assets/logo.png',
      '/workspace',
    );

    expect(file).toEqual({
      path: 'assets/logo.png',
      content: '',
      size: 42,
      truncated: false,
      language: 'plaintext',
      binary: true,
    });
    expect(execService.execInContainer).toHaveBeenCalledTimes(1);
  });

  it('truncates oversized text files with head', async () => {
    execService.execInContainer
      .mockResolvedValueOnce({
        stdout: '524289',
        stderr: '',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'export const value = 1;',
        stderr: '',
        exitCode: 0,
      });

    const file = await service.getFileContent(
      'container-1',
      'src/file.ts',
      '/workspace',
    );

    expect(execService.execInContainer).toHaveBeenNthCalledWith(
      2,
      'container-1',
      ['head', '-c', '524288', '/workspace/src/file.ts'],
      '/workspace',
    );
    expect(file).toEqual({
      path: 'src/file.ts',
      content: 'export const value = 1;',
      size: 524289,
      truncated: true,
      language: 'typescript',
      binary: false,
    });
  });
});
