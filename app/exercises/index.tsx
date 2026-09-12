import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ExercisesScreen() {
  const colors = useThemeColors();
  const { exercises, loading, refresh, remove } = useExercises();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh])
  );

  if (loading && exercises.length === 0) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Ejercicios' }} />

      {exercises.length === 0 ? (
        <EmptyState
          title="No hay ejercicios"
          description="Primero crea ejercicios aquí. Luego podrás agregarlos a tus rutinas."
          actionLabel="Crear ejercicio"
          onAction={() => router.push('/exercises/new')}
        />
      ) : (
        <View style={styles.content}>
          <FlatList
            data={exercises}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/exercises/${item.id}`)}>
                <View style={styles.itemContent}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  {item.muscleGroup && (
                    <Text style={[styles.sub, { color: colors.textMuted }]}>{item.muscleGroup}</Text>
                  )}
                </View>
                <Pressable onPress={() => setDeleteId(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          />
          <View style={styles.footer}>
            <Button title="Crear ejercicio" onPress={() => router.push('/exercises/new')} />
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar ejercicio"
        message="¿Eliminar este ejercicio del catálogo?"
        destructive
        onConfirm={async () => {
          if (deleteId) await remove(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  list: { padding: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemContent: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600' },
  sub: { fontSize: fontSize.sm, marginTop: 2 },
  footer: { padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
});
