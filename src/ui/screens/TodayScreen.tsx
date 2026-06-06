/**
 * UI — "Hoy" screen. Header with mascot + greeting, insight strip,
 * habit cards and a gradient CTA.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CELEBRATION_TIER_LABEL,
  dayKey,
  habitInCelebratingTier,
  periodValueFor,
  progressFor,
  shouldCelebrateConfetti,
  streakFor,
} from '../../core/habit-engine';
import { homeMessage, homePose, MASCOT, progressMessage, progressPose } from '../../core/mascot';
import { MascotMood } from '../../core/mascot';
import { useStore } from '../../store/useStore';
import { AbbyAvatar } from '../components/AbbyAvatar';
import { HabitCard } from '../components/HabitCard';
import { HabitProgressCard } from '../components/HabitProgressCard';
import { HomeTab, HomeTabBar } from '../components/HomeTabBar';
import { ProgressSummaryCard } from '../components/ProgressSummaryCard';
import { Insight, InsightData } from '../components/Insight';
import { RootStackParamList } from '../navigation';
import { AmbientBackground, ConfettiBackground, FadeSlideIn, ScalePressable, motion } from '../motion';
import { colors, font, fontFamily, line, radius, shadow, shadowStrong, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Today'>;

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function prettyDate(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** Icon shown in the insight card for each mascot mood (MaterialCommunityIcons). */
const MOOD_ICON: Record<MascotMood, string> = {
  celebrate: 'trophy',
  cheer: 'fire',
  remind: 'alarm',
  happy: 'star-four-points',
  idle: 'message-text-outline',
};

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
}

/** Short names (e.g. "¡Hola, Kalil!") should stay on one line on narrow Android headers. */
const GREETING_ONE_LINE_MAX = 22;

