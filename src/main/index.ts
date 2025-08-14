import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import { projectManager, Project } from "./project-manager";

const CONFIG_FILE_NAME = "config.json";

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
  recentProjects?: string[];
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
// Helper function to add project to recent list
const addToRecentProjects = async (projectPath: string): Promise<void> => {
  const config = await loadConfig();
  let recentProjects = config.recentProjects || [];

  // Remove if already exists
  recentProjects = recentProjects.filter((path) => path !== projectPath);

  // Add to front
  recentProjects.unshift(projectPath);

  // Keep only last 10
  recentProjects = recentProjects.slice(0, 10);

  config.recentProjects = recentProjects;
  await saveConfig(config);
};

app.whenReady().then(async () => {
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

  // Recent projects management
  ipcMain.handle("get-recent-projects", async (): Promise<Project[]> => {
    const config = await loadConfig();
    const recentProjects = config.recentProjects || [];
    const validProjects: Project[] = [];

    for (const projectPath of recentProjects) {
      if (
        existsSync(projectPath) &&
        existsSync(join(projectPath, "project.db"))
      ) {
        try {
          const projectInfo = await projectManager.getProjectInfo(projectPath);
          if (projectInfo) {
            validProjects.push(projectInfo);
          }
        } catch (error) {
          console.error(`Error reading project ${projectPath}:`, error);
        }
      }
    }

    return validProjects;
  });

  ipcMain.handle(
    "select-new-project-folder",
    async (): Promise<string | null> => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory"],
        title: "Select or Create Project Folder",
        buttonLabel: "Select Folder",
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    }
  );

  // Project management IPC handlers
  ipcMain.handle(
    "create-project",
    async (_, projectPath: string): Promise<Project> => {
      const project = await projectManager.createProject(projectPath);
      await addToRecentProjects(project.path);
      return project;
    }
  );

  ipcMain.handle("open-project", async (_, path: string): Promise<void> => {
    await projectManager.openProject(path);
    await addToRecentProjects(path);
  });

  ipcMain.handle("get-current-project", async (): Promise<Project | null> => {
    return await projectManager.getCurrentProject();
  });

  ipcMain.handle("close-project", async (): Promise<void> => {
    projectManager.closeProject();
  });

  ipcMain.handle("select-project-folder", async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Project Folder",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Image generation (SD 3.5) IPC handler
  ipcMain.handle(
    "generate-image",
    async (
      _,
      input: {
        prompt: string;
        negativePrompt?: string;
        steps?: number;
        cfgScale?: number;
        width?: number;
        height?: number;
        seed?: string;
        model?: string;
      }
    ): Promise<{ id: number; imagePath: string }> => {
      // Validate API key
      const config = await loadConfig();
      const apiKey = config.apiKey?.trim();
      if (!apiKey) {
        throw new Error("API key is not set. Please add it in Settings.");
      }

      // Validate project context
      const project = await projectManager.getCurrentProject();
      const imagesDir = projectManager.getImagesDirectory();
      if (!project || !imagesDir) {
        throw new Error("No project is open.");
      }

      // Map size to aspect_ratio expected by SD 3.5
      const toAspectRatio = (w?: number, h?: number): string => {
        if (!w || !h) return "1:1";
        if (w === h) return "1:1";
        if (w === 1152 && h === 896) return "9:7";
        if (w === 896 && h === 1152) return "7:9";
        const ratio = w / h;
        // Closest common ratios
        const candidates: Array<{ r: number; s: string }> = [
          { r: 16 / 9, s: "16:9" },
          { r: 9 / 16, s: "9:16" },
          { r: 4 / 3, s: "4:3" },
          { r: 3 / 4, s: "3:4" },
          { r: 3 / 2, s: "3:2" },
          { r: 2 / 3, s: "2:3" },
          { r: 5 / 4, s: "5:4" },
          { r: 4 / 5, s: "4:5" },
        ];
        let best = candidates[0];
        let bestDiff = Math.abs(ratio - best.r);
        for (let i = 1; i < candidates.length; i++) {
          const diff = Math.abs(ratio - candidates[i].r);
          if (diff < bestDiff) {
            best = candidates[i];
            bestDiff = diff;
          }
        }
        return best.s;
      };

      // Build request form
      const aspectRatio = toAspectRatio(input.width, input.height);
      const model = input.model?.trim() || "sd3.5-large";

      // Use global fetch/FormData with loose typing to avoid DOM lib dependency
      const fetchApi = (global as any).fetch as (
        input: any,
        init?: any
      ) => Promise<any>;
      const FormDataCtor = (global as any).FormData as any;

      if (!fetchApi || !FormDataCtor) {
        throw new Error("Fetch/FormData not available in main process.");
      }

      const form = new FormDataCtor();
      form.set("prompt", input.prompt);
      if (input.negativePrompt)
        form.set("negative_prompt", input.negativePrompt);
      if (input.seed && input.seed.trim().length > 0) {
        form.set("seed", String(parseInt(input.seed, 10)));
      }
      form.set("output_format", "png");
      form.set("model", model);
      form.set("aspect_ratio", aspectRatio);

      const response = await fetchApi(
        "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "image/*",
          },
          body: form,
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        throw new Error(`Generation failed (${response.status}): ${msg}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Save the image to disk
      const pad = (n: number) => String(n).padStart(2, "0");
      const now = new Date();
      const name = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(
        now.getSeconds()
      )}_${Math.random().toString(36).slice(2, 8)}.png`;
      const imagePath = join(imagesDir, name);
      await fs.writeFile(imagePath, buffer);

      // Record in database
      const id =
        (await projectManager.addGeneration({
          prompt: input.prompt,
          negativePrompt: input.negativePrompt || null,
          seed:
            input.seed && input.seed.trim().length > 0
              ? parseInt(input.seed, 10)
              : null,
          steps: input.steps ?? null,
          guidance: input.cfgScale ?? null,
          width: input.width ?? null,
          height: input.height ?? null,
          imagePath,
        })) || 0;

      // Notify renderers
      for (const win of BrowserWindow.getAllWindows()) {
        try {
          win.webContents.send("generation-created", { id, imagePath });
        } catch {
          // noop
        }
      }

      return { id, imagePath };
    }
  );

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
