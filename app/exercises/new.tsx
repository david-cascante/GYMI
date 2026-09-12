import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExercises } from '@/hooks/useExercises';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MUSCLE_GROUPS } from '@/constants/muscleGroups';
import { validateName } from '@/utils/validation';
import { spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewExerciseScreen() {
  const colors = useThemeColors();
  const { add } = useExercises();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const check = validateName(name, 'Nombre del ejercicio');
    if (!check.valid) {
      Alert.alert('Error', check.error);
      return;
    }
    setLoading(true);
    try {
      await add({
        name: name.trim(),
        muscleGroup: muscleGroup.trim() || undefined,
        equipment: equipment.trim() || undefined,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (error) {
      console.error('Error creating exercise:', error);
      Alert.alert('Error', 'No se pudo crear el ejercicio. Prueba reiniciar la app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Nuevo ejercicio', headerShown: true, presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.form}>
        <Input label="Nombre *" value={name} onChangeText={setName} placeholder="Press banca" autoFocus />
        <Input
          label="Grupo muscular"
          value={muscleGroup}
          onChangeText={setMuscleGroup}
          placeholder={MUSCLE_GROUPS.join(', ')}
        />
        <Input label="Equipamiento" value={equipment} onChangeText={setEquipment} placeholder="Barra, máquina..." />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional"
          multiline
        />
        <Button title="Crear ejercicio" onPress={handleSave} loading={loading} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: spacing.md },
});
