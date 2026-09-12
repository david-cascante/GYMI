export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workout_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    photo_uri TEXT,
    description TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workout_day_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_day_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    workout_day_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS exercise_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_session_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_session_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight_grams REAL NOT NULL,
    weight_unit TEXT NOT NULL DEFAULT 'kg',
    reps INTEGER NOT NULL,
    notes TEXT,
    completed_at TEXT NOT NULL,
    FOREIGN KEY (exercise_session_id) REFERENCES exercise_sessions(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_workout_days_routine ON workout_days(routine_id)`,
  `CREATE INDEX IF NOT EXISTS idx_wde_day ON workout_day_exercises(workout_day_id)`,
  `CREATE INDEX IF NOT EXISTS idx_wde_exercise ON workout_day_exercises(exercise_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_routine ON workout_sessions(routine_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_day ON workout_sessions(workout_day_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_status ON workout_sessions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_exercise_sessions_session ON exercise_sessions(workout_session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sets_exercise_session ON sets(exercise_session_id)`,
] as const;

export const DEFAULT_SETTINGS = [
  { key: 'weight_unit', value: 'kg' },
  { key: 'theme', value: 'dark' },
  { key: 'default_rest_seconds', value: '90' },
  { key: 'schema_version', value: '2' },
] as const;
