import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatWeightReps, parseWeightInput } from '@/services/weightService';
import { validateReps, validateWeight, parseNonNegativeFloat, parsePositiveInt } from '@/utils/validation';
import { fontSize, spacing } from '@/constants/theme';
import type { LastExercisePerformance, NewPR, WeightUnit } from '@/types/entities';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { WeightUnitToggle } from './WeightUnitToggle';

interface SetLoggerProps {
  lastPerformance: LastExercisePerformance | null;
  onLogSet: (weightGrams: number, reps: number, weightUnit: WeightUnit) => Promise<NewPR[]>;
}

export function SetLogger({ lastPerformance, onLogSet }: SetLoggerProps) {
  const colors = useThemeColors();
  const [inputUnit, setInputUnit] = useState<WeightUnit>(
    () => lastPerformance?.weightUnit ?? 'kg'
  );
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    const weightVal = parseNonNegativeFloat(weight);
    const repsVal = parsePositiveInt(reps);

    if (weightVal === null) {
      Alert.alert('Error', 'Ingresa un peso válido');
      return;
    }
    if (repsVal === null) {
      Alert.alert('Error', 'Ingresa repeticiones válidas');
      return;
    }

    const weightCheck = validateWeight(weightVal);
    const repsCheck = validateReps(repsVal);
    if (!weightCheck.valid) {
      Alert.alert('Error', weightCheck.error);
      return;
    }
    if (!repsCheck.valid) {
      Alert.alert('Error', repsCheck.error);
      return;
    }

    setLoading(true);
    try {
      const weightGrams = parseWeightInput(weightVal, inputUnit);
      const newPRs = await onLogSet(weightGrams, repsVal, inputUnit);

      if (newPRs.length > 0) {
        const messages = newPRs.map((pr) => {
          if (pr.type === 'weight') {
            return `Peso: ${formatWeightReps(pr.value, 1, inputUnit).split(' ×')[0]}`;
          }
          if (pr.type === 'reps') return `Reps: ${pr.value}`;
          return 'Volumen récord';
        });
        Alert.alert('¡Nuevo récord personal!', messages.join('\n'));
      }

      setReps('');
    } finally {
      setLoading(false);
    }
  };

  const lastUnit = lastPerformance?.weightUnit ?? 'kg';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Registrar serie</Text>

      {lastPerformance && (
        <View style={[styles.lastBox, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.lastLabel, { color: colors.primary }]}>Última vez</Text>
          <Text style={[styles.lastTime, { color: colors.text }]}>
            {formatWeightReps(lastPerformance.weightGrams, lastPerformance.reps, lastUnit)}
          </Text>
        </View>
      )}

      <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>
        Unidad de la máquina
      </Text>
      <WeightUnitToggle value={inputUnit} onChange={setInputUnit} />

      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            label={`Peso (${inputUnit})`}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            large
            placeholder="0"
            compact
          />
        </View>
        <View style={styles.field}>
          <Input
            label="Reps"
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            large
            placeholder="0"
            compact
          />
        </View>
      </View>

      <Button
        title="Registrar serie"
        onPress={handleLog}
        size="lg"
        loading={loading}
        style={styles.logBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  lastBox: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  lastLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lastTime: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  logBtn: {
    marginTop: spacing.sm,
  },
});
