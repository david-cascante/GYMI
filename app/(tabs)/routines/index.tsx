import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '@/hooks/useRoutines';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function RoutinesScreen() {
  const colors = useThemeColors();
  const { routines, loading, refresh, remove, activate } = useRoutines();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh])
  );

  if (loading && routines.length === 0) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Rutinas" subtitle="Gestiona tus rutinas de entrenamiento" />

      {routines.length === 0 ? (
        <EmptyState
          title="No tienes rutinas todavía"
          description="Crea tu primera rutina para comenzar a entrenar."
          actionLabel="Crear rutina"
          onAction={() => router.push('/routines/new')}
        />
      ) : (
        <View style={styles.content}>
          <FlatList
            data={routines}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/routines/${item.id}`)}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                  {item.isActive && (
                    <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>Activa</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actions}>
                  {!item.isActive && (
                    <Pressable
                      onPress={() => activate(item.id)}
                      hitSlop={8}
                      style={styles.actionBtn}>
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setDeleteId(item.id)}
                    hitSlop={8}
                    style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </Pressable>
            )}
          />
          <View style={styles.footer}>
            <Button title="Crear rutina" onPress={() => router.push('/routines/new')} />
            <Button
              title="Catálogo de ejercicios"
              onPress={() => router.push('/exercises')}
              variant="secondary"
            />
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar rutina"
        message="¿Estás seguro? Se eliminarán todos los días y el historial asociado."
        destructive
        confirmLabel="Eliminar"
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
  list: { padding: spacing.md, paddingBottom: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { fontSize: fontSize.lg, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionBtn: { padding: 4 },
  footer: { padding: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
});