export function TodayScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const userName = useStore((s) => s.userName);
  const addProgress = useStore((s) => s.addProgress);
  const setProgress = useStore((s) => s.setProgress);
  const resetPeriod = useStore((s) => s.resetPeriod);

  const [homeTab, setHomeTab] = useState<HomeTab>('today');
  /** Only the first paint of the list uses staggered fade (tab swaps stay instant). */
  const cardEntrance = useRef(true);
  useEffect(() => {
    cardEntrance.current = false;
  }, []);

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const today = dayKey();
  const mascot = useMemo(() => homeMessage(habits, logs), [habits, logs]);
  const progressMascot = useMemo(
    () => progressMessage(habits, logs, userName),
    [habits, logs, userName],
  );
  const pose = useMemo(
    () => (homeTab === 'progress' ? progressPose(habits, logs, userName) : homePose(habits, logs)),
    [homeTab, habits, logs, userName],
  );

  const showConfetti = useMemo(
    () => shouldCelebrateConfetti(habits, logs),
    [habits, logs],
  );

  const streakAlerts = useMemo(() => {
    return active
      .filter((h) => {
        if (streakFor(h, logs) < 1) return false;
        const p = progressFor(h, periodValueFor(logs, h));
        return p.status === 'none' || p.status === 'started';
      })
      .map((h) => {
        const p = progressFor(h, periodValueFor(logs, h));
        return { habit: h, remainingToMin: p.remainingToMin, streakDays: streakFor(h, logs) };
      });
  }, [active, logs, today]);

  const greeting = userName ? `¡Hola, ${userName}!` : '¡Hola!';
  const greetingOneLine = greeting.length <= GREETING_ONE_LINE_MAX;

  const insight: InsightData = useMemo(() => {
    if (homeTab === 'progress') {
      const msg = progressMascot;
      return { kind: 'message', icon: MOOD_ICON[msg.mood], text: msg.text };
    }
    if (streakAlerts.length > 0) {
      const { habit, remainingToMin } = streakAlerts[0];
      const isBinary = habit.type === 'binary';
      return {
        kind: 'streak',
        icon: 'fire',
        title: `Tu racha de ${habit.name} sigue viva`,
        highlight: isBinary ? 'Hacelo hoy' : `Solo ${fmt(remainingToMin)} ${habit.unit}`,
        tail: isBinary ? ' para mantenerla' : ' hoy para mantenerla',
        onPress: () => navigation.navigate('HabitEdit', { habitId: habit.id }),
      };
    }
    return { kind: 'message', icon: MOOD_ICON[mascot.mood], text: mascot.text };
  }, [homeTab, streakAlerts, mascot, progressMascot, navigation]);

  const insightKey =
    homeTab === 'progress'
      ? `progress-${progressMascot.mood}`
      : insight.kind === 'streak'
        ? `streak-${streakAlerts[0]?.habit.id ?? ''}`
        : `msg-${mascot.mood}`;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <ConfettiBackground active={showConfetti} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={0}>
          <View style={styles.headerCard}>
            <View style={styles.mascotSlot}>
              <AbbyAvatar pose={pose} fill />
            </View>

            <View style={styles.headerRight}>
              <View style={styles.greetingRow}>
                <View style={styles.headerText}>
                  <Text
                    style={styles.greeting}
                    numberOfLines={greetingOneLine ? 1 : 2}
                    adjustsFontSizeToFit={greetingOneLine}
                    minimumFontScale={0.82}
                  >
                    {greeting}
                  </Text>
                  <Text style={styles.date} numberOfLines={1}>
                    {prettyDate()}
                  </Text>
                </View>
                <ScalePressable
                  style={styles.bellBtn}
                  hitSlop={6}
                  pressedScale={0.9}
                  haptic={false}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
                </ScalePressable>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={motion.stagger * 2}>
          <HomeTabBar value={homeTab} onChange={setHomeTab} />
        </FadeSlideIn>

        <FadeSlideIn delay={motion.stagger * 2} trigger={insightKey} entrance={cardEntrance.current}>
          <Insight {...insight} />
        </FadeSlideIn>

        {homeTab === 'progress' && active.length > 0 && (
          <ProgressSummaryCard habits={habits} logs={logs} />
        )}

        {active.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Todavía no tenés hábitos</Text>
            <Text style={styles.emptyText}>
              Charlá con {MASCOT.name} y creá tu primer hábito en lenguaje natural.
            </Text>
          </View>
        ) : homeTab === 'today' ? (
          <View style={styles.list}>
            {active.map((habit, index) => (
              <HabitCard
                key={habit.id}
                enterDelay={motion.stagger * (index + 1)}
                entrance={cardEntrance.current}
                habit={habit}
                celebrating={habitInCelebratingTier(habit, habits, logs)}
                celebrationLabel={CELEBRATION_TIER_LABEL[habit.frequency]}
                value={periodValueFor(logs, habit)}
                logs={logs}
                onAdd={(delta) => addProgress(habit.id, delta)}
                onToggleDone={() => {
                  const v = periodValueFor(logs, habit);
                  if (v >= 1) resetPeriod(habit.id);
                  else setProgress(habit.id, 1);
                }}
                onReset={() => resetPeriod(habit.id)}
                onEdit={() => navigation.navigate('HabitEdit', { habitId: habit.id })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.legendOnce}>
              Gris sin mínimo · Cyan en marcha · Ámbar mínimo · Verde ideal
            </Text>
            {active.map((habit, index) => (
              <HabitProgressCard
                key={habit.id}
                enterDelay={motion.stagger * (index + 1)}
                entrance={cardEntrance.current}
                habit={habit}
                logs={logs}
                showHistoryLegend={false}
                onEdit={() => navigation.navigate('HabitEdit', { habitId: habit.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {homeTab === 'today' && (
        <ScalePressable
          style={[styles.fabWrap, { bottom: insets.bottom + spacing(5) }]}
          onPress={() => navigation.navigate('Chat')}
          pressedScale={0.94}
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
            <Text style={styles.fabText}>Nuevo hábito</Text>
          </LinearGradient>
        </ScalePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  scroll: { flex: 1, backgroundColor: 'transparent', zIndex: 2 },
  content: { paddingHorizontal: spacing(5), gap: spacing(4) },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    minHeight: 128,
  },
  mascotSlot: {
    width: '36%',
    maxWidth: 160,
    minWidth: 108,
    height: 128,
    overflow: 'hidden',
  },
  headerRight: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    minHeight: 128,
    zIndex: 2,
    paddingRight: spacing(1),
    paddingTop: spacing(3),
  },
  greetingRow: {
    position: 'relative',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 48,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: fontFamily.display,
    fontSize: Platform.select({ android: 32, default: 34 }),
    lineHeight: Platform.select({ android: 38, default: 40 }),
    color: colors.heading,
    letterSpacing: -0.3,
    flexShrink: 1,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  date: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: font.body,
    lineHeight: line.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  bellBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    zIndex: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : null),
  },

  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing(7),
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing(2),
    ...shadow,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: line.body },

  list: { gap: spacing(4) },
  legendOnce: {
    fontSize: font.caption,
    color: colors.textLight,
    lineHeight: 16,
    marginBottom: -spacing(1),
  },

  fabWrap: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: radius.pill,
    ...shadowStrong,
    zIndex: 50,
    elevation: 50,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(7),
    borderRadius: radius.pill,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: font.body },
});
