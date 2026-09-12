import type * as SQLite from 'expo-sqlite';

const CURRENT_SCHEMA_VERSION = 2;

export async function ensureSetsWeightUnitColumn(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const setsTable = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sets'"
  );
  if (!setsTable) return;

  const column = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM pragma_table_info('sets') WHERE name = 'weight_unit'"
  );
  if (!column) {
    await db.execAsync(
      "ALTER TABLE sets ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'kg'"
    );
  }
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureSetsWeightUnitColumn(db);

  await db.execAsync(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`);

  await db.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('schema_version', ?)",
    [String(CURRENT_SCHEMA_VERSION)]
  );
}
