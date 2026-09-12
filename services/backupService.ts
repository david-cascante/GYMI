import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, wipeDatabase } from '@/database/client';
import { getSettings } from '@/repositories/settingsRepository';
import { getAllRoutines, getDaysByRoutine } from '@/repositories/routineRepository';
import { getAllExercises } from '@/repositories/exerciseRepository';
import {
  getAllSessionsRaw,
  getAllExerciseSessionsRaw,
  getAllSetsRaw,
} from '@/repositories/workoutRepository';
import { photoToBase64, base64ToPhoto } from '@/services/photoService';
import type { BackupPayload, BackupPhoto } from '@/types/backup';
import type { WorkoutDayExercise } from '@/types/entities';
import { nowISO } from '@/utils/date';

async function getAllWorkoutDayExercises(): Promise<WorkoutDayExercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    workout_day_id: number;
    exercise_id: number;
    sort_order: number;
  }>('SELECT * FROM workout_day_exercises');
  return rows.map((row) => ({
    id: row.id,
    workoutDayId: row.workout_day_id,
    exerciseId: row.exercise_id,
    sortOrder: row.sort_order,
  }));
}

async function getAllWorkoutDays() {
  const routines = await getAllRoutines();
  const days = [];
  for (const routine of routines) {
    days.push(...(await getDaysByRoutine(routine.id)));
  }
  return days;
}

export async function exportBackup(): Promise<string> {
  const [
    settings,
    routines,
    workoutDays,
    workoutDayExercises,
    exercises,
    workoutSessions,
    exerciseSessions,
    sets,
  ] = await Promise.all([
    getSettings(),
    getAllRoutines(),
    getAllWorkoutDays(),
    getAllWorkoutDayExercises(),
    getAllExercises(),
    getAllSessionsRaw(),
    getAllExerciseSessionsRaw(),
    getAllSetsRaw(),
  ]);

  const photos: BackupPhoto[] = [];
  for (const exercise of exercises) {
    if (exercise.photoUri) {
      try {
        const base64 = await photoToBase64(exercise.photoUri);
        const filename = exercise.photoUri.split('/').pop() ?? `photo_${exercise.id}.jpg`;
        photos.push({ exerciseId: exercise.id, filename, base64 });
      } catch {
        // skip unreadable photos
      }
    }
  }

  const payload: BackupPayload = {
    version: 1,
    exportedAt: nowISO(),
    settings,
    routines,
    workoutDays,
    workoutDayExercises,
    exercises: exercises.map((e) => ({ ...e, photoUri: null })),
    workoutSessions,
    exerciseSessions,
    sets,
    photos,
  };

  const json = JSON.stringify(payload);
  const fileUri = `${FileSystem.cacheDirectory}gym-tracker-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar datos de GYMI',
    });
  }

  return fileUri;
}

export async function importBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { success: false, error: 'Importación cancelada' };
    }

    const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const payload = JSON.parse(json) as BackupPayload;

    if (payload.version !== 1) {
      return { success: false, error: 'Versión de backup no compatible' };
    }

    await wipeDatabase();
    const db = await getDatabase();

    await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', [
      'weight_unit',
      payload.settings.weightUnit,
    ]);
    await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', [
      'theme',
      payload.settings.theme,
    ]);
    await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', [
      'default_rest_seconds',
      String(payload.settings.defaultRestSeconds),
    ]);
    await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', [
      'schema_version',
      '1',
    ]);

    const photoUriMap = new Map<number, string>();
    for (const photo of payload.photos) {
      const uri = await base64ToPhoto(photo.base64, photo.filename);
      photoUriMap.set(photo.exerciseId, uri);
    }

    for (const routine of payload.routines) {
      await db.runAsync(
        `INSERT INTO routines (id, name, description, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          routine.id,
          routine.name,
          routine.description,
          routine.isActive ? 1 : 0,
          routine.sortOrder,
          routine.createdAt,
          routine.updatedAt,
        ]
      );
    }

    for (const day of payload.workoutDays) {
      await db.runAsync(
        `INSERT INTO workout_days (id, routine_id, name, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [day.id, day.routineId, day.name, day.sortOrder, day.createdAt, day.updatedAt]
      );
    }

    for (const exercise of payload.exercises) {
      const photoUri = photoUriMap.get(exercise.id) ?? exercise.photoUri;
      await db.runAsync(
        `INSERT INTO exercises (id, name, muscle_group, equipment, photo_uri, description, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exercise.id,
          exercise.name,
          exercise.muscleGroup,
          exercise.equipment,
          photoUri,
          exercise.description,
          exercise.notes,
          exercise.createdAt,
          exercise.updatedAt,
        ]
      );
    }

    for (const wde of payload.workoutDayExercises) {
      await db.runAsync(
        'INSERT INTO workout_day_exercises (id, workout_day_id, exercise_id, sort_order) VALUES (?, ?, ?, ?)',
        [wde.id, wde.workoutDayId, wde.exerciseId, wde.sortOrder]
      );
    }

    for (const session of payload.workoutSessions) {
      await db.runAsync(
        `INSERT INTO workout_sessions (id, routine_id, workout_day_id, started_at, ended_at, duration_seconds, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.routineId,
          session.workoutDayId,
          session.startedAt,
          session.endedAt,
          session.durationSeconds,
          session.notes,
          session.status,
        ]
      );
    }

    for (const es of payload.exerciseSessions) {
      await db.runAsync(
        'INSERT INTO exercise_sessions (id, workout_session_id, exercise_id, sort_order, notes) VALUES (?, ?, ?, ?, ?)',
        [es.id, es.workoutSessionId, es.exerciseId, es.sortOrder, es.notes]
      );
    }

    for (const set of payload.sets) {
      await db.runAsync(
        `INSERT INTO sets (id, exercise_session_id, set_number, weight_grams, weight_unit, reps, notes, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          set.id,
          set.exerciseSessionId,
          set.setNumber,
          set.weightGrams,
          set.weightUnit ?? 'kg',
          set.reps,
          set.notes,
          set.completedAt,
        ]
      );
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error al importar backup',
    };
  }
}
