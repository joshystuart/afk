import { apiClient } from './client';
import type {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  ListSessionsResponse,
} from './types';

export const sessionsApi = {
  // Create a new session
  createSession: async (request: CreateSessionRequest): Promise<CreateSessionResponse> => {
    const response = await apiClient.post('/sessions', request);
    return response as unknown as CreateSessionResponse;
  },

  // List all sessions with pagination  
  listSessions: async (page = 1, limit = 10): Promise<Session[]> => {
    const response = await apiClient.get(`/sessions?page=${page}&limit=${limit}`);
    // The API client already unwraps to just the array of sessions
    const sessions = Array.isArray(response) ? response : [];
    
    // Transform each session to match frontend format
    return sessions.map((sessionData: any) => ({
      id: sessionData.id?.value || sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.config?.repoUrl || sessionData.repoUrl,
      branch: sessionData.config?.branch || sessionData.branch || 'main',
      terminalMode: sessionData.config?.terminalMode || sessionData.terminalMode,
      ports: sessionData.ports,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    })) as Session[];
  },

  // Get a specific session by ID
  getSession: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    // Handle nested response structure where session data is in response.session
    const sessionData = (response as any)?.session || response;
    
    // Transform the backend session structure to frontend format
    return {
      id: sessionData.id?.value || sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.config?.repoUrl || sessionData.repoUrl,
      branch: sessionData.config?.branch || sessionData.branch || 'main',
      terminalMode: sessionData.config?.terminalMode || sessionData.terminalMode,
      ports: sessionData.ports,
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

  // Get session logs
  getSessionLogs: async (sessionId: string): Promise<string[]> => {
    const response = await apiClient.get(`/sessions/${sessionId}/logs`);
    return (response as unknown as { logs: string[] }).logs;
  },
};