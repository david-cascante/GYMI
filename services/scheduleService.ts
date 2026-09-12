import {
  getActiveRoutine,
  getDaysByRoutine,
  getDayExerciseCount,
} from '@/repositories/routineRepository';
import {
  getActiveSession,
  getLastCompletedSession,
} from '@/repositories/workoutRepository';
import type { DashboardData, WorkoutDay } from '@/types/entities';

function getNextDayInRotation(
  days: WorkoutDay[],
  lastDayId: number | null
): WorkoutDay | null {
  if (days.length === 0) return null;
  if (!lastDayId) return days[0];

  const lastIndex = days.findIndex((d) => d.id === lastDayId);
  if (lastIndex === -1) return days[0];

  const nextIndex = (lastIndex + 1) % days.length;
  return days[nextIndex];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [activeRoutine, activeSession, lastSession] = await Promise.all([
    getActiveRoutine(),
    getActiveSession(),
    getLastCompletedSession(),
  ]);

  if (!activeRoutine) {
    return {
      hasActiveRoutine: false,
      routineName: null,
      routineId: null,
      todayDay: null,
      todayDayExerciseCount: 0,
      nextDay: null,
      lastSession,
      activeSession,
    };
  }

  const days = await getDaysByRoutine(activeRoutine.id);
  const lastDayId = lastSession?.workoutDayId ?? null;
  const todayDay = getNextDayInRotation(days, lastDayId);

  let nextDay: WorkoutDay | null = null;
  if (todayDay && days.length > 1) {
    const todayIndex = days.findIndex((d) => d.id === todayDay.id);
    nextDay = days[(todayIndex + 1) % days.length];
  }

  const todayDayExerciseCount = todayDay
    ? await getDayExerciseCount(todayDay.id)
    : 0;

  return {
    hasActiveRoutine: true,
    routineName: activeRoutine.name,
    routineId: activeRoutine.id,
    todayDay,
    todayDayExerciseCount,
    nextDay,
    lastSession,
    activeSession,
  };
}
