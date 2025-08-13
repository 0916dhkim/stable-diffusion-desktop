import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const generations = sqliteTable("generations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  seed: integer("seed"),
  steps: integer("steps"),
  guidance: real("guidance"),
  width: integer("width"),
  height: integer("height"),
  imagePath: text("image_path").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const projectInfo = sqliteTable("project_info", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type ProjectInfo = typeof projectInfo.$inferSelect;
export type NewProjectInfo = typeof projectInfo.$inferInsert;
