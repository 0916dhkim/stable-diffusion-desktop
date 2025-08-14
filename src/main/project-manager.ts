import { createClient } from "@libsql/client";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { existsSync, mkdirSync } from "fs";
import { basename, join } from "path";
import { migrate } from "../db/migrate";
import { Generation, generations, projectInfo } from "../db/schema";

export interface Project {
  name: string;
  path: string;
  createdAt: string;
  lastOpened: string;
}

class ProjectManager {
  private db: ReturnType<typeof drizzle> | null = null;
  private client: ReturnType<typeof createClient> | null = null;
  private currentProjectPath: string | null = null;

  // Get project info from a project directory
  async getProjectInfo(projectPath: string): Promise<Project | null> {
    const dbPath = join(projectPath, "project.db");

    if (!existsSync(dbPath)) {
      return null;
    }

    try {
      const client = createClient({
        url: `file:${dbPath}`,
      });
      const db = drizzle(client);

      const projectData = await db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "name"));
      const createdAtData = await db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "created_at"));
      const lastOpenedData = await db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "last_opened"));

      client.close();

      return {
        name: projectData[0]?.value || basename(projectPath),
        path: projectPath,
        createdAt: createdAtData[0]?.value || "",
        lastOpened: lastOpenedData[0]?.value || "",
      };
    } catch (error) {
      console.error(`Error reading project ${projectPath}:`, error);
      return null;
    }
  }

  // Initialize database for a project
  private async initializeDatabase(dbPath: string) {
    const client = createClient({
      url: `file:${dbPath}`,
    });

    const db = drizzle(client);

    // Run the initial migration by executing the SQL directly
    await migrate(db);

    return { client, db };
  }

  // Create a new project
  async createProject(projectPath: string): Promise<Project> {
    if (!projectPath || !projectPath.trim()) {
      throw new Error("Project path cannot be empty");
    }

    const dbPath = join(projectPath, "project.db");

    if (existsSync(projectPath)) {
      // Check if it's already a project
      if (existsSync(dbPath)) {
        throw new Error("This directory is already a project");
      }
      // Directory exists but is not a project - we can use it
    } else {
      // Create the project directory
      mkdirSync(projectPath, { recursive: true });
    }

    // Create images subdirectory
    const imagesDir = join(projectPath, "images");
    mkdirSync(imagesDir, { recursive: true });

    // Create SQLite database
    const { client, db } = await this.initializeDatabase(dbPath);

    // Derive project name from folder name
    const name = basename(projectPath);

    // Insert project metadata
    const createdAt = new Date().toISOString();
    await db.insert(projectInfo).values([
      { key: "name", value: name },
      { key: "created_at", value: createdAt },
      { key: "last_opened", value: createdAt },
    ]);

    client.close();

    return {
      name,
      path: projectPath,
      createdAt,
      lastOpened: createdAt,
    };
  }

  // Open an existing project
  async openProject(projectPath: string): Promise<void> {
    const dbPath = join(projectPath, "project.db");

    if (!existsSync(dbPath)) {
      throw new Error("Project database not found");
    }

    // Close current project if any
    if (this.client && this.db) {
      this.client.close();
      this.client = null;
      this.db = null;
    }

    // Open new project
    this.client = createClient({
      url: `file:${dbPath}`,
    });
    this.db = drizzle(this.client);
    this.currentProjectPath = projectPath;

    // Update last opened timestamp
    const now = new Date().toISOString();
    await this.db
      .update(projectInfo)
      .set({ value: now })
      .where(eq(projectInfo.key, "last_opened"));
  }

  // Get current project info
  async getCurrentProject(): Promise<Project | null> {
    if (!this.db || !this.currentProjectPath) {
      return null;
    }

    try {
      const projectData = await this.db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "name"));
      const createdAtData = await this.db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "created_at"));
      const lastOpenedData = await this.db
        .select()
        .from(projectInfo)
        .where(eq(projectInfo.key, "last_opened"));

      return {
        name: projectData[0]?.value || "",
        path: this.currentProjectPath,
        createdAt: createdAtData[0]?.value || "",
        lastOpened: lastOpenedData[0]?.value || "",
      };
    } catch (error) {
      console.error("Error getting current project:", error);
      return null;
    }
  }

  // Add a generation record
  async addGeneration(
    record: Omit<Generation, "id" | "createdAt">
  ): Promise<number | null> {
    if (!this.db) {
      throw new Error("No project is currently open");
    }

    try {
      const result = await this.db
        .insert(generations)
        .values({
          prompt: record.prompt,
          negativePrompt: record.negativePrompt || null,
          model: record.model || null,
          seed: record.seed || null,
          steps: record.steps || null,
          guidance: record.guidance || null,
          width: record.width || null,
          height: record.height || null,
          imagePath: record.imagePath,
        })
        .returning({ id: generations.id });

      return result[0]?.id || null;
    } catch (error) {
      console.error("Error adding generation:", error);
      return null;
    }
  }

  // Get generation history
  async getGenerations(
    limit: number = 50,
    offset: number = 0
  ): Promise<Generation[]> {
    if (!this.db) {
      return [];
    }

    try {
      const results = await this.db
        .select()
        .from(generations)
        .orderBy(desc(generations.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map((result) => ({
        id: result.id,
        prompt: result.prompt,
        negativePrompt: result.negativePrompt,
        model: result.model,
        seed: result.seed,
        steps: result.steps,
        guidance: result.guidance,
        width: result.width,
        height: result.height,
        imagePath: result.imagePath,
        createdAt: result.createdAt,
      }));
    } catch (error) {
      console.error("Error getting generations:", error);
      return [];
    }
  }

  // Get a single generation by ID
  async getGenerationById(id: number): Promise<Generation | null> {
    if (!this.db) {
      return null;
    }
    try {
      const results = await this.db
        .select()
        .from(generations)
        .where(eq(generations.id, id));
      const result = results[0];
      if (!result) return null;
      return {
        id: result.id,
        prompt: result.prompt,
        negativePrompt: result.negativePrompt,
        model: result.model,
        seed: result.seed,
        steps: result.steps,
        guidance: result.guidance,
        width: result.width,
        height: result.height,
        imagePath: result.imagePath,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error("Error getting generation by id:", error);
      return null;
    }
  }

  // Close current project
  closeProject(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.db = null;
    }
    this.currentProjectPath = null;
  }

  // Get project images directory
  getImagesDirectory(): string | null {
    if (!this.currentProjectPath) {
      return null;
    }
    return join(this.currentProjectPath, "images");
  }
}

export const projectManager = new ProjectManager();
