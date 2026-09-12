import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '@/constants/theme';
import { useSettings } from '@/contexts/SettingsContext';

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const { theme } = useSettings();

  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  return isDark ? darkColors : lightColors;
}
