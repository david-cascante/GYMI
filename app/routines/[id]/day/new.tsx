import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createWorkoutDay } from '@/repositories/routineRepository';
import { useThemeColors } from '@/hooks/useThemeColors';
import { validateName } from '@/utils/validation';
import { spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = parseInt(id, 10);
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const check = validateName(name, 'Nombre del día');
    if (!check.valid) {
      Alert.alert('Error', check.error);
      return;
    }
    setLoading(true);
    try {
      await createWorkoutDay(routineId, name.trim());
      router.back();
    } catch (error) {
      console.error('Error creating day:', error);
      Alert.alert('Error', 'No se pudo crear el día.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Nuevo día', headerShown: true, presentation: 'modal' }} />
      <Input
        label="Nombre del día *"
        value={name}
        onChangeText={setName}
        placeholder="Pecho + Tríceps"
        autoFocus
      />
      <Button title="Crear día" onPress={handleSave} loading={loading} style={styles.btn} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  btn: { marginTop: spacing.md },
});
