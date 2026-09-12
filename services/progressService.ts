import { getDatabase } from '@/database/client';
import { normalizeWeightUnit } from '@/services/weightService';
import type {
  ExerciseProgress,
  PersonalRecord,
  ProgressDataPoint,
  NewPR,
  WeightUnit,
} from '@/types/entities';

export async function getAllExerciseProgress(): Promise<ExerciseProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    exercise_id: number;
    exercise_name: string;
    last_weight: number | null;
    last_weight_unit: string | null;
    max_weight: number | null;
    max_weight_unit: string | null;
    max_reps: number | null;
    total_volume: number;
    session_count: number;
  }>(`
    SELECT
      e.id as exercise_id,
      e.name as exercise_name,
      (SELECT s.weight_grams FROM sets s
       JOIN exercise_sessions es ON es.id = s.exercise_session_id
       JOIN workout_sessions ws ON ws.id = es.workout_session_id
       WHERE es.exercise_id = e.id AND ws.status = 'completed'
       ORDER BY s.completed_at DESC LIMIT 1) as last_weight,
      (SELECT s.weight_unit FROM sets s
       JOIN exercise_sessions es ON es.id = s.exercise_session_id
       JOIN workout_sessions ws ON ws.id = es.workout_session_id
       WHERE es.exercise_id = e.id AND ws.status = 'completed'
       ORDER BY s.completed_at DESC LIMIT 1) as last_weight_unit,
      MAX(s.weight_grams) as max_weight,
      (SELECT s.weight_unit FROM sets s
       JOIN exercise_sessions es2 ON es2.id = s.exercise_session_id
       JOIN workout_sessions ws2 ON ws2.id = es2.workout_session_id
       WHERE es2.exercise_id = e.id AND ws2.status = 'completed'
       ORDER BY s.weight_grams DESC, s.completed_at DESC LIMIT 1) as max_weight_unit,
      MAX(s.reps) as max_reps,
      SUM(s.weight_grams * s.reps) as total_volume,
      COUNT(DISTINCT ws.id) as session_count
    FROM exercises e
    LEFT JOIN exercise_sessions es ON es.exercise_id = e.id
    LEFT JOIN workout_sessions ws ON ws.id = es.workout_session_id AND ws.status = 'completed'
    LEFT JOIN sets s ON s.exercise_session_id = es.id
    GROUP BY e.id
    HAVING session_count > 0
    ORDER BY e.name ASC
  `);

  return rows.map((row) => ({
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    lastWeightGrams: row.last_weight,
    lastWeightUnit: normalizeWeightUnit(row.last_weight_unit),
    maxWeightGrams: row.max_weight,
    maxWeightUnit: normalizeWeightUnit(row.max_weight_unit),
    maxReps: row.max_reps,
    totalVolume: row.total_volume ?? 0,
    sessionCount: row.session_count,
  }));
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    exercise_id: number;
    exercise_name: string;
    max_weight: number;
    max_weight_unit: string | null;
    max_reps: number;
    max_volume: number;
  }>(`
    SELECT
      e.id as exercise_id,
      e.name as exercise_name,
      MAX(s.weight_grams) as max_weight,
      (SELECT s2.weight_unit FROM sets s2
       JOIN exercise_sessions es2 ON es2.id = s2.exercise_session_id
       JOIN workout_sessions ws2 ON ws2.id = es2.workout_session_id
       WHERE es2.exercise_id = e.id AND ws2.status = 'completed'
       ORDER BY s2.weight_grams DESC, s2.completed_at DESC LIMIT 1) as max_weight_unit,
      MAX(s.reps) as max_reps,
      MAX(s.weight_grams * s.reps) as max_volume
    FROM exercises e
    JOIN exercise_sessions es ON es.exercise_id = e.id
    JOIN workout_sessions ws ON ws.id = es.workout_session_id AND ws.status = 'completed'
    JOIN sets s ON s.exercise_session_id = es.id
    GROUP BY e.id
    ORDER BY max_weight DESC
  `);

  return rows.map((row) => ({
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    maxWeightGrams: row.max_weight,
    maxWeightUnit: normalizeWeightUnit(row.max_weight_unit),
    maxReps: row.max_reps,
    maxVolume: row.max_volume,
  }));
}

export async function getLastWeightUnitForExercise(exerciseId: number): Promise<WeightUnit> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ weight_unit: string }>(
    `SELECT s.weight_unit
     FROM sets s
     JOIN exercise_sessions es ON es.id = s.exercise_session_id
     WHERE es.exercise_id = ?
     ORDER BY s.completed_at DESC
     LIMIT 1`,
    [exerciseId]
  );
  return normalizeWeightUnit(row?.weight_unit);
}

export async function getExerciseProgressData(
  exerciseId: number
): Promise<ProgressDataPoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    date: string;
    weight_grams: number;
    reps: number;
    volume: number;
  }>(`
    SELECT
      DATE(s.completed_at) as date,
      MAX(s.weight_grams) as weight_grams,
      MAX(s.reps) as reps,
      SUM(s.weight_grams * s.reps) as volume
    FROM sets s
    JOIN exercise_sessions es ON es.id = s.exercise_session_id
    JOIN workout_sessions ws ON ws.id = es.workout_session_id
    WHERE es.exercise_id = ? AND ws.status = 'completed'
    GROUP BY DATE(s.completed_at)
    ORDER BY date ASC
  `, [exerciseId]);

  return rows.map((row) => ({
    date: row.date,
    weightGrams: row.weight_grams,
    reps: row.reps,
    volume: row.volume,
  }));
}

export async function detectNewPRs(
  exerciseId: number,
  weightGrams: number,
  reps: number,
  excludeSessionId?: number
): Promise<NewPR[]> {
  const db = await getDatabase();
  const volume = weightGrams * reps;

  const historical = await db.getFirstAsync<{
    max_weight: number;
    max_reps: number;
    max_volume: number;
  }>(`
    SELECT
      MAX(s.weight_grams) as max_weight,
      MAX(s.reps) as max_reps,
      MAX(s.weight_grams * s.reps) as max_volume
    FROM sets s
    JOIN exercise_sessions es ON es.id = s.exercise_session_id
    JOIN workout_sessions ws ON ws.id = es.workout_session_id
    WHERE es.exercise_id = ? AND ws.status = 'completed'
    ${excludeSessionId ? 'AND ws.id != ?' : ''}
  `, excludeSessionId ? [exerciseId, excludeSessionId] : [exerciseId]);

  const exercise = await db.getFirstAsync<{ name: string }>(
    'SELECT name FROM exercises WHERE id = ?',
    [exerciseId]
  );
  if (!exercise) return [];

  const newPRs: NewPR[] = [];
  const prevMaxWeight = historical?.max_weight ?? 0;
  const prevMaxReps = historical?.max_reps ?? 0;
  const prevMaxVolume = historical?.max_volume ?? 0;

  if (weightGrams > prevMaxWeight) {
    newPRs.push({ type: 'weight', exerciseName: exercise.name, value: weightGrams });
  }
  if (reps > prevMaxReps) {
    newPRs.push({ type: 'reps', exerciseName: exercise.name, value: reps });
  }
  if (volume > prevMaxVolume) {
    newPRs.push({ type: 'volume', exerciseName: exercise.name, value: volume });
  }

  return newPRs;
}
