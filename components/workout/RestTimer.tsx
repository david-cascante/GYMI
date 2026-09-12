import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { REST_PRESETS } from '@/constants/restPresets';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/SettingsContext';

interface RestTimerProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function RestTimer({ onComplete, compact = false }: RestTimerProps) {
  const colors = useThemeColors();
  const { defaultRestSeconds } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const [seconds, setSeconds] = useState(defaultRestSeconds);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
    clearTimer();
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    clearTimer();
    setRunning(false);
  };

  const reset = () => {
    clearTimer();
    setRunning(false);
    setRemaining(seconds);
  };

  const skip = () => {
    clearTimer();
    setRunning(false);
    setRemaining(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!expanded) {
    return (
      <Pressable
        style={[
          styles.collapsed,
          compact && styles.collapsedCompact,
          { backgroundColor: colors.surfaceElevated },
        ]}
        onPress={() => setExpanded(true)}>
        <Ionicons name="timer-outline" size={compact ? 20 : 24} color={colors.primary} />
        {!compact && (
          <Text style={[styles.collapsedText, { color: colors.text }]}>
            {running ? formatTime(remaining) : 'Temporizador'}
          </Text>
        )}
        {compact && running && (
          <Text style={[styles.compactTime, { color: colors.primary }]}>
            {formatTime(remaining)}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Descanso</Text>
        <Pressable onPress={() => setExpanded(false)}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.time, { color: colors.primary }]}>
        {formatTime(running ? remaining : seconds)}
      </Text>

      <View style={styles.presets}>
        {REST_PRESETS.map((preset) => (
          <Pressable
            key={preset.seconds}
            style={[
              styles.preset,
              {
                backgroundColor: seconds === preset.seconds ? colors.primaryMuted : colors.inputBackground,
                borderColor: seconds === preset.seconds ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              if (!running) setSeconds(preset.seconds);
            }}>
            <Text
              style={{
                color: seconds === preset.seconds ? colors.primary : colors.textSecondary,
                fontWeight: '600',
              }}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        {!running ? (
          <Pressable style={[styles.controlBtn, { backgroundColor: colors.primary }]} onPress={start}>
            <Ionicons name="play" size={28} color="#FFF" />
          </Pressable>
        ) : (
          <Pressable style={[styles.controlBtn, { backgroundColor: colors.warning }]} onPress={pause}>
            <Ionicons name="pause" size={28} color="#FFF" />
          </Pressable>
        )}
        <Pressable style={[styles.controlBtn, { backgroundColor: colors.inputBackground }]} onPress={reset}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </Pressable>
        <Pressable style={[styles.controlBtn, { backgroundColor: colors.inputBackground }]} onPress={skip}>
          <Ionicons name="play-skip-forward" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  collapsedCompact: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  collapsedText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  compactTime: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  containerCompact: {
    position: 'absolute',
    top: 56,
    right: spacing.md,
    left: spacing.md,
    zIndex: 10,
    marginHorizontal: 0,
    marginBottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  time: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
