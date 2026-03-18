import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledJobsApi } from '../api/scheduled-jobs.api';
import type {
  CreateScheduledJobRequest,
  UpdateScheduledJobRequest,
  ScheduledJob,
  ScheduledJobRun,
  ChatStreamEvent,
} from '../api/types';
import { ScheduledJobRunStatus } from '../api/types';
import { useWebSocket } from './useWebSocket';

const JOBS_KEY = ['scheduled-jobs'];
const jobKey = (id: string) => ['scheduled-job', id];
export const runsKey = (jobId: string) => ['scheduled-job-runs', jobId];

export const useScheduledJobs = () => {
  const queryClient = useQueryClient();

  const {
    data: jobs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: JOBS_KEY,
    queryFn: () => scheduledJobsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateScheduledJobRequest) =>
      scheduledJobsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateScheduledJobRequest;
    }) => scheduledJobsApi.update(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: jobKey(id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduledJobsApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: JOBS_KEY });
      const previous = queryClient.getQueryData<ScheduledJob[]>(JOBS_KEY);
      queryClient.setQueryData<ScheduledJob[]>(JOBS_KEY, (old) =>
        old ? old.filter((j) => j.id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(JOBS_KEY, context.previous);
      }
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: (id: string) => scheduledJobsApi.trigger(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: runsKey(id) });
      queryClient.invalidateQueries({ queryKey: jobKey(id) });
    },
  });

  return {
    jobs,
    isLoading,
    refetch,

    createJob: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateJob: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteJob: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    triggerJob: triggerMutation.mutateAsync,
    isTriggering: triggerMutation.isPending,
  };
};

export const useScheduledJob = (id: string) => {
  return useQuery({
    queryKey: jobKey(id),
    queryFn: () => scheduledJobsApi.get(id),
    enabled: !!id,
  });
};

export const useScheduledJobRuns = (jobId: string) => {
  return useQuery({
    queryKey: runsKey(jobId),
    queryFn: () => scheduledJobsApi.listRuns(jobId),
    enabled: !!jobId,
  });
};

export const useScheduledJobRunStream = (
  jobId: string,
  runId: string | null,
  open: boolean,
) => {
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket || !jobId || !runId || !open) {
      return;
    }

    const updateRun = (updater: (run: ScheduledJobRun) => ScheduledJobRun) => {
      queryClient.setQueryData<ScheduledJobRun[]>(runsKey(jobId), (runs) => {
        if (!runs) {
          return runs;
        }

        return runs.map((run) => (run.id === runId ? updater(run) : run));
      });
    };

    const handleRunStream = (data: {
      jobId: string;
      runId: string;
      event: ChatStreamEvent;
    }) => {
      if (data.jobId !== jobId || data.runId !== runId) {
        return;
      }

      updateRun((run) => ({
        ...run,
        status: ScheduledJobRunStatus.RUNNING,
        streamEvents: [...(run.streamEvents ?? []), data.event],
      }));
    };

    const handleRunUpdated = (data: { run: ScheduledJobRun }) => {
      if (data.run.jobId !== jobId || data.run.id !== runId) {
        return;
      }

      updateRun(() => data.run);
    };

    socket.on('job.run.stream', handleRunStream);
    socket.on('job.run.updated', handleRunUpdated);
    socket.emit('subscribe.job.run', { runId });

    return () => {
      socket.emit('unsubscribe.job.run', { runId });
      socket.off('job.run.stream', handleRunStream);
      socket.off('job.run.updated', handleRunUpdated);
    };
  }, [socket, queryClient, jobId, runId, open]);
};
