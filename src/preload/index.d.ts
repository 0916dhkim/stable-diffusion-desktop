import { ElectronAPI } from "@electron-toolkit/preload";

interface StableDiffusionAPI {
  getApiKey: () => Promise<string | null>;
  setApiKey: (apiKey: string) => Promise<void>;
  hasApiKey: () => Promise<boolean>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: StableDiffusionAPI;
  }
}
