interface ElectronAPI {
  platform: string;
  versions: { electron: string; node: string; chrome: string };
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
