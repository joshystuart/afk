import { ContainerHealth } from '../../domain/containers/container.entity';
import { ContainerNotFoundError } from './container-not-found.error';
import { DockerClientService } from './docker-client.service';
import { DockerContainerStateService } from './docker-container-state.service';

describe('DockerContainerStateService', () => {
  let service: DockerContainerStateService;
  let dockerClient: jest.Mocked<DockerClientService>;

  beforeEach(() => {
    dockerClient = {
      getClient: jest.fn(),
    } as unknown as jest.Mocked<DockerClientService>;

    service = new DockerContainerStateService(dockerClient);
  });

  it('maps a missing container removal to ContainerNotFoundError', async () => {
    const error = Object.assign(new Error('missing'), {
      statusCode: 404,
      reason: 'no such container',
    });
    const docker = {
      getContainer: jest.fn().mockReturnValue({
        remove: jest.fn().mockRejectedValue(error),
      }),
    };

    dockerClient.getClient.mockResolvedValue(docker as any);

    await expect(service.removeContainer('container-1')).rejects.toBeInstanceOf(
      ContainerNotFoundError,
    );
  });

  it('returns mapped container info from inspect output', async () => {
    const docker = {
      getContainer: jest.fn().mockReturnValue({
        inspect: jest.fn().mockResolvedValue({
          Id: 'container-1',
          Name: '/container-1',
          Created: '2026-03-22T00:00:00.000Z',
          State: {
            Status: 'running',
            Health: {
              Status: ContainerHealth.HEALTHY,
            },
          },
          NetworkSettings: {
            Ports: {
              '3100/tcp': [{ HostPort: '3100' }],
            },
          },
          Config: {
            Labels: {
              'afk.managed': 'true',
            },
          },
        }),
      }),
    };

    dockerClient.getClient.mockResolvedValue(docker as any);

    await expect(service.getContainerInfo('container-1')).resolves.toEqual({
      id: 'container-1',
      name: '/container-1',
      state: 'running',
      health: ContainerHealth.HEALTHY,
      created: new Date('2026-03-22T00:00:00.000Z'),
      ports: {
        '3100/tcp': 3100,
      },
      labels: {
        'afk.managed': 'true',
      },
    });
  });
});
