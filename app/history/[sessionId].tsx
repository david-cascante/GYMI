import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSessionWithDetails } from '@/repositories/workoutRepository';
import { formatWeightReps } from '@/services/weightService';
import type { SessionWithDetails } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDate, formatDuration } from '@/utils/date';
import { fontSize, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const sessionIdNum = parseInt(sessionId, 10);
  const colors = useThemeColors();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const s = await getSessionWithDetails(sessionIdNum);
    setSession(s);
    setLoading(false);
  }, [sessionIdNum]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !session) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: session?.dayName ?? 'Sesión', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>{session?.dayName}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {session?.routineName} · {session?.endedAt ? formatDate(session.endedAt) : ''}
          {session?.durationSeconds ? ` · ${formatDuration(session.durationSeconds)}` : ''}
        </Text>

        {session?.notes && (
          <Card style={styles.notesCard}>
            <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Notas</Text>
            <Text style={{ color: colors.text }}>{session.notes}</Text>
          </Card>
        )}

        {session?.exerciseSessions.map((es) => (
          <Card key={es.id} style={styles.exerciseCard}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {es.exercise?.name}
            </Text>
            {es.sets?.map((set) => (
              <Text key={set.id} style={[styles.setLine, { color: colors.textSecondary }]}>
                {formatWeightReps(set.weightGrams, set.reps, set.weightUnit)}
                {set.notes ? ` — ${set.notes}` : ''}
              </Text>
            ))}
            {(!es.sets || es.sets.length === 0) && (
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Sin series</Text>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { fontSize: fontSize.md, marginBottom: spacing.lg, marginTop: spacing.xs },
  notesCard: { marginBottom: spacing.md },
  notesLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  exerciseCard: { marginBottom: spacing.sm },
  exerciseName: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.sm },
  setLine: { fontSize: fontSize.md, marginBottom: 4 },
});
