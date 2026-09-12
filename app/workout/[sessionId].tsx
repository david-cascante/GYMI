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
import { formatWeightReps } from '@/services/weightService';
import type { SessionWithDetails, ExerciseSession, LastExercisePerformance, NewPR, WeightUnit } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { SetLogger } from '@/components/workout/SetLogger';
import { RestTimer } from '@/components/workout/RestTimer';

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

      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.dayName, { color: colors.text }]}>{session.dayName}</Text>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            Ejercicio {currentIndex + 1} de {session.exerciseSessions.length}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <RestTimer />

      {currentExercise && (
        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {currentExercise.exercise?.name}
          </Text>

          {currentExercise.sets && currentExercise.sets.length > 0 && (
            <View style={styles.setsList}>
              {currentExercise.sets.map((set) => (
                <View
                  key={set.id}
                  style={[styles.setRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.setNumber, { color: colors.textMuted }]}>
                    Serie {set.setNumber}
                  </Text>
                  <Text style={[styles.setValue, { color: colors.text }]}>
                    {formatWeightReps(set.weightGrams, set.reps, set.weightUnit)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <SetLogger
            key={currentExercise.id}
            lastPerformance={lastPerformance}
            onLogSet={handleLogSet}
          />

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
            placeholder="Opcional"
          />
        </ScrollView>
      )}

      <View style={[styles.sessionNotes, { borderTopColor: colors.border }]}>
        <Input
          label="Notas del entrenamiento"
          value={sessionNotes}
          onChangeText={(text) => {
            setSessionNotes(text);
            updateSessionNotes(sessionIdNum, text);
          }}
          placeholder="¿Cómo te sentiste hoy?"
        />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
              title="Siguiente ejercicio"
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
    padding: spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  dayName: { fontSize: fontSize.lg, fontWeight: '700' },
  progress: { fontSize: fontSize.sm, marginTop: 2 },
  body: { flex: 1 },
  exerciseName: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  setsList: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  setNumber: { fontSize: fontSize.sm },
  setValue: { fontSize: fontSize.md, fontWeight: '600' },
  sessionNotes: {
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  navRow: { flexDirection: 'row', gap: spacing.sm },
  navBtn: { flex: 1 },
});
