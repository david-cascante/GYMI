import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  large?: boolean;
  compact?: boolean;
}

export function Input({ label, error, large, compact, style, ...props }: InputProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          large && styles.large,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  compact: {
    marginBottom: 0,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    borderWidth: 1,
    minHeight: 48,
  },
  large: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    minHeight: 64,
    textAlign: 'center',
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
