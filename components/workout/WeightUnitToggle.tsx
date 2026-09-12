import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeightUnit } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';

interface WeightUnitToggleProps {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
}

export function WeightUnitToggle({ value, onChange }: WeightUnitToggleProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      {(['kg', 'lb'] as WeightUnit[]).map((unit) => {
        const selected = value === unit;
        return (
          <Pressable
            key={unit}
            onPress={() => onChange(unit)}
            style={[
              styles.option,
              selected && { backgroundColor: colors.primary },
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? '#FFFFFF' : colors.textSecondary },
              ]}>
              {unit}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
