import { create } from 'zustand';
import type { Session, SessionStatus } from '../api/types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // WebSocket updates
  handleSessionStatusChange: (sessionId: string, status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  
  setSessions: (sessions: Session[]) => {
    set({ sessions, error: null });
  },
  
  setCurrentSession: (session: Session | null) => {
    set({ currentSession: session });
  },
  
  updateSession: (sessionId: string, updates: Partial<Session>) => {
    const { sessions, currentSession } = get();
    
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates, updatedAt: new Date().toISOString() }
        : session
    );
    
    const updatedCurrentSession = currentSession?.id === sessionId
      ? { ...currentSession, ...updates, updatedAt: new Date().toISOString() }
      : currentSession;
    
    set({
      sessions: updatedSessions,
      currentSession: updatedCurrentSession,
    });
  },
  
  addSession: (session: Session) => {
    const { sessions } = get();
    set({ sessions: [session, ...sessions] });
  },
  
  removeSession: (sessionId: string) => {
    const { sessions, currentSession } = get();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    const updatedCurrentSession = currentSession?.id === sessionId ? null : currentSession;
    
    set({
      sessions: updatedSessions,
      currentSession: updatedCurrentSession,
    });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  handleSessionStatusChange: (sessionId: string, status: SessionStatus) => {
    get().updateSession(sessionId, { status });
  },
}));