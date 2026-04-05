interface TrayMenuLink {
  id: string;
  label: string;
  route: string;
}

interface TrayState {
  isAuthenticated: boolean;
  runningSessions: TrayMenuLink[];
  activeJobs: TrayMenuLink[];
  upcomingJobs: TrayMenuLink[];
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  error?: string;
  progress?: number;
}

interface ElectronUpdaterAPI {
  checkForUpdates: () => Promise<void>;
  install: () => Promise<void>;
  getState: () => Promise<UpdateState>;
  onStateChanged: (callback: (state: UpdateState) => void) => () => void;
}

interface ElectronAPI {
  platform: string;
  getAppVersion: () => Promise<string>;
  versions: { electron: string; node: string; chrome: string };
  openExternal: (url: string) => Promise<void>;
  updateTrayState: (state: TrayState) => void;
  updater: ElectronUpdaterAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
