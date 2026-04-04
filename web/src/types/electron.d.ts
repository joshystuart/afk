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

interface ElectronAPI {
  platform: string;
  versions: { electron: string; node: string; chrome: string };
  openExternal: (url: string) => Promise<void>;
  updateTrayState: (state: TrayState) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
