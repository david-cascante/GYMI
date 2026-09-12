import { getDatabase } from '@/database/client';
import type {
  WorkoutSession,
  ExerciseSession,
  WorkoutSet,
  SessionWithDetails,
  SessionStatus,
  LastExercisePerformance,
  WeightUnit,
} from '@/types/entities';
import { nowISO } from '@/utils/date';

interface SessionRow {
  id: number;
  routine_id: number;
  workout_day_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  status: string;
  routine_name?: string;
  day_name?: string;
}

interface ExerciseSessionRow {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  sort_order: number;
  notes: string | null;
  exercise_name?: string;
  muscle_group?: string | null;
  equipment?: string | null;
  photo_uri?: string | null;
  description?: string | null;
  exercise_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SetRow {
  id: number;
  exercise_session_id: number;
  set_number: number;
  weight_grams: number;
  weight_unit: string;
  reps: number;
  notes: string | null;
  completed_at: string;
}

function mapSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    routineId: row.routine_id,
    workoutDayId: row.workout_day_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    notes: row.notes,
    status: row.status as SessionStatus,
    routineName: row.routine_name,
    dayName: row.day_name,
  };
}

function mapSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    exerciseSessionId: row.exercise_session_id,
    setNumber: row.set_number,
    weightGrams: row.weight_grams,
    weightUnit: (row.weight_unit as WeightUnit) || 'kg',
    reps: row.reps,
    notes: row.notes,
    completedAt: row.completed_at,
  };
}

export async function getActiveSession(): Promise<WorkoutSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT ws.*, r.name as routine_name, wd.name as day_name
     FROM workout_sessions ws
     JOIN routines r ON r.id = ws.routine_id
     JOIN workout_days wd ON wd.id = ws.workout_day_id
     WHERE ws.status = 'active'
     ORDER BY ws.started_at DESC LIMIT 1`
  );
  return row ? mapSession(row) : null;
}

export async function createSession(
  routineId: number,
  workoutDayId: number
): Promise<number> {
  const db = await getDatabase();
  const now = nowISO();
  const result = await db.runAsync(
    `INSERT INTO workout_sessions (routine_id, workout_day_id, started_at, status)
     VALUES (?, ?, ?, 'active')`,
    [routineId, workoutDayId, now]
  );
  const sessionId = result.lastInsertRowId;

  const dayExercises = await db.getAllAsync<{ exercise_id: number; sort_order: number }>(
    'SELECT exercise_id, sort_order FROM workout_day_exercises WHERE workout_day_id = ? ORDER BY sort_order',
    [workoutDayId]
  );

  for (const ex of dayExercises) {
    await db.runAsync(
      'INSERT INTO exercise_sessions (workout_session_id, exercise_id, sort_order) VALUES (?, ?, ?)',
      [sessionId, ex.exercise_id, ex.sort_order]
    );
  }

  return sessionId;
}

export async function completeSession(
  sessionId: number,
  notes?: string | null
): Promise<void> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<{ started_at: string }>(
    'SELECT started_at FROM workout_sessions WHERE id = ?',
    [sessionId]
  );
  if (!session) return;

  const endedAt = nowISO();
  const durationSeconds = Math.floor(
    (new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 1000
  );

  await db.runAsync(
    `UPDATE workout_sessions SET ended_at = ?, duration_seconds = ?, notes = ?, status = 'completed'
     WHERE id = ?`,
    [endedAt, durationSeconds, notes ?? null, sessionId]
  );
}

export async function cancelSession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE workout_sessions SET status = 'cancelled', ended_at = ? WHERE id = ?",
    [nowISO(), sessionId]
  );
}

export async function updateSessionNotes(sessionId: number, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workout_sessions SET notes = ? WHERE id = ?', [notes, sessionId]);
}

export async function getSessionWithDetails(sessionId: number): Promise<SessionWithDetails | null> {
  const db = await getDatabase();
  const sessionRow = await db.getFirstAsync<SessionRow>(
    `SELECT ws.*, r.name as routine_name, wd.name as day_name
     FROM workout_sessions ws
     JOIN routines r ON r.id = ws.routine_id
     JOIN workout_days wd ON wd.id = ws.workout_day_id
     WHERE ws.id = ?`,
    [sessionId]
  );
  if (!sessionRow) return null;

  const exSessionRows = await db.getAllAsync<ExerciseSessionRow>(
    `SELECT es.*, e.name as exercise_name, e.muscle_group, e.equipment,
            e.photo_uri, e.description, e.notes as exercise_notes,
            e.created_at, e.updated_at
     FROM exercise_sessions es
     JOIN exercises e ON e.id = es.exercise_id
     WHERE es.workout_session_id = ?
     ORDER BY es.sort_order ASC`,
    [sessionId]
  );

  const exerciseSessions: ExerciseSession[] = [];
  for (const row of exSessionRows) {
    const setRows = await db.getAllAsync<SetRow>(
      'SELECT * FROM sets WHERE exercise_session_id = ? ORDER BY set_number ASC',
      [row.id]
    );
    exerciseSessions.push({
      id: row.id,
      workoutSessionId: row.workout_session_id,
      exerciseId: row.exercise_id,
      sortOrder: row.sort_order,
      notes: row.notes,
      exercise: {
        id: row.exercise_id,
        name: row.exercise_name ?? '',
        muscleGroup: row.muscle_group ?? null,
        equipment: row.equipment ?? null,
        photoUri: row.photo_uri ?? null,
        description: row.description ?? null,
        notes: row.exercise_notes ?? null,
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
      },
      sets: setRows.map(mapSet),
    });
  }

  return { ...mapSession(sessionRow), exerciseSessions };
}

export async function addSet(
  exerciseSessionId: number,
  weightGrams: number,
  reps: number,
  weightUnit: WeightUnit,
  notes?: string | null
): Promise<number> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM sets WHERE exercise_session_id = ?',
    [exerciseSessionId]
  );
  const setNumber = (count?.cnt ?? 0) + 1;
  const result = await db.runAsync(
    `INSERT INTO sets (exercise_session_id, set_number, weight_grams, weight_unit, reps, notes, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [exerciseSessionId, setNumber, weightGrams, weightUnit, reps, notes ?? null, nowISO()]
  );
  return result.lastInsertRowId;
}

