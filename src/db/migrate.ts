import { pushSQLiteSchema } from "drizzle-kit/api";
import * as schema from "./schema";
import { LibSQLDatabase } from "drizzle-orm/libsql";

export async function migrate(db: LibSQLDatabase) {
  const { apply } = await pushSQLiteSchema(schema, db);
  await apply();
}
