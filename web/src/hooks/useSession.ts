import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import { useSessionStore } from '../stores/session.store';
import type { CreateSessionRequest } from '../api/types';

export const useSession = () => {
  const {
    sessions,
    currentSession,
    isLoading: storeLoading,
    error,
    setCurrentSession,
    setError,
  } = useSessionStore();

  // Query to list all sessions
  const {
    isLoading: queryLoading,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.listSessions(),
  });

  // Query to get a specific session
  const getSessionQuery = (sessionId: string) => 
    useQuery({
      queryKey: ['session', sessionId],
      queryFn: () => sessionsApi.getSession(sessionId),
      enabled: !!sessionId,
    });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (request: CreateSessionRequest) => sessionsApi.createSession(request),
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.startSession(sessionId),
  });

  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.stopSession(sessionId),
  });

  // Restart session mutation
  const restartSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.restartSession(sessionId),
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.deleteSession(sessionId),
  });

  const isLoading = storeLoading || queryLoading;

  return {
    // State
    sessions,
    currentSession,
    isLoading,
    error,
    
    // Actions
    createSession: createSessionMutation.mutate,
    startSession: startSessionMutation.mutate,
    stopSession: stopSessionMutation.mutate,
    restartSession: restartSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    refetchSessions,
    getSession: getSessionQuery,
    setCurrentSession,
    clearError: () => setError(null),
    
    // Mutation states
    isCreating: createSessionMutation.isPending,
    isStarting: startSessionMutation.isPending,
    isStopping: stopSessionMutation.isPending,
    isRestarting: restartSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
  };
};