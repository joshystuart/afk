import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import { useSessionStore } from '../stores/session.store';
import type { CreateSessionRequest } from '../api/types';
import { useEffect } from 'react';

export const useSession = () => {
  const {
    sessions,
    currentSession,
    isLoading: storeLoading,
    error,
    setCurrentSession,
    setSessions,
    setError,
  } = useSessionStore();

  // Query to list all sessions
  const {
    data: sessionsData,
    isLoading: queryLoading,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.listSessions(),
  });

  // Update store when query data changes
  useEffect(() => {
    if (sessionsData && Array.isArray(sessionsData)) {
      setSessions(sessionsData);
    }
  }, [sessionsData, setSessions]);

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
    createSession: createSessionMutation.mutateAsync,
    startSession: startSessionMutation.mutateAsync,
    stopSession: stopSessionMutation.mutateAsync,
    restartSession: restartSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
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
    
    // Mutation errors
    createError: createSessionMutation.error,
    startError: startSessionMutation.error,
    stopError: stopSessionMutation.error,
    restartError: restartSessionMutation.error,
    deleteError: deleteSessionMutation.error,
  };
};