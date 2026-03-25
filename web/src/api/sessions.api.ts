import { apiClient } from './client';
import type {
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  GitStatus,
  CommitAndPushRequest,
  CommitAndPushResponse,
  ChatHistoryResponse,
  ChatStreamEvent,
} from './types';

export const sessionsApi = {
  // Create a new session
  createSession: async (request: CreateSessionRequest): Promise<Session> => {
    const response = await apiClient.post('/sessions', request);
    const sessionData = response as any;

    return {
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      port: sessionData.port,
      terminalUrl: sessionData.terminalUrl,
      imageId: sessionData.imageId,
      imageName: sessionData.imageName,
      hostMountPath: sessionData.hostMountPath,
      model: sessionData.model,
      agentMode: sessionData.agentMode,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    } as Session;
  },

  // List all sessions with pagination
  listSessions: async (page = 1, limit = 10): Promise<Session[]> => {
    const response = await apiClient.get(
      `/sessions?page=${page}&limit=${limit}`,
    );
    // The API client already unwraps to just the array of sessions
    const sessions = Array.isArray(response) ? response : [];

    // Transform each session to match frontend format
    return sessions.map((sessionData: any) => ({
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      port: sessionData.port,
      terminalUrl: sessionData.terminalUrl,
      imageId: sessionData.imageId,
      imageName: sessionData.imageName,
      hostMountPath: sessionData.hostMountPath,
      model: sessionData.model,
      agentMode: sessionData.agentMode,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    })) as Session[];
  },

  // Get a specific session by ID
  getSession: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    // The response now should be properly formatted from the backend
    const sessionData = response as any;

    return {
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      port: sessionData.port,
      terminalUrl: sessionData.terminalUrl,
      imageId: sessionData.imageId,
      imageName: sessionData.imageName,
      hostMountPath: sessionData.hostMountPath,
      model: sessionData.model,
      agentMode: sessionData.agentMode,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    } as Session;
  },

  // Update session fields
  updateSession: async (
    sessionId: string,
    request: UpdateSessionRequest,
  ): Promise<Session> => {
    const response = await apiClient.put(`/sessions/${sessionId}`, request);
    const sessionData = response as any;

    return {
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      port: sessionData.port,
      terminalUrl: sessionData.terminalUrl,
      imageId: sessionData.imageId,
      imageName: sessionData.imageName,
      hostMountPath: sessionData.hostMountPath,
      model: sessionData.model,
      agentMode: sessionData.agentMode,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    } as Session;
  },

  // Start a session
  startSession: async (sessionId: string): Promise<void> => {
    await apiClient.post(`/sessions/${sessionId}/start`);
  },

  // Stop a session
  stopSession: async (sessionId: string): Promise<void> => {
    await apiClient.post(`/sessions/${sessionId}/stop`);
  },

  // Restart a session
  restartSession: async (sessionId: string): Promise<void> => {
    await apiClient.post(`/sessions/${sessionId}/restart`);
  },

  // Delete a session
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/sessions/${sessionId}`);
  },

  // Clear all sessions (stop running ones, then delete all)
  clearAll: async (): Promise<{
    stopped: number;
    deleted: number;
    failed: number;
  }> => {
    const response = await apiClient.delete('/sessions/clear-all');
    return response as unknown as {
      stopped: number;
      deleted: number;
      failed: number;
    };
  },

  // Get session logs
  getSessionLogs: async (sessionId: string): Promise<string[]> => {
    const response = await apiClient.get(`/sessions/${sessionId}/logs`);
    return (response as unknown as { logs: string[] }).logs;
  },

  // Check terminal health
  checkSessionHealth: async (
    sessionId: string,
  ): Promise<{
    terminalReady: boolean;
    allReady: boolean;
  }> => {
    const response = await apiClient.get(`/sessions/${sessionId}/health`);
    return response as unknown as {
      terminalReady: boolean;
      allReady: boolean;
    };
  },

  // Get git status for a session
  getGitStatus: async (sessionId: string): Promise<GitStatus> => {
    const response = await apiClient.get(`/sessions/${sessionId}/git/status`);
    return response as unknown as GitStatus;
  },

  // Commit and push changes for a session
  commitAndPush: async (
    sessionId: string,
    request: CommitAndPushRequest,
  ): Promise<CommitAndPushResponse> => {
    const response = await apiClient.post(
      `/sessions/${sessionId}/git/commit-and-push`,
      request,
    );
    return response as unknown as CommitAndPushResponse;
  },

  getChatHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
    const response = await apiClient.get(`/sessions/${sessionId}/messages`);
    return response as unknown as ChatHistoryResponse;
  },

  getMessageStream: async (
    sessionId: string,
    messageId: string,
  ): Promise<ChatStreamEvent[]> => {
    const response = await apiClient.get(
      `/sessions/${sessionId}/messages/${messageId}/stream`,
    );
    return (response as unknown as { events: ChatStreamEvent[] }).events;
  },
};
