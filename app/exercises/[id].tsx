import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseById, updateExercise, updateExercisePhoto } from '@/repositories/exerciseRepository';
import { pickImageFromGallery, takePhoto, deletePhoto } from '@/services/photoService';
import type { Exercise } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { validateName } from '@/utils/validation';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = parseInt(id, 10);
  const colors = useThemeColors();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const ex = await getExerciseById(exerciseId);
    if (ex) {
      setExercise(ex);
      setName(ex.name);
      setMuscleGroup(ex.muscleGroup ?? '');
      setEquipment(ex.equipment ?? '');
      setDescription(ex.description ?? '');
      setNotes(ex.notes ?? '');
    }
    setLoading(false);
  }, [exerciseId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSave = async () => {
    const check = validateName(name);
    if (!check.valid) {
      Alert.alert('Error', check.error);
      return;
    }
    setSaving(true);
    try {
      await updateExercise(exerciseId, {
        name: name.trim(),
        muscleGroup: muscleGroup.trim() || null,
        equipment: equipment.trim() || null,
        description: description.trim() || null,
        notes: notes.trim() || null,
      });
      Alert.alert('Guardado', 'Ejercicio actualizado');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = () => {
    Alert.alert('Fotografía', 'Elige una opción', [
      { text: 'Cámara', onPress: async () => {
        const uri = await takePhoto();
        if (uri) {
          await updateExercisePhoto(exerciseId, uri);
          await load();
        }
      }},
      { text: 'Galería', onPress: async () => {
        const uri = await pickImageFromGallery();
        if (uri) {
          await updateExercisePhoto(exerciseId, uri);
          await load();
        }
      }},
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = async () => {
    if (exercise?.photoUri) {
      await deletePhoto(exercise.photoUri);
      await updateExercisePhoto(exerciseId, null);
      await load();
    }
  };

  if (loading && !exercise) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: exercise?.name ?? 'Ejercicio', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={handlePhoto} style={[styles.photoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {exercise?.photoUri ? (
            <Image source={{ uri: exercise.photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>Agregar foto</Text>
            </View>
          )}
        </Pressable>
        {exercise?.photoUri && (
          <Button title="Eliminar foto" onPress={handleRemovePhoto} variant="ghost" />
        )}

        <Input label="Nombre *" value={name} onChangeText={setName} />
        <Input label="Grupo muscular" value={muscleGroup} onChangeText={setMuscleGroup} />
        <Input label="Equipamiento" value={equipment} onChangeText={setEquipment} />
        <Input label="Descripción" value={description} onChangeText={setDescription} multiline />
        <Input label="Notas" value={notes} onChangeText={setNotes} multiline />

        <Button title="Guardar cambios" onPress={handleSave} loading={saving} size="lg" />
        <Button
          title="Ver progreso"
          onPress={() => router.push(`/progress/${exerciseId}`)}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md },
  photoBox: {
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
