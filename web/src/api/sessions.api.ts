import { apiClient } from './client';
import type {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
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
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      terminalMode: sessionData.terminalMode,
      ports: sessionData.ports,
      terminalUrls: sessionData.terminalUrls,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    })) as Session[];
  },

  // Get a specific session by ID
  getSession: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    // The response now should be properly formatted from the backend
    const sessionData = response as any;
    
    // Transform the backend session structure to frontend format
    return {
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      repoUrl: sessionData.repoUrl,
      branch: sessionData.branch || 'main',
      terminalMode: sessionData.terminalMode,
      ports: sessionData.ports,
      terminalUrls: sessionData.terminalUrls,
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

  // Check terminal health
  checkSessionHealth: async (sessionId: string): Promise<{
    claudeTerminalReady: boolean;
    manualTerminalReady: boolean;
    allReady: boolean;
  }> => {
    const response = await apiClient.get(`/sessions/${sessionId}/health`);
    return response as {
      claudeTerminalReady: boolean;
      manualTerminalReady: boolean;
      allReady: boolean;
    };
  },
};