/**
 * Reminders — Pure rules: what to say and whether a tier applies.
 * Threshold for nudges: **minimum** goal (not ideal).
 */

import {
  Habit,
  HabitLog,
  progressFor,
  periodValueFor,
  streakFor,
  valueFor,
  dayKey,
} from '../habit-engine';
import {
  celebrationBody,
  dailyAfternoonBody,
  globalMiddayBody,
  globalMorningBody,
  monthlyAlertBody,
  streakRiskBody,
  weeklyFridayBody,
} from './messages';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
}

function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archived);
}

function belowMin(habit: Habit, logs: HabitLog[], date: Date): boolean {
  const value = periodValueFor(logs, habit, date);
  const status = progressFor(habit, value).status;
  return status === 'none' || status === 'started';
}

/** At least half of habits met minimum in their period — "vas bien". */
export function isDoingWell(habits: Habit[], logs: HabitLog[], date = new Date()): boolean {
  const active = activeHabits(habits);
  if (active.length === 0) return false;
  let onTrack = 0;
  for (const h of active) {
    const value = periodValueFor(logs, h, date);
    const status = progressFor(h, value).status;
    if (status === 'min' || status === 'ideal') onTrack += 1;
  }
  return onTrack >= Math.ceil(active.length / 2);
}

export function dailyBelowMin(habits: Habit[], logs: HabitLog[], date = new Date()): Habit[] {
  return activeHabits(habits).filter(
    (h) => h.frequency === 'daily' && belowMin(h, logs, date),
  );
}

export function weeklyBelowMin(habits: Habit[], logs: HabitLog[], date = new Date()): Habit[] {
  return activeHabits(habits).filter(
    (h) => h.frequency === 'weekly' && belowMin(h, logs, date),
  );
}

export function monthlyBelowMin(habits: Habit[], logs: HabitLog[], date = new Date()): Habit[] {
  return activeHabits(habits).filter(
    (h) => h.frequency === 'monthly' && belowMin(h, logs, date),
  );
}

/** Daily habits with an active streak but today's minimum not reached yet. */
export function streaksAtRisk(
  habits: Habit[],
  logs: HabitLog[],
  date = new Date(),
): { habit: Habit; remainingToMin: number }[] {
  const today = dayKey(date);
  const out: { habit: Habit; remainingToMin: number }[] = [];
  for (const h of activeHabits(habits)) {
    if (h.frequency !== 'daily' || streakFor(h, logs, date) < 1) continue;
    const value = valueFor(logs, h.id, today);
    const p = progressFor(h, value);
    if (p.status === 'min' || p.status === 'ideal') continue;
    out.push({ habit: h, remainingToMin: p.remainingToMin });
  }
  return out;
}

/** Date that is N days before the last day of the month containing `date`. */
export function monthAlertDate(date = new Date()): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const alertDay = Math.max(1, lastDay - 7);
  return new Date(y, m, alertDay, 12, 0, 0, 0);
}

export function isMonthAlertDay(date = new Date()): boolean {
  const alert = monthAlertDate(date);
  return (
    date.getFullYear() === alert.getFullYear() &&
    date.getMonth() === alert.getMonth() &&
    date.getDate() === alert.getDate()
  );
}

/** Build payloads used when (re)scheduling local notifications. */
export function buildNotificationPayloads(
  habits: Habit[],
  logs: HabitLog[],
  userName: string,
  date = new Date(),
): {
  morning: NotificationPayload;
  midday: NotificationPayload;
  afternoon: NotificationPayload | null;
  friday: NotificationPayload | null;
  monthly: NotificationPayload | null;
  streak: NotificationPayload | null;
  celebration: NotificationPayload | null;
} {
  const title = 'Abby Habits';

  const pendingDaily = dailyBelowMin(habits, logs, date);
  const pendingWeekly = weeklyBelowMin(habits, logs, date);
  const pendingMonthly = monthlyBelowMin(habits, logs, date);
  const atRisk = streaksAtRisk(habits, logs, date);

  let afternoon: NotificationPayload | null = null;
  if (pendingDaily.length > 0) {
    afternoon = {
      id: 'afternoon-daily',
      title,
      body: dailyAfternoonBody(userName, pendingDaily),
    };
  }

  let streak: NotificationPayload | null = null;
  if (atRisk.length > 0) {
    const { habit, remainingToMin } = atRisk[0];
    streak = {
      id: 'streak-risk',
      title,
      body: streakRiskBody(userName, habit, remainingToMin, habit.unit),
    };
  }

  let friday: NotificationPayload | null = null;
  if (pendingWeekly.length > 0) {
    friday = {
      id: 'weekly-friday',
      title,
      body: weeklyFridayBody(userName, pendingWeekly),
    };
  }

  const monthly =
    pendingMonthly.length > 0
      ? {
          id: 'monthly-alert',
          title,
          body: monthlyAlertBody(userName, pendingMonthly),
        }
      : null;

  const celebration =
    isDoingWell(habits, logs, date)
      ? { id: 'celebration', title, body: celebrationBody(userName) }
      : null;

  return {
    morning: { id: 'global-morning', title, body: globalMorningBody(userName) },
    midday: { id: 'global-midday', title, body: globalMiddayBody(userName) },
    afternoon,
    friday,
    monthly,
    streak,
    celebration,
  };
}
