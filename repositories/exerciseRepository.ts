import { getDatabase } from '@/database/client';
import type { Exercise } from '@/types/entities';
import { nowISO } from '@/utils/date';

interface ExerciseRow {
  id: number;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  photo_uri: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    photoUri: row.photo_uri,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    'SELECT * FROM exercises ORDER BY name ASC'
  );
  return rows.map(mapExercise);
}

export async function getExerciseById(id: number): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExerciseRow>(
    'SELECT * FROM exercises WHERE id = ?',
    [id]
  );
  return row ? mapExercise(row) : null;
}

export async function createExercise(data: {
  name: string;
  muscleGroup?: string;
  equipment?: string;
  description?: string;
  notes?: string;
}): Promise<number> {
  const db = await getDatabase();
  const now = nowISO();
  const result = await db.runAsync(
    `INSERT INTO exercises (name, muscle_group, equipment, description, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.muscleGroup ?? null,
      data.equipment ?? null,
      data.description ?? null,
      data.notes ?? null,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateExercise(
  id: number,
  data: {
    name: string;
    muscleGroup?: string | null;
    equipment?: string | null;
    description?: string | null;
    notes?: string | null;
    photoUri?: string | null;
  }
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE exercises SET name = ?, muscle_group = ?, equipment = ?,
     description = ?, notes = ?, photo_uri = COALESCE(?, photo_uri), updated_at = ?
     WHERE id = ?`,
    [
      data.name,
      data.muscleGroup ?? null,
      data.equipment ?? null,
      data.description ?? null,
      data.notes ?? null,
      data.photoUri ?? null,
      nowISO(),
      id,
    ]
  );
}

export async function updateExercisePhoto(id: number, photoUri: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE exercises SET photo_uri = ?, updated_at = ? WHERE id = ?',
    [photoUri, nowISO(), id]
  );
}

export async function deleteExercise(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}

export async function getExerciseUsageCount(id: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM workout_day_exercises WHERE exercise_id = ?',
    [id]
  );
  return row?.cnt ?? 0;
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name ASC',
    [`%${query}%`]
  );
  return rows.map(mapExercise);
}
