import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { promises as fs } from "fs";
import { existsSync } from "fs";

const CONFIG_FILE_NAME = "stable-diffusion-desktop.config.json";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// Storage functions for API key management
const getStorageFilePath = (): string => {
  return join(app.getPath("userData"), CONFIG_FILE_NAME);
};

interface ConfigData {
  apiKey?: string;
}

const loadConfig = async (): Promise<ConfigData> => {
  const configPath = getStorageFilePath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading config file:", error);
    return {};
  }
};

const saveConfig = async (config: ConfigData): Promise<void> => {
  const configPath = getStorageFilePath();

  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error writing config file:", error);
    throw error;
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  // API key management IPC handlers
  ipcMain.handle("get-api-key", async (): Promise<string | null> => {
    const config = await loadConfig();
    return config.apiKey || null;
  });

  ipcMain.handle("set-api-key", async (_, apiKey: string): Promise<void> => {
    const config = await loadConfig();
    config.apiKey = apiKey;
    await saveConfig(config);
  });

  ipcMain.handle("has-api-key", async (): Promise<boolean> => {
    const config = await loadConfig();
    return !!config.apiKey && config.apiKey.trim().length > 0;
  });

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
