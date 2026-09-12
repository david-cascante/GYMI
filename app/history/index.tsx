import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCompletedSessions } from '@/repositories/workoutRepository';
import type { WorkoutSession } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDate, formatDuration } from '@/utils/date';
import { fontSize, spacing } from '@/constants/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

export default function HistoryScreen() {
  const colors = useThemeColors();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getCompletedSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && sessions.length === 0) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Historial', headerShown: true }} />

      {sessions.length === 0 ? (
        <EmptyState
          title="Sin entrenamientos"
          description="Completa tu primer entrenamiento para ver el historial."
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/history/${item.id}`)}>
              <View style={styles.itemContent}>
                <Text style={[styles.dayName, { color: colors.text }]}>{item.dayName}</Text>
                <Text style={[styles.routine, { color: colors.textSecondary }]}>{item.routineName}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.endedAt ? formatDate(item.endedAt) : ''}
                  {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  itemContent: { flex: 1 },
  dayName: { fontSize: fontSize.md, fontWeight: '600' },
  routine: { fontSize: fontSize.sm, marginTop: 2 },
  meta: { fontSize: fontSize.xs, marginTop: 4 },
});
