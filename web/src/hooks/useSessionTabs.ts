import { useState, useCallback } from 'react';

export interface SessionTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
  disabled?: boolean;
}

const STORAGE_KEY_PREFIX = 'afk:session-tab:';
const DEFAULT_TAB = 'chat';

export const useSessionTabs = (sessionId: string) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return (
        sessionStorage.getItem(STORAGE_KEY_PREFIX + sessionId) ?? DEFAULT_TAB
      );
    } catch {
      return DEFAULT_TAB;
    }
  });

  const switchTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      try {
        sessionStorage.setItem(STORAGE_KEY_PREFIX + sessionId, tabId);
      } catch {
        // sessionStorage may be unavailable in some contexts
      }
    },
    [sessionId],
  );

  return { activeTab, switchTab };
};
