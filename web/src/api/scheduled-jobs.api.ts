import { apiClient } from './client';
import type {
  ScheduledJob,
  ScheduledJobRun,
  CreateScheduledJobRequest,
  UpdateScheduledJobRequest,
  ChatStreamEvent,
} from './types';

const BASE = '/scheduled-jobs';

export const scheduledJobsApi = {
  create: async (request: CreateScheduledJobRequest): Promise<ScheduledJob> => {
    const response = await apiClient.post(BASE, request);
    return response as unknown as ScheduledJob;
  },

  list: async (): Promise<ScheduledJob[]> => {
    const response = await apiClient.get(BASE);
    return (Array.isArray(response) ? response : []) as ScheduledJob[];
  },

  get: async (id: string): Promise<ScheduledJob> => {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response as unknown as ScheduledJob;
  },

  update: async (
    id: string,
    request: UpdateScheduledJobRequest,
  ): Promise<ScheduledJob> => {
    const response = await apiClient.put(`${BASE}/${id}`, request);
    return response as unknown as ScheduledJob;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  clearAll: async (): Promise<{ deleted: number; failed: number }> => {
    const response = await apiClient.delete(`${BASE}/clear-all`);
    return response as unknown as { deleted: number; failed: number };
  },

  listRuns: async (jobId: string): Promise<ScheduledJobRun[]> => {
    const response = await apiClient.get(`${BASE}/${jobId}/runs`);
    return (Array.isArray(response) ? response : []) as ScheduledJobRun[];
  },

  trigger: async (id: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/trigger`);
  },

  getRunStream: async (runId: string): Promise<ChatStreamEvent[]> => {
    const response = await apiClient.get(`${BASE}/runs/${runId}/stream`);
    return (response as unknown as { events: ChatStreamEvent[] }).events;
  },
};
