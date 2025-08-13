import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {
  // API key management
  getApiKey: (): Promise<string | null> => ipcRenderer.invoke("get-api-key"),
  setApiKey: (apiKey: string): Promise<void> =>
    ipcRenderer.invoke("set-api-key", apiKey),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke("has-api-key"),
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
