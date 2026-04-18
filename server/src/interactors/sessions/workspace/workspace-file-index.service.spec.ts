import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { WorkspaceFileIndexService } from './workspace-file-index.service';

describe('WorkspaceFileIndexService', () => {
  let service: WorkspaceFileIndexService;
  let execService: jest.Mocked<Pick<DockerEngineService, 'execInContainer'>>;

  beforeEach(() => {
    execService = {
      execInContainer: jest.fn(),
    };

    service = new WorkspaceFileIndexService(
      execService as unknown as DockerEngineService,
    );
  });

  it('reuses a cached index within the ttl', async () => {
    execService.execInContainer.mockResolvedValueOnce({
      stdout: 'src/app.ts\nREADME.md\n',
      stderr: '',
      exitCode: 0,
    });

    const first = await service.getFileIndex('container-1', '/workspace');
    const second = await service.getFileIndex('container-1', '/workspace');

    expect(first).toEqual(['src/app.ts', 'README.md']);
    expect(second).toEqual(first);
    expect(execService.execInContainer).toHaveBeenCalledTimes(1);
  });

  it('falls back to find and filters gitignored files', async () => {
    execService.execInContainer
      .mockResolvedValueOnce({
        stdout: '',
        stderr: 'git failed',
        exitCode: 1,
      })
      .mockResolvedValueOnce({
        stdout: './src/app.ts\n./dist/app.js\n',
        stderr: '',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'dist\n',
        stderr: '',
        exitCode: 0,
      });

    await expect(
      service.getFileIndex('container-1', '/workspace'),
    ).resolves.toEqual(['src/app.ts']);
  });

  it('returns an empty index when git and find both fail', async () => {
    execService.execInContainer
      .mockResolvedValueOnce({
        stdout: '',
        stderr: 'git failed',
        exitCode: 1,
      })
      .mockResolvedValueOnce({
        stdout: '',
        stderr: 'find failed',
        exitCode: 1,
      });

    await expect(
      service.getFileIndex('container-1', '/workspace'),
    ).resolves.toEqual([]);
  });
});
