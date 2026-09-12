import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { RoutinesProvider } from '@/contexts/RoutinesContext';
import { ExercisesProvider } from '@/contexts/ExercisesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { darkColors, lightColors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <SettingsProvider>
        <RoutinesProvider>
          <ExercisesProvider>
            <RootNavigator />
          </ExercisesProvider>
        </RoutinesProvider>
      </SettingsProvider>
    </DatabaseProvider>
  );
}

function RootNavigator() {
  const systemScheme = useColorScheme();
  const { theme } = useSettings();
  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? darkColors.background : lightColors.background,
          },
        }}
      />
    </>
  );
}
