import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  getDayWithExercises,
  addExerciseToDay,
  removeExerciseFromDay,
  reorderDayExercises,
} from '@/repositories/routineRepository';
import { useExercises } from '@/hooks/useExercises';
import { createSession } from '@/repositories/workoutRepository';
import type { WorkoutDayWithExercises, WorkoutDayExercise } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DayDetailScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const routineId = parseInt(id, 10);
  const dayIdNum = parseInt(dayId, 10);
  const colors = useThemeColors();
  const [day, setDay] = useState<WorkoutDayWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { exercises: allExercises, refresh: refreshExercises } = useExercises();
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getDayWithExercises(dayIdNum);
      setDay(d);
    } catch (error) {
      console.error('Error loading day:', error);
      Alert.alert('Error', 'No se pudo cargar el día de entrenamiento.');
    } finally {
      setLoading(false);
    }
  }, [dayIdNum]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allExercises;
    return allExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscleGroup?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
    );
  }, [allExercises, searchQuery]);

  const closePicker = () => {
    setShowPicker(false);
    setSearchQuery('');
  };

  const openPicker = async () => {
    try {
      setSearchQuery('');
      await refreshExercises();
      setShowPicker(true);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el catálogo de ejercicios.');
    }
  };

  const handleAddExercise = async (exerciseId: number) => {
    const alreadyAdded = day?.exercises.some((e) => e.exerciseId === exerciseId);
    if (alreadyAdded) {
      Alert.alert('Ya agregado', 'Este ejercicio ya está en el día');
      return;
    }
    try {
      await addExerciseToDay(dayIdNum, exerciseId);
      closePicker();
      await load();
    } catch (error) {
      console.error('Error adding exercise:', error);
      Alert.alert('Error', 'No se pudo agregar el ejercicio.');
    }
  };

  const handleDragEnd = async ({ data }: { data: WorkoutDayExercise[] }) => {
    if (!day) return;
    setDay({ ...day, exercises: data });
    await reorderDayExercises(data.map((e) => e.id));
  };

  const handleStart = async () => {
    if (!day || day.exercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agrega ejercicios antes de iniciar');
      return;
    }
    setStarting(true);
    try {
      const sessionId = await createSession(routineId, dayIdNum);
      router.push(`/workout/${sessionId}`);
    } finally {
      setStarting(false);
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<WorkoutDayExercise>) => (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        style={[styles.exerciseItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {item.exercise?.name}
          </Text>
          {item.exercise?.muscleGroup && (
            <Text style={[styles.muscle, { color: colors.textMuted }]}>
              {item.exercise.muscleGroup}
            </Text>
          )}
        </View>
        <Pressable onPress={() => setRemoveId(item.id)} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={colors.danger} />
        </Pressable>
      </Pressable>
    </ScaleDecorator>
  );

  const isInitialLoad = loading && day === null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: day?.name ?? 'Día', headerShown: true }} />

        <View style={styles.content}>
          {isInitialLoad ? (
            <LoadingState />
          ) : day?.exercises.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Agrega ejercicios a este día.
              </Text>
            </View>
          ) : (
            <DraggableFlatList
              data={day?.exercises ?? []}
              keyExtractor={(item) => String(item.id)}
              onDragEnd={handleDragEnd}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}

          {loading && day !== null && (
            <View style={[styles.refreshOverlay, { backgroundColor: colors.overlay }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button title="Agregar ejercicio" onPress={openPicker} variant="secondary" disabled={loading && day === null} />
          <Button title="Iniciar entrenamiento" onPress={handleStart} loading={starting} size="lg" disabled={loading && day === null} />
        </View>

        <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar ejercicio</Text>
              <Pressable onPress={closePicker}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
            </View>

            {allExercises.length > 0 && (
              <View style={styles.searchContainer}>
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar por nombre, músculo o equipo..."
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  compact
                />
              </View>
            )}

            {allExercises.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Primero crea ejercicios en el catálogo, luego agrégalos aquí.
                </Text>
                <Button
                  title="Ir al catálogo de ejercicios"
                  onPress={() => {
                    closePicker();
                    router.push('/exercises');
                  }}
                  style={{ marginTop: spacing.md }}
                />
                <Button
                  title="Crear ejercicio nuevo"
                  onPress={() => {
                    closePicker();
                    router.push('/exercises/new');
                  }}
                  variant="secondary"
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            ) : filteredExercises.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No hay ejercicios que coincidan con "{searchQuery.trim()}".
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const alreadyAdded = day?.exercises.some((e) => e.exerciseId === item.id);
                  return (
                    <Pressable
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: colors.border, opacity: alreadyAdded ? 0.5 : 1 },
                      ]}
                      onPress={() => !alreadyAdded && handleAddExercise(item.id)}
                      disabled={alreadyAdded}>
                      <View style={styles.pickerRow}>
                        <View style={styles.pickerInfo}>
                          <Text style={[styles.pickerName, { color: colors.text }]}>{item.name}</Text>
                          {(item.muscleGroup || item.equipment) && (
                            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
                              {[item.muscleGroup, item.equipment].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                        {alreadyAdded && (
                          <Text style={[styles.addedBadge, { color: colors.textMuted }]}>Agregado</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Modal>

        <ConfirmDialog
          visible={removeId !== null}
          title="Quitar ejercicio"
          message="¿Quitar este ejercicio del día?"
          destructive
          onConfirm={async () => {
            if (removeId) {
              await removeExerciseFromDay(removeId);
              await load();
            }
            setRemoveId(null);
          }}
          onCancel={() => setRemoveId(null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, position: 'relative' },
  list: { padding: spacing.md, paddingBottom: spacing.md },
  refreshOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: fontSize.md, fontWeight: '600' },
  muscle: { fontSize: fontSize.sm, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSize.md },
  footer: { padding: spacing.md, gap: spacing.sm },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  searchContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  pickerItem: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickerInfo: { flex: 1 },
  pickerName: { fontSize: fontSize.md, fontWeight: '500' },
  addedBadge: { fontSize: fontSize.xs, fontWeight: '600' },
});
