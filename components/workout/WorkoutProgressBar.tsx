import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';

interface WorkoutProgressBarProps {
  currentIndex: number;
  total: number;
  labels: string[];
  onSelect: (index: number) => void;
}

export function WorkoutProgressBar({
  currentIndex,
  total,
  labels,
  onSelect,
}: WorkoutProgressBarProps) {
  const colors = useThemeColors();
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.inputBackground }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Ejercicio {currentIndex + 1} de {total}
        {labels[currentIndex] ? ` · ${labels[currentIndex]}` : ''}
      </Text>

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          return (
            <Pressable
              key={index}
              onPress={() => onSelect(index)}
              style={[
                styles.dot,
                {
                  backgroundColor: active || done ? colors.primary : colors.inputBackground,
                  opacity: active ? 1 : done ? 0.55 : 0.35,
                  transform: [{ scale: active ? 1.15 : 1 }],
                },
              ]}
              accessibilityLabel={`Ir al ejercicio ${index + 1}`}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  label: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
});
