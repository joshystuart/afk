import { Server, Socket } from 'socket.io';
import { ScheduledJobRepository } from '../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';
import {
  ScheduledJobGatewayResponse,
  ScheduledJobGatewayResponseFactory,
  ScheduledJobRunGatewayResponse,
} from './scheduled-job-gateway-response.factory';
import { SOCKET_EVENTS } from './session-gateway.events';
import { SessionGatewayJobRunsService } from './session-gateway-job-runs.service';

describe('SessionGatewayJobRunsService', () => {
  let service: SessionGatewayJobRunsService;
  let scheduledJobRepository: jest.Mocked<ScheduledJobRepository>;
  let scheduledJobRunRepository: jest.Mocked<ScheduledJobRunRepository>;
  let scheduledJobGatewayResponseFactory: jest.Mocked<ScheduledJobGatewayResponseFactory>;
  let client: jest.Mocked<Socket>;
  let roomEmitter: { emit: jest.Mock };
  let server: jest.Mocked<Server>;

  beforeEach(() => {
    scheduledJobRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findEnabled: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRepository>;

    scheduledJobRunRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByJobId: jest.fn(),
      findByJobIdSummaries: jest.fn(),
      findActiveByJobId: jest.fn(),
      findActiveByJobIds: jest.fn(),
      findRecentByJobId: jest.fn(),
      deleteByJobId: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunRepository>;

    scheduledJobGatewayResponseFactory = {
      createJob: jest.fn(),
      createRun: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobGatewayResponseFactory>;

    client = {
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    roomEmitter = {
      emit: jest.fn(),
    };

    server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue(roomEmitter),
    } as unknown as jest.Mocked<Server>;

    service = new SessionGatewayJobRunsService(
      scheduledJobRepository,
      scheduledJobRunRepository,
      scheduledJobGatewayResponseFactory,
    );
  });

  it('returns an error when the requested run does not exist', async () => {
    scheduledJobRunRepository.findById.mockResolvedValue(null);

    await expect(
      service.handleJobRunSubscription(client, { runId: 'run-1' }),
    ).resolves.toEqual({
      event: SOCKET_EVENTS.jobRunError,
      data: { runId: 'run-1', error: 'Scheduled job run not found' },
    });
  });

  it('emits the current run snapshot and joins the room for active runs', async () => {
    const run = { id: 'run-1', status: ScheduledJobRunStatus.RUNNING };
    const runResponse = {
      id: 'run-1',
      jobId: 'job-1',
    } as ScheduledJobRunGatewayResponse;
    scheduledJobRunRepository.findById.mockResolvedValue(run as any);
    scheduledJobGatewayResponseFactory.createRun.mockReturnValue(runResponse);

    await expect(
      service.handleJobRunSubscription(client, { runId: 'run-1' }),
    ).resolves.toEqual({
      event: SOCKET_EVENTS.jobRunSubscribed,
      data: { runId: 'run-1', active: true },
    });

    expect(client.emit).toHaveBeenCalledWith(SOCKET_EVENTS.jobRunUpdated, {
      run: runResponse,
      timestamp: expect.any(String),
    });
    expect(client.join).toHaveBeenCalledWith('job-run:run-1');
  });

  it('does not join the room for inactive runs', async () => {
    const run = { id: 'run-1', status: ScheduledJobRunStatus.COMPLETED };
    const runResponse = {
      id: 'run-1',
      jobId: 'job-1',
    } as ScheduledJobRunGatewayResponse;
    scheduledJobRunRepository.findById.mockResolvedValue(run as any);
    scheduledJobGatewayResponseFactory.createRun.mockReturnValue(runResponse);

    await expect(
      service.handleJobRunSubscription(client, { runId: 'run-1' }),
    ).resolves.toEqual({
      event: SOCKET_EVENTS.jobRunSubscribed,
      data: { runId: 'run-1', active: false },
    });

    expect(client.join).not.toHaveBeenCalled();
  });

  it('fans out stream and updated events to the correct websocket channels', async () => {
    const run = { id: 'run-1' };
    const job = { id: 'job-1' };
    const runResponse = {
      id: 'run-1',
      jobId: 'job-1',
    } as ScheduledJobRunGatewayResponse;
    const jobResponse = {
      id: 'job-1',
      name: 'Nightly',
    } as ScheduledJobGatewayResponse;
    scheduledJobRunRepository.findById.mockResolvedValue(run as any);
    scheduledJobRepository.findById.mockResolvedValue(job as any);
    scheduledJobGatewayResponseFactory.createRun.mockReturnValue(runResponse);
    scheduledJobGatewayResponseFactory.createJob.mockResolvedValue(jobResponse);

    service.handleJobRunStream(server, {
      jobId: 'job-1',
      runId: 'run-1',
      event: { type: 'stdout', chunk: 'hello' },
    });

    expect(server.to).toHaveBeenCalledWith('job-run:run-1');
    expect(roomEmitter.emit).toHaveBeenCalledWith(SOCKET_EVENTS.jobRunStream, {
      jobId: 'job-1',
      runId: 'run-1',
      event: { type: 'stdout', chunk: 'hello' },
      timestamp: expect.any(String),
    });

    await service.handleScheduledJobRunUpdated(server, {
      jobId: 'job-1',
      runId: 'run-1',
    });

    expect(roomEmitter.emit).toHaveBeenCalledWith(SOCKET_EVENTS.jobRunUpdated, {
      run: runResponse,
      timestamp: expect.any(String),
    });
    expect(server.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.scheduledJobRunUpdated,
      {
        run: runResponse,
        timestamp: expect.any(String),
      },
    );
    expect(server.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.scheduledJobUpdated,
      {
        job: jobResponse,
        timestamp: expect.any(String),
      },
    );
  });
});
