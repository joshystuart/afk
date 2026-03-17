import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledJobsApi } from '../api/scheduled-jobs.api';
import type {
  CreateScheduledJobRequest,
  UpdateScheduledJobRequest,
  ScheduledJob,
} from '../api/types';

const JOBS_KEY = ['scheduled-jobs'];
const jobKey = (id: string) => ['scheduled-job', id];
const runsKey = (jobId: string) => ['scheduled-job-runs', jobId];

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
