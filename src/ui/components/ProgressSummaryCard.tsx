/**
 * UI — Global progress roll-up for the Progreso tab.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Habit, HabitLog, progressOverview } from '../../core/habit-engine';
import { colors, font, fontFamily, radius, shadow, spacing } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
}

export function ProgressSummaryCard({ habits, logs }: Props) {
  const o = useMemo(() => progressOverview(habits, logs), [habits, logs]);

  if (o.total === 0) return null;

  const allIdeal = o.total > 0 && o.atIdeal === o.total;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resumen del período</Text>

      <View style={styles.statsRow}>
        <StatChip
          icon="check-circle-outline"
          label="En mínimo"
          value={`${o.atLeastMin}/${o.total}`}
          tint={colors.warning}
          bg={colors.warningLight}
        />
        <StatChip
          icon="star-four-points"
          label="En ideal"
          value={`${o.atIdeal}/${o.total}`}
          tint={colors.successDark}
          bg={colors.successLight}
        />
      </View>

      <View style={styles.barBlock}>
        <Text style={styles.barLabel}>Avance global (promedio hacia el ideal)</Text>
        <ProgressBar ratio={o.overallRatio} color={colors.primary} height={8} />
      </View>

      {o.topStreak && o.topStreak.days > 0 && (
        <View style={styles.streakRow}>
          <MaterialCommunityIcons name="fire" size={18} color={colors.streak} />
          <Text style={styles.streakText}>
            Mejor racha activa:{' '}
            <Text style={styles.streakBold}>
              {o.topStreak.habit.name} · {o.topStreak.days}{' '}
              {o.topStreak.days === 1 ? 'día' : 'días'}
            </Text>
          </Text>
        </View>
      )}

      {o.needsAttention.length > 0 && (
        <Text style={styles.hint}>
          {o.needsAttention.length === 1
            ? `1 hábito todavía no llegó al mínimo: ${o.needsAttention[0].name}.`
            : `${o.needsAttention.length} hábitos todavía no llegaron al mínimo.`}
        </Text>
      )}

      {allIdeal && (
        <Text style={styles.hintSuccess}>¡Período ideal en todos! 🎉</Text>
      )}
    </View>
  );
}

function StatChip({
  icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: string;
  label: string;
  value: string;
  tint: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={18} color={tint} />
      <View>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={[styles.chipValue, { color: tint }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing(3),
    ...shadow,
  },
  title: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: font.body,
    color: colors.heading,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    borderRadius: radius.md,
    padding: spacing(2.5),
  },
  chipLabel: {
    fontSize: font.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: font.body,
    fontWeight: '800',
  },
  barBlock: { gap: spacing(1.5) },
  barLabel: {
    fontSize: font.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  streakText: {
    flex: 1,
    fontSize: font.body2,
    color: colors.textMuted,
  },
  streakBold: {
    fontWeight: '800',
    color: colors.text,
  },
  hint: {
    fontSize: font.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  hintSuccess: {
    fontSize: font.caption,
    fontWeight: '700',
    color: colors.successDark,
  },
});
