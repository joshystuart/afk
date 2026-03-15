/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string;
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
