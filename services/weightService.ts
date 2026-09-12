import type { WeightUnit } from '@/types/entities';

const LB_TO_GRAMS = 453.592;
const KG_TO_GRAMS = 1000;

export function gramsToKg(grams: number): number {
  return grams / KG_TO_GRAMS;
}

export function gramsToLb(grams: number): number {
  return grams / LB_TO_GRAMS;
}

export function kgToGrams(kg: number): number {
  return kg * KG_TO_GRAMS;
}

export function lbToGrams(lb: number): number {
  return lb * LB_TO_GRAMS;
}

export function normalizeWeightUnit(unit: WeightUnit | string | null | undefined): WeightUnit {
  return unit === 'lb' ? 'lb' : 'kg';
}

export function displayWeight(
  grams: number,
  unit: WeightUnit | string | null | undefined
): number {
  const safeUnit = normalizeWeightUnit(unit);
  const value = safeUnit === 'kg' ? gramsToKg(grams) : gramsToLb(grams);
  return Math.round(value * 10) / 10;
}

export function parseWeightInput(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? kgToGrams(value) : lbToGrams(value);
}

export function formatWeight(
  grams: number,
  unit: WeightUnit | string | null | undefined
): string {
  const safeUnit = normalizeWeightUnit(unit);
  const value = displayWeight(grams, safeUnit);
  return `${value} ${safeUnit}`;
}

export function formatWeightReps(
  grams: number,
  reps: number,
  unit: WeightUnit
): string {
  return `${formatWeight(grams, unit)} × ${reps}`;
}

export function unitLabel(unit: WeightUnit): string {
  return unit;
}
