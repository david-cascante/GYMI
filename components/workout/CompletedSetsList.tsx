import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatWeightReps } from '@/services/weightService';
import type { WorkoutSet } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';

interface CompletedSetsListProps {
  sets: WorkoutSet[];
}

export function CompletedSetsList({ sets }: CompletedSetsListProps) {
  const colors = useThemeColors();

  if (sets.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text style={[styles.title, { color: colors.text }]}>
          Series completadas ({sets.length})
        </Text>
      </View>

      {sets.map((set) => (
        <View
          key={set.id}
          style={[styles.row, { borderTopColor: colors.border }]}>
          <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {set.setNumber}
            </Text>
          </View>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatWeightReps(set.weightGrams, set.reps, set.weightUnit)}
          </Text>
          <Ionicons name="checkmark" size={18} color={colors.success} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  value: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
