/**
 * UI — Read-only progress summary for one habit (Progreso tab).
 * Collapsed by default; tap header to expand.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  FREQUENCY_LABEL,
  Habit,
  HabitLog,
  PERIOD_SCOPE_LABEL,
  historyForHabit,
  periodValueFor,
  progressFor,
  streakInfoFor,
} from '../../core/habit-engine';
import { FadeSlideIn, ScalePressable } from '../motion';
import { colors, font, fontFamily, habitCircleColor, line, radius, shadow, spacing } from '../theme';
import { PeriodHistoryStrip } from './PeriodHistoryStrip';
import { ProgressBar } from './ProgressBar';

interface Props {
  habit: Habit;
  logs: HabitLog[];
  onEdit?: () => void;
  enterDelay?: number;
  entrance?: boolean;
  /** Show color legend only on the first expanded card in a list. */
  showHistoryLegend?: boolean;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
}

const STATUS_PILL = {
  none: { label: 'Sin registrar', bg: colors.surfaceAlt, text: colors.textMuted },
  started: { label: 'En marcha', bg: colors.primaryLight, text: colors.primary },
  min: { label: 'Meta mínima', bg: colors.warningLight, text: colors.warning },
  ideal: { label: '¡Meta ideal!', bg: colors.successLight, text: colors.successDark },
};

export function HabitProgressCard({
  habit,
  logs,
  onEdit,
  enterDelay = 0,
  entrance = true,
  showHistoryLegend = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const value = periodValueFor(logs, habit);
  const p = progressFor(habit, value);
  const streak = streakInfoFor(habit, logs);
  const history = useMemo(() => historyForHabit(habit, logs), [habit, logs]);

  const pill = STATUS_PILL[p.status];
  const circle = habitCircleColor(habit.id);
  const isBinary = habit.type === 'binary';
  const isIdeal = p.status === 'ideal';
  const accent = isIdeal ? colors.success : colors.primary;
  const periodScope = PERIOD_SCOPE_LABEL[habit.frequency];
  const freqLabel = FREQUENCY_LABEL[habit.frequency];

  const streakBg = streak.isIdeal ? colors.successLight : colors.streakLight;
  const streakFg = streak.isIdeal ? colors.successDark : colors.streak;

  const collapsedSubtitle = isBinary
    ? `${value >= 1 ? 'Hecho' : 'Pendiente'} · ${periodScope}`
    : `${fmt(value)} / ${fmt(habit.idealGoal)} ${habit.unit} · ${periodScope}`;

  return (
    <FadeSlideIn delay={enterDelay} entrance={entrance}>
      <View style={styles.card}>
        <ScalePressable
          onPress={() => setExpanded((e) => !e)}
          style={[styles.headerPress, styles.headerRow]}
          pressedScale={0.99}
          haptic={false}
        >
          <View style={[styles.iconCircle, { backgroundColor: circle.bg }]}>
            <MaterialCommunityIcons name={habit.icon as any} size={26} color={circle.tint} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.habitName} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={styles.freq} numberOfLines={1}>
              {expanded ? freqLabel : collapsedSubtitle}
            </Text>
          </View>
          <View style={styles.headerTrailing}>
            <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
              <Text style={[styles.statusText, { color: pill.text }]}>{pill.label}</Text>
            </View>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.textMuted}
            />
          </View>
        </ScalePressable>

        {expanded && (
          <View style={styles.body}>
            <View style={styles.stateRow}>
              {streak.current > 0 && (
                <View style={[styles.streakChip, { backgroundColor: streakBg }]}>
                  <MaterialCommunityIcons name="fire" size={15} color={streakFg} />
                  <Text style={[styles.streakText, { color: streakFg }]}>
                    {streak.current} {streak.current === 1 ? 'día' : 'días'}
                  </Text>
                </View>
              )}
              {onEdit && (
                <ScalePressable onPress={onEdit} style={styles.editBtn} pressedScale={0.94} haptic={false}>
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editText}>Editar</Text>
                </ScalePressable>
              )}
            </View>

            {!isBinary ? (
              <View style={styles.metricBlock}>
                <ProgressBar
                  ratio={p.ratio}
                  color={accent}
                  minMarker={habit.idealGoal > 0 ? habit.minGoal / habit.idealGoal : undefined}
                  height={12}
                />
              </View>
            ) : null}

            <PeriodHistoryStrip cells={history} showLegend={showHistoryLegend} />

            {streak.best > 0 && (
              <View style={styles.footer}>
                <MaterialCommunityIcons name="trophy" size={15} color={colors.warning} />
                <Text style={styles.footerText}>
                  Mejor racha:{' '}
                  <Text style={styles.footerBold}>
                    {streak.best} {streak.best === 1 ? 'día' : 'días'}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadow,
  },
  headerPress: {
    padding: spacing(4),
    alignSelf: 'stretch',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing(2),
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    flexShrink: 0,
    marginLeft: 'auto',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  habitName: {
    fontFamily: fontFamily.displayRegular,
    fontSize: font.h3,
    lineHeight: line.body,
    color: colors.heading,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  freq: {
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  body: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4),
    gap: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing(3),
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  streakText: { fontSize: font.caption, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  editText: {
    fontSize: font.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  metricBlock: { gap: spacing(2), alignSelf: 'stretch', width: '100%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingTop: spacing(1),
  },
  footerText: { fontSize: font.body2, color: colors.textMuted },
  footerBold: { fontWeight: '800', color: colors.text },
});
