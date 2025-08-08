import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  const queryClient = useQueryClient();

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

  // Function to create session query (for external use)
  const useSessionQuery = (sessionId: string) => 
    useQuery({
      queryKey: ['session', sessionId],
      queryFn: () => sessionsApi.getSession(sessionId),
      enabled: !!sessionId,
    });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (request: CreateSessionRequest) => sessionsApi.createSession(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.startSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.stopSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  // Restart session mutation
  const restartSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.restartSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
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
    getSession: useSessionQuery,
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