import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, radius, spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const colors = useThemeColors();

  const bgMap: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    destructive: colors.danger,
    ghost: 'transparent',
  };

  const textMap: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.text,
    destructive: '#FFFFFF',
    ghost: colors.primary,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        {
          backgroundColor: bgMap[variant],
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textMap[variant]} />
      ) : (
        <Text
          style={[
            styles.text,
            size === 'lg' && styles.lgText,
            { color: textMap[variant] },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  lg: {
    minHeight: 56,
    paddingVertical: spacing.lg,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  lgText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
