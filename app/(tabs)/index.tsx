import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getDashboardData } from '@/services/scheduleService';
import { createSession } from '@/repositories/workoutRepository';
import { getActiveRoutine } from '@/repositories/routineRepository';
import type { DashboardData } from '@/types/entities';
import { timeAgo } from '@/utils/date';
import { fontSize, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HomeScreen() {
  const colors = useThemeColors();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDashboardData();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el inicio. Reinicia la app.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleStartWorkout = async () => {
    if (!dashboard?.todayDay) return;

    if (dashboard.activeSession) {
      router.push(`/workout/${dashboard.activeSession.id}`);
      return;
    }

    if (dashboard.todayDayExerciseCount === 0) {
      Alert.alert(
        'Sin ejercicios',
        'Primero agrega ejercicios al día de entrenamiento antes de iniciar.'
      );
      return;
    }

    setStarting(true);
    try {
      const routine = await getActiveRoutine();
      if (!routine || !dashboard.todayDay) return;

      const sessionId = await createSession(routine.id, dashboard.todayDay.id);
      router.push(`/workout/${sessionId}`);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
    } finally {
      setStarting(false);
    }
  };

  const goToTodayDay = () => {
    if (!dashboard?.routineId || !dashboard.todayDay) return;
    router.push(`/routines/${dashboard.routineId}/day/${dashboard.todayDay.id}`);
  };

  if (loading && !dashboard) return <LoadingState />;

  if (!dashboard?.hasActiveRoutine) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="GYMI" subtitle="Tu entrenamiento personal" />
        <EmptyState
          title="No tienes rutina activa"
          description="Crea una rutina y actívala para comenzar a entrenar."
          actionLabel="Ir a Rutinas"
          onAction={() => router.push('/(tabs)/routines')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="GYMI" subtitle="Tu entrenamiento personal" />

        <Card style={styles.card}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Entrenamiento de hoy
          </Text>
          {!dashboard.todayDay ? (
            <>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Sin días configurados
              </Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                {dashboard.routineName} — agrega días de entrenamiento a tu rutina.
              </Text>
              <Button
                title="Configurar rutina"
                onPress={() => router.push(`/routines/${dashboard.routineId}`)}
                size="lg"
                style={styles.startBtn}
              />
            </>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {dashboard.todayDay.name}
              </Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                {dashboard.routineName}
              </Text>

              {!dashboard.activeSession && dashboard.todayDayExerciseCount === 0 && (
                <View style={[styles.hintBox, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.hintText, { color: colors.text }]}>
                    Primero agrega ejercicios antes de iniciar un entrenamiento.
                  </Text>
                </View>
              )}

              {dashboard.activeSession || dashboard.todayDayExerciseCount > 0 ? (
                <Button
                  title={dashboard.activeSession ? 'Continuar entrenamiento' : 'Comenzar entrenamiento'}
                  onPress={handleStartWorkout}
                  size="lg"
                  loading={starting}
                  style={styles.startBtn}
                />
              ) : (
                <Button
                  title="Agregar ejercicios"
                  onPress={goToTodayDay}
                  size="lg"
                  style={styles.startBtn}
                />
              )}
            </>
          )}
        </Card>

        {dashboard.nextDay && (
          <Card style={styles.card}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Próximo entrenamiento
            </Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {dashboard.nextDay.name}
            </Text>
          </Card>
        )}

        {dashboard.lastSession && (
          <Card style={styles.card}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Último entrenamiento
            </Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {dashboard.lastSession.dayName}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              {dashboard.lastSession.endedAt
                ? timeAgo(dashboard.lastSession.endedAt)
                : ''}
            </Text>
          </Card>
        )}

        <View style={styles.quickLinks}>
          <Button
            title="Ver historial"
            onPress={() => router.push('/history')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  cardLabel: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  cardTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  cardSub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  startBtn: { marginTop: spacing.lg },
  hintBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  hintText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  quickLinks: { paddingHorizontal: spacing.md, gap: spacing.sm },
});
