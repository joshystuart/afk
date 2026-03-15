import { useMemo } from 'react';

export function useIsElectronMac(): boolean {
  return useMemo(() => window.electronAPI?.platform === 'darwin', []);
}
