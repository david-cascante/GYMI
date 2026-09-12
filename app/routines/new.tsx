import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoutines } from '@/hooks/useRoutines';
import { useThemeColors } from '@/hooks/useThemeColors';
import { validateName } from '@/utils/validation';
import { spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewRoutineScreen() {
  const colors = useThemeColors();
  const { add } = useRoutines();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const check = validateName(name, 'Nombre de rutina');
    if (!check.valid) {
      Alert.alert('Error', check.error);
      return;
    }
    setLoading(true);
    try {
      await add(name.trim(), description.trim() || undefined);
      router.back();
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'No se pudo crear la rutina. Prueba reiniciar la app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Nueva rutina', presentation: 'modal' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.form}>
        <Input label="Nombre *" value={name} onChangeText={setName} placeholder="Push Pull Legs" autoFocus />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional"
          multiline
        />
        <Button title="Crear rutina" onPress={handleSave} loading={loading} size="lg" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: spacing.md, flex: 1 },
});
