import { ContainerHealth } from '../../domain/containers/container.entity';
import { DockerClientService } from './docker-client.service';
import { DockerContainerReadinessService } from './docker-container-readiness.service';
import { DockerContainerStateService } from './docker-container-state.service';

describe('DockerContainerReadinessService', () => {
  let service: DockerContainerReadinessService;
  let dockerClient: jest.Mocked<DockerClientService>;
  let dockerContainerState: jest.Mocked<DockerContainerStateService>;

  beforeEach(() => {
    dockerClient = {
      getClient: jest.fn(),
    } as unknown as jest.Mocked<DockerClientService>;

    dockerContainerState = {
      getContainerInfo: jest.fn(),
    } as unknown as jest.Mocked<DockerContainerStateService>;

    service = new DockerContainerReadinessService(
      dockerClient,
      dockerContainerState,
    );
  });

  it('waits for the container to be running and healthy', async () => {
    dockerContainerState.getContainerInfo
      .mockResolvedValueOnce({
        state: 'created',
        health: ContainerHealth.UNKNOWN,
      } as any)
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.STARTING,
      } as any)
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.HEALTHY,
      } as any);

    await expect(
      service.waitForContainerReady('container-1', {
        maxWaitMs: 100,
        pollMs: 0,
      }),
    ).resolves.toBeUndefined();

    expect(dockerContainerState.getContainerInfo).toHaveBeenCalledTimes(3);
  });

  it('fails after repeated unhealthy checks', async () => {
    dockerContainerState.getContainerInfo
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.STARTING,
      } as any)
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.UNHEALTHY,
      } as any)
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.UNHEALTHY,
      } as any)
      .mockResolvedValueOnce({
        state: 'running',
        health: ContainerHealth.UNHEALTHY,
      } as any);

    await expect(
      service.waitForContainerReady('container-1', {
        maxWaitMs: 100,
        pollMs: 0,
      }),
    ).rejects.toThrow('Container container-1 reported unhealthy');
  });

  it('waits for docker connectivity before returning ready', async () => {
    const docker = {
      ping: jest.fn().mockResolvedValue(undefined),
      listContainers: jest.fn().mockResolvedValue([]),
    };

    dockerClient.getClient.mockResolvedValue(docker as any);

    await expect(
      service.waitForDockerReady({ maxWaitMs: 100, initialDelayMs: 1 }),
    ).resolves.toBeUndefined();

    expect(docker.ping).toHaveBeenCalledTimes(1);
    expect(docker.listContainers).toHaveBeenCalledWith({ limit: 1 });
  });
});
