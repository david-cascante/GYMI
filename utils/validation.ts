export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateName(name: string, fieldLabel = 'Nombre'): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: `${fieldLabel} es obligatorio` };
  if (trimmed.length > 100) return { valid: false, error: `${fieldLabel} demasiado largo (máx. 100)` };
  return { valid: true };
}

export function validateWeight(weight: number): ValidationResult {
  if (isNaN(weight) || weight < 0) return { valid: false, error: 'El peso no puede ser negativo' };
  if (weight > 9999) return { valid: false, error: 'Peso demasiado alto' };
  return { valid: true };
}

export function validateReps(reps: number): ValidationResult {
  if (isNaN(reps) || reps <= 0) return { valid: false, error: 'Las repeticiones deben ser mayores a 0' };
  if (reps > 9999) return { valid: false, error: 'Repeticiones demasiado altas' };
  return { valid: true };
}

export function parsePositiveInt(value: string): number | null {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  return parsed;
}

export function parseNonNegativeFloat(value: string): number | null {
  const parsed = parseFloat(value.replace(',', '.'));
  if (isNaN(parsed)) return null;
  return parsed;
}
