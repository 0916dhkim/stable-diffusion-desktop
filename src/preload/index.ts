import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "@electron-toolkit/preload";
import { electronAPI } from "@electron-toolkit/preload";

interface Project {
  name: string;
  path: string;
  createdAt: string;
  lastOpened: string;
}

interface StableDiffusionAPI {
  // API key management
  getApiKey: () => Promise<string | null>;
  setApiKey: (apiKey: string) => Promise<void>;
  hasApiKey: () => Promise<boolean>;

  // Recent projects management
  getRecentProjects: () => Promise<Project[]>;

  // Project management
  createProject: (projectPath: string) => Promise<Project>;
  openProject: (path: string) => Promise<void>;
  getCurrentProject: () => Promise<Project | null>;
  closeProject: () => Promise<void>;

  // File dialogs
  selectProjectFolder: () => Promise<string | null>;
  selectNewProjectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: StableDiffusionAPI;
  }
}

// Custom APIs for renderer
const api = {
  // API key management
  getApiKey: (): Promise<string | null> => ipcRenderer.invoke("get-api-key"),
  setApiKey: (apiKey: string): Promise<void> =>
    ipcRenderer.invoke("set-api-key", apiKey),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke("has-api-key"),

  // Recent projects management
  getRecentProjects: (): Promise<Project[]> =>
    ipcRenderer.invoke("get-recent-projects"),

  // Project management
  createProject: (projectPath: string): Promise<Project> =>
    ipcRenderer.invoke("create-project", projectPath),
  openProject: (path: string): Promise<void> =>
    ipcRenderer.invoke("open-project", path),
  getCurrentProject: (): Promise<Project | null> =>
    ipcRenderer.invoke("get-current-project"),
  closeProject: (): Promise<void> => ipcRenderer.invoke("close-project"),

  // File dialogs
  selectProjectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("select-project-folder"),
  selectNewProjectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("select-new-project-folder"),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
