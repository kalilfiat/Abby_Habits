/**
 * UI — Habit card.
 *
 * Clear vertical hierarchy, each row owns one concern:
 *   1. Identity   — icon, name, frequency, edit button
 *   2. State      — status pill (left)  ·  streak chip (right)
 *   3. Metric     — big value / goal (quantity only)
 *   4. Progress   — bar (quantity only)
 *   5. Actions    — quick-log buttons (left)  ·  reset (right)
 *   6. Record     — best streak
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  FREQUENCY_LABEL,
  Habit,
  PERIOD_SCOPE_LABEL,
  progressFor,
  streakInfoFor,
} from '../../core/habit-engine';
import { HabitLog } from '../../core/habit-engine/types';
import { FadeSlideIn, ScalePressable, tapSuccess } from '../motion';
import { colors, font, fontFamily, habitCircleColor, line, radius, shadow, spacing } from '../theme';
import { CelebrationCardFrame } from './CelebrationCardFrame';
import { ProgressBar } from './ProgressBar';

interface Props {
  habit: Habit;
  value: number;
  logs: HabitLog[];
  onAdd: (delta: number) => void;
  onToggleDone: () => void;
  onReset: () => void;
  onEdit: () => void;
  /** Staggered entrance on "Hoy". */
  enterDelay?: number;
  /** Fade-in on mount; set false when swapping home tabs. */
  entrance?: boolean;
  /** Tier complete — show glow frame (confetti tier). */
  celebrating?: boolean;
  celebrationLabel?: string;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
}

const STATUS_PILL = {
  none:    { label: 'Sin registrar', bg: colors.surfaceAlt,   text: colors.textMuted },
  started: { label: 'En marcha',      bg: colors.primaryLight, text: colors.primary },
  min:     { label: 'Meta mínima',    bg: colors.warningLight, text: colors.warning },
  ideal:   { label: '¡Meta ideal!',   bg: colors.successLight, text: colors.successDark },
};

