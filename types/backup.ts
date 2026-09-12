import type {
  AppSettings,
  Exercise,
  Routine,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutSession,
  ExerciseSession,
  WorkoutSet,
} from './entities';

export interface BackupPhoto {
  exerciseId: number;
  filename: string;
  base64: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  routines: Routine[];
  workoutDays: WorkoutDay[];
  workoutDayExercises: WorkoutDayExercise[];
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  exerciseSessions: ExerciseSession[];
  sets: WorkoutSet[];
  photos: BackupPhoto[];
}
