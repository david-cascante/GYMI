import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Exercise } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';

interface WorkoutExerciseHeroProps {
  exercise: Exercise;
}

export function WorkoutExerciseHero({ exercise }: WorkoutExerciseHeroProps) {
  const colors = useThemeColors();
  const hasPhoto = Boolean(exercise.photoUri);

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      {hasPhoto ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: exercise.photoUri! }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          />
          <View style={styles.overlayContent}>
            <Text style={styles.heroName}>{exercise.name}</Text>
            <MetaRow exercise={exercise} light />
          </View>
        </View>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.primaryMuted }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="barbell-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>
            {exercise.name}
          </Text>
          <MetaRow exercise={exercise} />
          <Text style={[styles.placeholderHint, { color: colors.textMuted }]}>
            Agrega una foto en el catálogo para ver la máquina aquí
          </Text>
        </View>
      )}
    </View>
  );
}

function MetaRow({
  exercise,
  light = false,
}: {
  exercise: Exercise;
  light?: boolean;
}) {
  const colors = useThemeColors();
  const chipBg = light ? 'rgba(255,255,255,0.18)' : colors.surface;
  const chipText = light ? '#FFFFFF' : colors.textSecondary;
  const iconColor = light ? '#FFFFFF' : colors.primary;

  if (!exercise.muscleGroup && !exercise.equipment) return null;

  return (
    <View style={styles.metaRow}>
      {exercise.muscleGroup ? (
        <View style={[styles.chip, { backgroundColor: chipBg }]}>
          <Ionicons name="body-outline" size={14} color={iconColor} />
          <Text style={[styles.chipText, { color: chipText }]}>{exercise.muscleGroup}</Text>
        </View>
      ) : null}
      {exercise.equipment ? (
        <View style={[styles.chip, { backgroundColor: chipBg }]}>
          <Ionicons name="fitness-outline" size={14} color={iconColor} />
          <Text style={[styles.chipText, { color: chipText }]}>{exercise.equipment}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    height: 220,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  overlayContent: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  placeholderTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  placeholderHint: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
