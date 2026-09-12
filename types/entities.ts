export type WeightUnit = 'kg' | 'lb';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface Routine {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDay {
  id: number;
  routineId: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  photoUri: string | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDayExercise {
  id: number;
  workoutDayId: number;
  exerciseId: number;
  sortOrder: number;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: number;
  routineId: number;
  workoutDayId: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  status: SessionStatus;
  routineName?: string;
  dayName?: string;
}

export interface ExerciseSession {
  id: number;
  workoutSessionId: number;
  exerciseId: number;
  sortOrder: number;
  notes: string | null;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: number;
  exerciseSessionId: number;
  setNumber: number;
  weightGrams: number;
  weightUnit: WeightUnit;
  reps: number;
  notes: string | null;
  completedAt: string;
}

export interface AppSettings {
  weightUnit: WeightUnit;
  theme: ThemeMode;
  defaultRestSeconds: number;
}

export interface RoutineWithDays extends Routine {
  days: WorkoutDay[];
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: WorkoutDayExercise[];
}

export interface SessionWithDetails extends WorkoutSession {
  exerciseSessions: ExerciseSession[];
}

export interface ExerciseProgress {
  exerciseId: number;
  exerciseName: string;
  lastWeightGrams: number | null;
  lastWeightUnit: WeightUnit;
  maxWeightGrams: number | null;
  maxWeightUnit: WeightUnit;
  maxReps: number | null;
  totalVolume: number;
  sessionCount: number;
}

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  maxWeightGrams: number;
  maxWeightUnit: WeightUnit;
  maxReps: number;
  maxVolume: number;
}

export interface ProgressDataPoint {
  date: string;
  weightGrams: number;
  reps: number;
  volume: number;
}

export interface DashboardData {
  hasActiveRoutine: boolean;
  routineName: string | null;
  routineId: number | null;
  todayDay: WorkoutDay | null;
  todayDayExerciseCount: number;
  nextDay: WorkoutDay | null;
  lastSession: WorkoutSession | null;
  activeSession: WorkoutSession | null;
}

export interface LastExercisePerformance {
  weightGrams: number;
  weightUnit: WeightUnit;
  reps: number;
  completedAt: string;
}

export interface NewPR {
  type: 'weight' | 'reps' | 'volume';
  exerciseName: string;
  value: number;
  unit?: string;
}
