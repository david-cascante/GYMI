export const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Piernas',
  'Glúteos',
  'Abdominales',
  'Antebrazos',
  'Cardio',
  'Cuerpo completo',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
