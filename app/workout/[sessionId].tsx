import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getSessionWithDetails,
  addSet,
  completeSession,
  cancelSession,
  getLastPerformance,
  updateExerciseSessionNotes,
  updateSessionNotes,
} from '@/repositories/workoutRepository';
import { detectNewPRs } from '@/services/progressService';
import type {
  SessionWithDetails,
  ExerciseSession,
  LastExercisePerformance,
  NewPR,
  WeightUnit,
} from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { SetLogger } from '@/components/workout/SetLogger';
import { RestTimer } from '@/components/workout/RestTimer';
import { WorkoutExerciseHero } from '@/components/workout/WorkoutExerciseHero';
import { WorkoutProgressBar } from '@/components/workout/WorkoutProgressBar';
import { CompletedSetsList } from '@/components/workout/CompletedSetsList';

export default function ActiveWorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const sessionIdNum = parseInt(sessionId, 10);
  const colors = useThemeColors();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastPerformance, setLastPerformance] = useState<LastExercisePerformance | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    const s = await getSessionWithDetails(sessionIdNum);
    setSession(s);
    if (s?.notes) setSessionNotes(s.notes);
    setLoading(false);
  }, [sessionIdNum]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!session || session.exerciseSessions.length === 0) return;
    const ex = session.exerciseSessions[currentIndex];
    if (!ex) return;
    getLastPerformance(ex.exerciseId, sessionIdNum).then(setLastPerformance);
  }, [session, currentIndex, sessionIdNum]);

  const currentExercise: ExerciseSession | undefined =
    session?.exerciseSessions[currentIndex];

  const exerciseLabels =
    session?.exerciseSessions.map((es) => es.exercise?.name ?? '') ?? [];

  const handleLogSet = async (
    weightGrams: number,
    reps: number,
    weightUnit: WeightUnit
  ): Promise<NewPR[]> => {
    if (!currentExercise) return [];
    await addSet(currentExercise.id, weightGrams, reps, weightUnit);
    const prs = await detectNewPRs(currentExercise.exerciseId, weightGrams, reps, sessionIdNum);
    await load();
    return prs;
  };

  const handleFinish = () => {
    Alert.alert('Finalizar entrenamiento', '¿Guardar esta sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          setFinishing(true);
          try {
            await completeSession(sessionIdNum, sessionNotes || null);
            router.replace('/(tabs)');
          } finally {
            setFinishing(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancelar entrenamiento', '¿Descartar esta sesión?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          await cancelSession(sessionIdNum);
          router.back();
        },
      },
    ]);
  };

  if (loading && !session) return <LoadingState />;
  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>
          Sesión no encontrada
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleCancel}
          hitSlop={12}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.dayName, { color: colors.text }]}>{session.dayName}</Text>
          <Text style={[styles.routineName, { color: colors.textSecondary }]}>
            {session.routineName}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <WorkoutProgressBar
        currentIndex={currentIndex}
        total={session.exerciseSessions.length}
        labels={exerciseLabels}
        onSelect={setCurrentIndex}
      />

      <RestTimer />

      {currentExercise?.exercise && (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <WorkoutExerciseHero exercise={currentExercise.exercise} />

          {currentExercise.exercise.description ? (
            <Card style={styles.descriptionCard}>
              <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
                Indicaciones
              </Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {currentExercise.exercise.description}
              </Text>
            </Card>
          ) : null}

          <CompletedSetsList sets={currentExercise.sets ?? []} />

          <Card style={styles.loggerCard}>
            <SetLogger
              key={currentExercise.id}
              lastPerformance={lastPerformance}
              onLogSet={handleLogSet}
            />
          </Card>

          <Card style={styles.notesCard}>
            <Input
              label="Notas del ejercicio"
              value={currentExercise.notes ?? ''}
              onChangeText={(text) => {
                updateExerciseSessionNotes(currentExercise.id, text);
                setSession((prev) => {
                  if (!prev) return prev;
                  const updated = prev.exerciseSessions.map((es) =>
                    es.id === currentExercise.id ? { ...es, notes: text } : es
                  );
                  return { ...prev, exerciseSessions: updated };
                });
              }}
              placeholder="Técnica, sensaciones, ajustes…"
            />
          </Card>

          <Card style={styles.notesCard}>
            <Input
              label="Notas del entrenamiento"
              value={sessionNotes}
              onChangeText={(text) => {
                setSessionNotes(text);
                updateSessionNotes(sessionIdNum, text);
              }}
              placeholder="¿Cómo te sentiste hoy?"
            />
          </Card>
        </ScrollView>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.navRow}>
          <Button
            title="Anterior"
            onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            variant="secondary"
            disabled={currentIndex === 0}
            style={styles.navBtn}
          />
          {currentIndex < session.exerciseSessions.length - 1 ? (
            <Button
              title="Siguiente"
              onPress={() => setCurrentIndex((i) => i + 1)}
              style={styles.navBtn}
            />
          ) : (
            <Button
              title="Finalizar"
              onPress={handleFinish}
              loading={finishing}
              style={styles.navBtn}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  dayName: { fontSize: fontSize.lg, fontWeight: '800' },
  routineName: { fontSize: fontSize.sm, marginTop: 2 },
  headerSpacer: { width: 40 },
  body: { flex: 1 },
  bodyContent: {
    paddingBottom: spacing.lg,
  },
  descriptionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  descriptionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  loggerCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  notesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navRow: { flexDirection: 'row', gap: spacing.sm },
  navBtn: { flex: 1 },
});
