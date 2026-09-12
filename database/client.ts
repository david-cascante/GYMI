import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS, DEFAULT_SETTINGS } from './schema';
import { runMigrations } from './migrations';

const DB_NAME = 'gymtracker.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  if (!initPromise) {
    initPromise = openAndMigrate()
      .then((db) => {
        dbInstance = db;
        return db;
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }

  return initPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  try {
    return await initDatabase();
  } catch (firstError) {
    console.warn('SQLite init failed, resetting database:', firstError);
    await resetDatabaseFile();
    return await initDatabase();
  }
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await ensureSchema(db);
  await db.getFirstAsync('SELECT 1 as ok');
  return db;
}

async function ensureSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  const routinesTable = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'routines'"
  );

  if (!routinesTable) {
    await db.withTransactionAsync(async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await db.execAsync(statement);
      }
      for (const setting of DEFAULT_SETTINGS) {
        await db.runAsync(
          'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
          [setting.key, setting.value]
        );
      }
    });
  }

  await runMigrations(db);
}

async function resetDatabaseFile(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
    } catch {
      // ignore
    }
  }

  dbInstance = null;
  initPromise = null;

  try {
    await SQLite.deleteDatabaseAsync(DB_NAME);
  } catch {
    // ignore
  }
}

export async function wipeDatabase(): Promise<void> {
  await resetDatabaseFile();
  await getDatabase();
}
