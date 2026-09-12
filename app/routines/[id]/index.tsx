import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  getRoutineById,
  getDaysByRoutine,
  deleteWorkoutDay,
  reorderWorkoutDays,
} from '@/repositories/routineRepository';
import type { Routine, WorkoutDay } from '@/types/entities';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = parseInt(id, 10);
  const colors = useThemeColors();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDayId, setDeleteDayId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([
        getRoutineById(routineId),
        getDaysByRoutine(routineId),
      ]);
      setRoutine(r);
      setDays(d);
    } catch (error) {
      console.error('Error loading routine:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina.');
    } finally {
      setLoading(false);
    }
  }, [routineId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDragEnd = async ({ data }: { data: WorkoutDay[] }) => {
    setDays(data);
    await reorderWorkoutDays(data.map((d) => d.id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<WorkoutDay>) => (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        style={[styles.dayItem, { backgroundColor: colors.surface, borderColor: colors.border, opacity: isActive ? 0.8 : 1 }]}
        onPress={() => router.push(`/routines/${routineId}/day/${item.id}`)}>
        <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
        <Text style={[styles.dayName, { color: colors.text }]}>{item.name}</Text>
        <Pressable onPress={() => setDeleteDayId(item.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </ScaleDecorator>
  );

  const isInitialLoad = loading && routine === null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: routine?.name ?? 'Rutina', headerShown: true }} />

        <View style={styles.content}>
          {isInitialLoad ? (
            <LoadingState />
          ) : days.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Agrega días de entrenamiento a esta rutina.
              </Text>
            </View>
          ) : (
            <DraggableFlatList
              data={days}
              keyExtractor={(item) => String(item.id)}
              onDragEnd={handleDragEnd}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            title="Agregar día"
            onPress={() => router.push(`/routines/${routineId}/day/new`)}
            disabled={loading && routine === null}
          />
        </View>

        <ConfirmDialog
          visible={deleteDayId !== null}
          title="Eliminar día"
          message="¿Eliminar este día de entrenamiento?"
          destructive
          onConfirm={async () => {
            if (deleteDayId) {
              await deleteWorkoutDay(deleteDayId);
              await load();
            }
            setDeleteDayId(null);
          }}
          onCancel={() => setDeleteDayId(null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.md },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dayName: { flex: 1, fontSize: fontSize.lg, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSize.md, textAlign: 'center' },
  footer: { padding: spacing.md },
});
