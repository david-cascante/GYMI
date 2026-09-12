import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSettings,
  setTheme,
  setDefaultRestSeconds,
} from '@/repositories/settingsRepository';
import type { AppSettings, ThemeMode } from '@/types/entities';
import { useDatabaseReady } from './DatabaseContext';

interface SettingsContextValue extends AppSettings {
  refresh: () => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateDefaultRestSeconds: (seconds: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabaseReady();
  const [settings, setSettings] = useState<AppSettings>({
    weightUnit: 'kg',
    theme: 'dark',
    defaultRestSeconds: 90,
  });

  const refresh = useCallback(async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const updateTheme = async (theme: ThemeMode) => {
    await setTheme(theme);
    await refresh();
  };

  const updateDefaultRestSeconds = async (seconds: number) => {
    await setDefaultRestSeconds(seconds);
    await refresh();
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        refresh,
        updateTheme,
        updateDefaultRestSeconds,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
