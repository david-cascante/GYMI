import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/contexts/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { exportBackup, importBackup } from '@/services/backupService';
import { wipeDatabase } from '@/database/client';
import { REST_PRESETS } from '@/constants/restPresets';
import type { ThemeMode } from '@/types/entities';
import { fontSize, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function MoreScreen() {
  const colors = useThemeColors();
  const {
    theme,
    defaultRestSeconds,
    updateTheme,
    updateDefaultRestSeconds,
    refresh,
  } = useSettings();
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showWipeFinal, setShowWipeFinal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
      Alert.alert('Éxito', 'Datos exportados correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importBackup();
      if (result.success) {
        await refresh();
        Alert.alert('Éxito', 'Datos importados correctamente');
      } else {
        Alert.alert('Error', result.error ?? 'Error al importar');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleWipe = async () => {
    await wipeDatabase();
    await refresh();
    setShowWipeFinal(false);
    Alert.alert('Datos eliminados', 'Todos los datos han sido eliminados');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Más" subtitle="Configuración y datos" />

        <Section title="Tema" colors={colors}>
          {(['dark', 'light', 'system'] as ThemeMode[]).map((t) => (
            <OptionRow
              key={t}
              label={t === 'dark' ? 'Oscuro' : t === 'light' ? 'Claro' : 'Sistema'}
              selected={theme === t}
              onPress={() => updateTheme(t)}
              colors={colors}
            />
          ))}
        </Section>

        <Section title="Temporizador de descanso" colors={colors}>
          {REST_PRESETS.map((preset) => (
            <OptionRow
              key={preset.seconds}
              label={preset.label}
              selected={defaultRestSeconds === preset.seconds}
              onPress={() => updateDefaultRestSeconds(preset.seconds)}
              colors={colors}
            />
          ))}
        </Section>

        <Section title="Gestión de datos" colors={colors}>
          <ActionRow
            icon="download-outline"
            label={exporting ? 'Exportando...' : 'Exportar datos'}
            onPress={handleExport}
            colors={colors}
          />
          <ActionRow
            icon="cloud-upload-outline"
            label={importing ? 'Importando...' : 'Importar datos'}
            onPress={handleImport}
            colors={colors}
          />
          <ActionRow
            icon="trash-outline"
            label="Eliminar todos los datos"
            onPress={() => setShowWipeConfirm(true)}
            colors={colors}
            destructive
          />
        </Section>
      </ScrollView>

      <ConfirmDialog
        visible={showWipeConfirm}
        title="Eliminar todos los datos"
        message="Esta acción eliminará rutinas, ejercicios, historial y configuración. ¿Continuar?"
        destructive
        confirmLabel="Continuar"
        onConfirm={() => {
          setShowWipeConfirm(false);
          setShowWipeFinal(true);
        }}
        onCancel={() => setShowWipeConfirm(false)}
      />

      <ConfirmDialog
        visible={showWipeFinal}
        title="Confirmación final"
        message="Esta acción NO se puede deshacer. ¿Eliminar todos los datos?"
        destructive
        confirmLabel="Eliminar todo"
        onConfirm={handleWipe}
        onCancel={() => setShowWipeFinal(false)}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  colors,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={destructive ? colors.danger : colors.textSecondary} />
      <Text style={[styles.rowLabel, { color: destructive ? colors.danger : colors.text, marginLeft: spacing.sm }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase' },
  sectionBody: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  rowLabel: { fontSize: fontSize.md, flex: 1 },
});
