import { getDatabase } from '@/database/client';
import type { AppSettings, ThemeMode, WeightUnit } from '@/types/entities';

const DEFAULTS: AppSettings = {
  weightUnit: 'kg',
  theme: 'dark',
  defaultRestSeconds: 90,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings'
  );

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    weightUnit: (map.weight_unit as WeightUnit) ?? DEFAULTS.weightUnit,
    theme: (map.theme as ThemeMode) ?? DEFAULTS.theme,
    defaultRestSeconds: parseInt(map.default_rest_seconds ?? '90', 10),
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function setWeightUnit(unit: WeightUnit): Promise<void> {
  await setSetting('weight_unit', unit);
}

export async function setTheme(theme: ThemeMode): Promise<void> {
  await setSetting('theme', theme);
}

export async function setDefaultRestSeconds(seconds: number): Promise<void> {
  await setSetting('default_rest_seconds', String(seconds));
}

export async function getAllSettingsRaw(): Promise<Record<string, string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings'
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
