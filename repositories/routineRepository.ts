import { getDatabase } from '@/database/client';
import type {
  Routine,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutDayWithExercises,
  Exercise,
} from '@/types/entities';
import { nowISO } from '@/utils/date';

interface RoutineRow {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface DayRow {
  id: number;
  routine_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface WdeRow {
  id: number;
  workout_day_id: number;
  exercise_id: number;
  sort_order: number;
}

function mapRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDay(row: DayRow): WorkoutDay {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllRoutines(): Promise<Routine[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RoutineRow>(
    'SELECT * FROM routines ORDER BY sort_order ASC, created_at ASC'
  );
  return rows.map(mapRoutine);
}

export async function getRoutineById(id: number): Promise<Routine | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RoutineRow>(
    'SELECT * FROM routines WHERE id = ?',
    [id]
  );
  return row ? mapRoutine(row) : null;
}

export async function getActiveRoutine(): Promise<Routine | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RoutineRow>(
    'SELECT * FROM routines WHERE is_active = 1 LIMIT 1'
  );
  return row ? mapRoutine(row) : null;
}

export async function createRoutine(name: string, description?: string): Promise<number> {
  const db = await getDatabase();
  const now = nowISO();
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM routines'
  );
  const result = await db.runAsync(
    `INSERT INTO routines (name, description, is_active, sort_order, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?, ?)`,
    [name, description ?? null, count?.cnt ?? 0, now, now]
  );
  return result.lastInsertRowId;
}

export async function updateRoutine(
  id: number,
  name: string,
  description?: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE routines SET name = ?, description = ?, updated_at = ? WHERE id = ?',
    [name, description ?? null, nowISO(), id]
  );
}

export async function deleteRoutine(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);
}

export async function setActiveRoutine(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE routines SET is_active = 0');
  await db.runAsync('UPDATE routines SET is_active = 1 WHERE id = ?', [id]);
}

export async function getDaysByRoutine(routineId: number): Promise<WorkoutDay[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DayRow>(
    'SELECT * FROM workout_days WHERE routine_id = ? ORDER BY sort_order ASC',
    [routineId]
  );
  return rows.map(mapDay);
}

export async function createWorkoutDay(routineId: number, name: string): Promise<number> {
  const db = await getDatabase();
  const now = nowISO();
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM workout_days WHERE routine_id = ?',
    [routineId]
  );
  const result = await db.runAsync(
    `INSERT INTO workout_days (routine_id, name, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [routineId, name, count?.cnt ?? 0, now, now]
  );
  return result.lastInsertRowId;
}

export async function updateWorkoutDay(id: number, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE workout_days SET name = ?, updated_at = ? WHERE id = ?',
    [name, nowISO(), id]
  );
}

export async function deleteWorkoutDay(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_days WHERE id = ?', [id]);
}

export async function reorderWorkoutDays(dayIds: number[]): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < dayIds.length; i++) {
    await db.runAsync(
      'UPDATE workout_days SET sort_order = ?, updated_at = ? WHERE id = ?',
      [i, nowISO(), dayIds[i]]
    );
  }
}

export async function getDayWithExercises(dayId: number): Promise<WorkoutDayWithExercises | null> {
  const db = await getDatabase();
  const dayRow = await db.getFirstAsync<DayRow>(
    'SELECT * FROM workout_days WHERE id = ?',
    [dayId]
  );
  if (!dayRow) return null;

  interface WdeWithExercise extends WdeRow {
    name: string;
    muscle_group: string | null;
    equipment: string | null;
    photo_uri: string | null;
    description: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }

  const wdeRows = await db.getAllAsync<WdeWithExercise>(
    `SELECT wde.*, e.name, e.muscle_group, e.equipment, e.photo_uri,
            e.description, e.notes, e.created_at, e.updated_at
     FROM workout_day_exercises wde
     JOIN exercises e ON e.id = wde.exercise_id
     WHERE wde.workout_day_id = ?
     ORDER BY wde.sort_order ASC`,
    [dayId]
  );

  const exercises: WorkoutDayExercise[] = wdeRows.map((row) => ({
    id: row.id,
    workoutDayId: row.workout_day_id,
    exerciseId: row.exercise_id,
    sortOrder: row.sort_order,
    exercise: {
      id: row.exercise_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      equipment: row.equipment,
      photoUri: row.photo_uri,
      description: row.description,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  }));

  return { ...mapDay(dayRow), exercises };
}

export async function addExerciseToDay(
  dayId: number,
  exerciseId: number
): Promise<number> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM workout_day_exercises WHERE workout_day_id = ?',
    [dayId]
  );
  const result = await db.runAsync(
    'INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order) VALUES (?, ?, ?)',
    [dayId, exerciseId, count?.cnt ?? 0]
  );
  return result.lastInsertRowId;
}

export async function removeExerciseFromDay(wdeId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_day_exercises WHERE id = ?', [wdeId]);
}

export async function reorderDayExercises(wdeIds: number[]): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < wdeIds.length; i++) {
    await db.runAsync(
      'UPDATE workout_day_exercises SET sort_order = ? WHERE id = ?',
      [i, wdeIds[i]]
    );
  }
}

export async function getDayExerciseCount(dayId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM workout_day_exercises WHERE workout_day_id = ?',
    [dayId]
  );
  return row?.cnt ?? 0;
}

export async function getWorkoutDayById(id: number): Promise<WorkoutDay | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DayRow>('SELECT * FROM workout_days WHERE id = ?', [id]);
  return row ? mapDay(row) : null;
}