export async function deleteSet(setId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sets WHERE id = ?', [setId]);
}

export async function updateSetNotes(setId: number, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sets SET notes = ? WHERE id = ?', [notes, setId]);
}

export async function updateExerciseSessionNotes(
  exerciseSessionId: number,
  notes: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE exercise_sessions SET notes = ? WHERE id = ?', [
    notes,
    exerciseSessionId,
  ]);
}

export async function getLastPerformance(
  exerciseId: number,
  excludeSessionId?: number
): Promise<LastExercisePerformance | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    weight_grams: number;
    weight_unit: string;
    reps: number;
    completed_at: string;
  }>(
    `SELECT s.weight_grams, s.weight_unit, s.reps, s.completed_at
     FROM sets s
     JOIN exercise_sessions es ON es.id = s.exercise_session_id
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE es.exercise_id = ? AND ws.status = 'completed'
     ${excludeSessionId ? 'AND ws.id != ?' : ''}
     ORDER BY s.completed_at DESC LIMIT 1`,
    excludeSessionId ? [exerciseId, excludeSessionId] : [exerciseId]
  );
  if (!row) return null;
  return {
    weightGrams: row.weight_grams,
    weightUnit: (row.weight_unit as WeightUnit) || 'kg',
    reps: row.reps,
    completedAt: row.completed_at,
  };
}

export async function getCompletedSessions(limit = 50): Promise<WorkoutSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT ws.*, r.name as routine_name, wd.name as day_name
     FROM workout_sessions ws
     JOIN routines r ON r.id = ws.routine_id
     JOIN workout_days wd ON wd.id = ws.workout_day_id
     WHERE ws.status = 'completed'
     ORDER BY ws.ended_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(mapSession);
}

export async function getLastCompletedSession(): Promise<WorkoutSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT ws.*, r.name as routine_name, wd.name as day_name
     FROM workout_sessions ws
     JOIN routines r ON r.id = ws.routine_id
     JOIN workout_days wd ON wd.id = ws.workout_day_id
     WHERE ws.status = 'completed'
     ORDER BY ws.ended_at DESC LIMIT 1`
  );
  return row ? mapSession(row) : null;
}

export async function getAllSessionsRaw(): Promise<WorkoutSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>('SELECT * FROM workout_sessions');
  return rows.map(mapSession);
}

export async function getAllExerciseSessionsRaw(): Promise<ExerciseSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseSessionRow>(
    'SELECT * FROM exercise_sessions'
  );
  return rows.map((row) => ({
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    sortOrder: row.sort_order,
    notes: row.notes,
  }));
}

export async function getAllSetsRaw(): Promise<WorkoutSet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SetRow>('SELECT * FROM sets');
  return rows.map(mapSet);
}
