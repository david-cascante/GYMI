import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getAllRoutines,
  getActiveRoutine,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  setActiveRoutine,
} from '@/repositories/routineRepository';
import type { Routine } from '@/types/entities';
import { useDatabaseReady } from './DatabaseContext';

interface RoutinesContextValue {
  routines: Routine[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (name: string, description?: string) => Promise<number>;
  edit: (id: number, name: string, description?: string | null) => Promise<void>;
  remove: (id: number) => Promise<void>;
  activate: (id: number) => Promise<void>;
}

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabaseReady();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      refresh().catch(() => undefined);
    }
  }, [isReady, refresh]);

  const add = async (name: string, description?: string) => {
    const id = await createRoutine(name, description);
    const active = await getActiveRoutine();
    if (!active) await setActiveRoutine(id);
    await refresh();
    return id;
  };

  const edit = async (id: number, name: string, description?: string | null) => {
    await updateRoutine(id, name, description);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteRoutine(id);
    await refresh();
  };

  const activate = async (id: number) => {
    await setActiveRoutine(id);
    await refresh();
  };

  return (
    <RoutinesContext.Provider value={{ routines, loading, refresh, add, edit, remove, activate }}>
      {children}
    </RoutinesContext.Provider>
  );
}

export function useRoutines() {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be used within RoutinesProvider');
  return ctx;
}