export function HabitCard({
  habit,
  value,
  logs,
  onAdd,
  onToggleDone,
  onReset,
  onEdit,
  enterDelay = 0,
  entrance = true,
  celebrating = false,
  celebrationLabel = '',
}: Props) {
  const p = progressFor(habit, value);

  const streak = streakInfoFor(habit, logs);
  const isBinary = habit.type === 'binary';
  const done = isBinary && value >= 1;

  const handleAdd = (delta: number) => {
    const next = Math.max(value + delta, 0);
    onAdd(delta);
    if (progressFor(habit, next).status === 'ideal') tapSuccess();
  };

  const handleToggleDone = () => {
    if (!done) tapSuccess();
    onToggleDone();
  };
  const isIdeal = p.status === 'ideal';
  const pill = STATUS_PILL[p.status];
  const circle = habitCircleColor(habit.id);

  const accent = isIdeal ? colors.success : colors.primary;
  const accentDark = isIdeal ? colors.successDark : colors.primaryDark;
  const accentLight = isIdeal ? colors.successLight : colors.primaryLight;
  const numberColor = p.status === 'none' ? colors.textMuted : accent;

  const freqLabel = FREQUENCY_LABEL[habit.frequency] ?? FREQUENCY_LABEL.daily;
  const periodScope = PERIOD_SCOPE_LABEL[habit.frequency] ?? PERIOD_SCOPE_LABEL.daily;

  // Streak chip colors: green at the ideal level, warm orange when just the minimum.
  const streakBg = streak.isIdeal ? colors.successLight : colors.streakLight;
  const streakFg = streak.isIdeal ? colors.successDark : colors.streak;

  const card = (
    <View style={[styles.card, celebrating && styles.cardCelebrating]}>
      {/* 1 — Identity */}
      <View style={styles.identityRow}>
        <View style={[styles.iconCircle, { backgroundColor: circle.bg }]}>
          <MaterialCommunityIcons name={habit.icon as any} size={26} color={circle.tint} />
        </View>

        <View style={styles.identityText}>
          <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
          <Text style={styles.freq}>{freqLabel}</Text>
        </View>

        <ScalePressable onPress={onEdit} hitSlop={8} style={styles.editBtn} pressedScale={0.9} haptic={false}>
          <MaterialCommunityIcons name="pencil" size={17} color={colors.textMuted} />
        </ScalePressable>
      </View>

      {/* 2 — State: status + streak, aligned on one line */}
      <View style={styles.stateRow}>
        <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.statusText, { color: pill.text }]}>{pill.label}</Text>
        </View>

        {streak.current > 0 && (
          <View style={[styles.streakChip, { backgroundColor: streakBg }]}>
            <MaterialCommunityIcons name="fire" size={15} color={streakFg} />
            <Text style={[styles.streakText, { color: streakFg }]}>
              {streak.current} {streak.current === 1 ? 'día' : 'días'}
            </Text>
          </View>
        )}
      </View>

      {/* 3 + 4 — Metric & progress (quantity only) */}
      {!isBinary && (
        <View style={styles.metricBlock}>
          <View style={styles.valueRow}>
            <Text style={[styles.valueNumber, { color: numberColor }]}>{fmt(value)}</Text>
            <Text style={styles.valueGoal}>
              {' '}/ {fmt(habit.idealGoal)} {habit.unit} · {periodScope}
            </Text>
          </View>
          <ProgressBar
            ratio={p.ratio}
            color={accent}
            minMarker={habit.idealGoal > 0 ? habit.minGoal / habit.idealGoal : undefined}
            height={12}
          />
        </View>
      )}

      {/* 5 — Actions */}
      <View style={styles.actionsRow}>
        {isBinary ? (
          <ScalePressable
            style={[styles.doneBtn, done ? { backgroundColor: colors.success } : styles.doneBtnOff]}
            onPress={handleToggleDone}
            pressedScale={0.98}
          >
            <MaterialCommunityIcons
              name={done ? 'check-circle' : 'circle-outline'}
              size={18}
              color={done ? '#fff' : colors.primaryDark}
            />
            <Text style={[styles.doneBtnText, { color: done ? '#fff' : colors.primaryDark }]}>
              {done ? '¡Hecho!' : 'Marcar como hecho'}
            </Text>
          </ScalePressable>
        ) : (
          <View style={styles.quickGroup}>
            {habit.quickAdd.map((inc) => (
              <ScalePressable
                key={inc}
                style={[styles.quickBtn, { backgroundColor: accentLight }]}
                onPress={() => handleAdd(inc)}
                pressedScale={0.92}
              >
                <Text style={[styles.quickBtnText, { color: accentDark }]}>+{fmt(inc)}</Text>
              </ScalePressable>
            ))}
            {value > 0 && (
              <ScalePressable
                style={[styles.quickBtn, { backgroundColor: accentLight }]}
                onPress={() => handleAdd(-(habit.quickAdd[0] ?? 1))}
                pressedScale={0.92}
              >
                <MaterialCommunityIcons name="minus" size={16} color={accentDark} />
              </ScalePressable>
            )}
          </View>
        )}

        {value > 0 && (
          <ScalePressable style={styles.resetBtn} onPress={onReset} hitSlop={6} pressedScale={0.94} haptic={false}>
            <MaterialCommunityIcons name="refresh" size={15} color={colors.textMuted} />
            <Text style={styles.resetText}>Reset</Text>
          </ScalePressable>
        )}
      </View>

      {/* 6 — Record */}
      {streak.best > 0 && (
        <View style={styles.footer}>
          <MaterialCommunityIcons name="trophy" size={15} color={colors.warning} />
          <Text style={styles.footerText}>
            Mejor racha: <Text style={styles.footerBold}>{streak.best} {streak.best === 1 ? 'día' : 'días'}</Text>
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FadeSlideIn delay={enterDelay} entrance={entrance}>
      {celebrating && celebrationLabel ? (
        <CelebrationCardFrame label={celebrationLabel}>{card}</CelebrationCardFrame>
      ) : (
        card
      )}
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing(5),
    gap: spacing(3.5),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow,
  },
  cardCelebrating: {
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  // 1 — Identity
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityText: { flex: 1 },
  habitName: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 20,
    lineHeight: 26,
    color: colors.heading,
    letterSpacing: 0,
  },
  freq: {
    fontSize: font.caption,
    lineHeight: line.caption,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // 2 — State
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  statusText: {
    fontSize: font.caption,
    fontWeight: '700',
  },
  streakBlock: {
    alignItems: 'center',
    gap: spacing(1),
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  streakText: {
    fontSize: font.body2,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: font.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // 3 + 4 — Metric
  metricBlock: { gap: spacing(2.5) },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  valueNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -1,
  },
  valueGoal: {
    fontSize: font.body,
    color: colors.textMuted,
    fontWeight: '500',
    paddingBottom: spacing(1.5),
  },

  // 5 — Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  quickGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  quickBtn: {
    borderRadius: radius.pill,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(4.5),
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontWeight: '700',
    fontSize: font.body,
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing(2),
    borderRadius: radius.pill,
    paddingVertical: spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnOff: { backgroundColor: colors.primaryLight },
  doneBtnText: { fontWeight: '700', fontSize: font.body },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    flexShrink: 0,
  },
  resetText: {
    fontSize: font.body2,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // 6 — Record
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing(3.5),
  },
  footerText: {
    fontSize: font.body2,
    color: colors.textMuted,
  },
  footerBold: {
    fontWeight: '700',
    color: colors.text,
  },
});
