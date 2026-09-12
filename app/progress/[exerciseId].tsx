import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { getExerciseById } from '@/repositories/exerciseRepository';
import {
  getExerciseProgressData,
  getLastWeightUnitForExercise,
  getPersonalRecords,
} from '@/services/progressService';
import { displayWeight, formatWeight } from '@/services/weightService';
import type { Exercise, ProgressDataPoint, PersonalRecord } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { WeightUnit } from '@/types/entities';
import { fontSize, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';

const CHART_WIDTH = Dimensions.get('window').width - 64;

export default function ExerciseProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const id = parseInt(exerciseId, 10);
  const colors = useThemeColors();
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>('kg');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [dataPoints, setDataPoints] = useState<ProgressDataPoint[]>([]);
  const [pr, setPr] = useState<PersonalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ex, points, records, unit] = await Promise.all([
      getExerciseById(id),
      getExerciseProgressData(id),
      getPersonalRecords(),
      getLastWeightUnitForExercise(id),
    ]);
    setExercise(ex);
    setDataPoints(points);
    setPr(records.find((r) => r.exerciseId === id) ?? null);
    setDisplayUnit(unit);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !exercise) return <LoadingState />;

  const chartUnit = pr?.maxWeightUnit ?? displayUnit;

  const weightData = dataPoints.map((p, i) => ({
    value: displayWeight(p.weightGrams, chartUnit),
    label: p.date.slice(5),
    dataPointText: String(displayWeight(p.weightGrams, chartUnit)),
  }));

  const volumeData = dataPoints.map((p) => ({
    value: Math.round(displayWeight(p.volume, chartUnit)),
    label: p.date.slice(5),
  }));

  const repsData = dataPoints.map((p) => ({
    value: p.reps,
    label: p.date.slice(5),
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: exercise?.name ?? 'Progreso', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {pr && (
          <Card style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Récords</Text>
            <View style={styles.statsRow}>
              <Stat label="Peso máx." value={formatWeight(pr.maxWeightGrams, pr.maxWeightUnit)} colors={colors} />
              <Stat label="Reps máx." value={String(pr.maxReps)} colors={colors} />
              <Stat label="Volumen máx." value={String(Math.round(displayWeight(pr.maxVolume, pr.maxWeightUnit)))} colors={colors} />
            </View>
          </Card>
        )}

        {weightData.length > 1 && (
          <ChartSection title="Peso" colors={colors}>
            <LineChart
              data={weightData}
              width={CHART_WIDTH}
              height={180}
              color={colors.primary}
              thickness={2}
              hideDataPoints={weightData.length > 10}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              rulesColor={colors.border}
              noOfSections={4}
            />
          </ChartSection>
        )}

        {volumeData.length > 1 && (
          <ChartSection title="Volumen" colors={colors}>
            <LineChart
              data={volumeData}
              width={CHART_WIDTH}
              height={180}
              color={colors.warning}
              thickness={2}
              hideDataPoints={volumeData.length > 10}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              rulesColor={colors.border}
              noOfSections={4}
            />
          </ChartSection>
        )}

        {repsData.length > 1 && (
          <ChartSection title="Repeticiones" colors={colors}>
            <LineChart
              data={repsData}
              width={CHART_WIDTH}
              height={180}
              color={colors.success}
              thickness={2}
              hideDataPoints={repsData.length > 10}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              rulesColor={colors.border}
              noOfSections={4}
            />
          </ChartSection>
        )}

        {dataPoints.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Sin datos suficientes para gráficos. Completa más entrenamientos.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ChartSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Card style={styles.chartCard}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md },
  statsCard: { marginBottom: spacing.md },
  statsTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, marginTop: 4 },
  chartCard: { marginBottom: spacing.md, overflow: 'hidden' },
  chartTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.md },
});
