import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAllExerciseProgress, getPersonalRecords } from '@/services/progressService';
import { formatWeight, displayWeight } from '@/services/weightService';
import type { ExerciseProgress, PersonalRecord } from '@/types/entities';
import { fontSize, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ProgressScreen() {
  const colors = useThemeColors();
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [prog, records] = await Promise.all([
        getAllExerciseProgress(),
        getPersonalRecords(),
      ]);
      setProgress(prog);
      setPrs(records.slice(0, 5));
    } catch (error) {
      console.error('Error loading progress:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el progreso. Cierra y vuelve a abrir la app.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && progress.length === 0 && prs.length === 0) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Progreso" subtitle="Tus estadísticas y récords" />

      {prs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Récords personales</Text>
          <Card>
            {prs.map((pr) => (
              <View key={pr.exerciseId} style={styles.prRow}>
                <Ionicons name="trophy" size={18} color={colors.warning} />
                <Text style={[styles.prName, { color: colors.text }]}>{pr.exerciseName}</Text>
                <Text style={[styles.prValue, { color: colors.primary }]}>
                  {formatWeight(pr.maxWeightGrams, pr.maxWeightUnit)}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {progress.length === 0 ? (
        <EmptyState
          title="Sin datos de progreso"
          description="Completa entrenamientos para ver tus estadísticas."
        />
      ) : (
        <FlatList
          data={progress}
          keyExtractor={(item) => String(item.exerciseId)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
              Por ejercicio
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/progress/${item.exerciseId}`)}>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.exerciseName}</Text>
                <Text style={[styles.itemStats, { color: colors.textSecondary }]}>
                  Último: {item.lastWeightGrams ? formatWeight(item.lastWeightGrams, item.lastWeightUnit) : '—'}
                  {' · '}
                  Max: {item.maxWeightGrams ? formatWeight(item.maxWeightGrams, item.maxWeightUnit) : '—'}
                </Text>
                <Text style={[styles.itemStats, { color: colors.textMuted }]}>
                  Volumen: {Math.round(displayWeight(item.totalVolume, item.lastWeightUnit) * 1000)} {item.lastWeightUnit}·reps
                  {' · '}
                  {item.sessionCount} sesiones
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
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  prName: { flex: 1, fontSize: fontSize.md },
  prValue: { fontSize: fontSize.md, fontWeight: '700' },
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
  itemName: { fontSize: fontSize.md, fontWeight: '600' },
  itemStats: { fontSize: fontSize.sm, marginTop: 2 },
});
