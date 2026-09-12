import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getAllExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from '@/repositories/exerciseRepository';
import type { Exercise } from '@/types/entities';
import { useDatabaseReady } from './DatabaseContext';

interface ExercisesContextValue {
  exercises: Exercise[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (data: {
    name: string;
    muscleGroup?: string;
    equipment?: string;
    description?: string;
    notes?: string;
  }) => Promise<number>;
  edit: (
    id: number,
    data: {
      name: string;
      muscleGroup?: string | null;
      equipment?: string | null;
      description?: string | null;
      notes?: string | null;
      photoUri?: string | null;
    }
  ) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const ExercisesContext = createContext<ExercisesContextValue | null>(null);

export function ExercisesProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabaseReady();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllExercises();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
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

  const add = async (data: {
    name: string;
    muscleGroup?: string;
    equipment?: string;
    description?: string;
    notes?: string;
  }) => {
    const id = await createExercise(data);
    await refresh();
    return id;
  };

  const edit = async (
    id: number,
    data: {
      name: string;
      muscleGroup?: string | null;
      equipment?: string | null;
      description?: string | null;
      notes?: string | null;
      photoUri?: string | null;
    }
  ) => {
    await updateExercise(id, data);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteExercise(id);
    await refresh();
  };

  return (
    <ExercisesContext.Provider value={{ exercises, loading, refresh, add, edit, remove }}>
      {children}
    </ExercisesContext.Provider>
  );
}

export function useExercises() {
  const ctx = useContext(ExercisesContext);
  if (!ctx) throw new Error('useExercises must be used within ExercisesProvider');
  return ctx;
}
