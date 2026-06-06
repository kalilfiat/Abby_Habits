/**
 * Habit Engine — Pure calculations over habits and their logs.
 *
 * No side effects. Given habits + logs, it answers: how am I doing today?
 */

import { Frequency, Habit, HabitLog, Progress, ProgressStatus } from './types';

/** Local calendar day key (YYYY-MM-DD) for a date — defaults to now. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Accumulated value logged for a habit on a given day. */
export function valueFor(logs: HabitLog[], habitId: string, date = dayKey()): number {
  return logs
    .filter((l) => l.habitId === habitId && l.date === date)
    .reduce((sum, l) => sum + l.value, 0);
}

/** Sum logs for one habit between two day keys (inclusive, YYYY-MM-DD). */
export function valueBetween(
  logs: HabitLog[],
  habitId: string,
  fromKey: string,
  toKey: string,
): number {
  return logs
    .filter((l) => l.habitId === habitId && l.date >= fromKey && l.date <= toKey)
    .reduce((sum, l) => sum + l.value, 0);
}

/** Monday–Sunday day keys for the week containing `date` (local calendar). */
export function weekRange(date: Date = new Date()): { from: string; to: string } {
  const d = new Date(date);
  const weekday = d.getDay();
  const toMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(d);
  monday.setDate(d.getDate() + toMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: dayKey(monday), to: dayKey(sunday) };
}

/** First–last day keys for the month containing `date`. */
export function monthRange(date: Date = new Date()): { from: string; to: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const mm = `${m + 1}`.padStart(2, '0');
  return {
    from: `${y}-${mm}-01`,
    to: `${y}-${mm}-${`${last}`.padStart(2, '0')}`,
  };
}

/** Progress value for a habit within its frequency period (day / week / month). */
export function periodValueFor(logs: HabitLog[], habit: Habit, date = new Date()): number {
  switch (habit.frequency) {
    case 'weekly': {
      const { from, to } = weekRange(date);
      return valueBetween(logs, habit.id, from, to);
    }
    case 'monthly': {
      const { from, to } = monthRange(date);
      return valueBetween(logs, habit.id, from, to);
    }
    default:
      return valueFor(logs, habit.id, dayKey(date));
  }
}

/** Calendar bounds for the habit's tracking period (resets when the period changes). */
export function periodRangeFor(habit: Habit, date = new Date()): { from: string; to: string } {
  switch (habit.frequency) {
    case 'weekly':
      return weekRange(date);
    case 'monthly':
      return monthRange(date);
    default:
      return { from: dayKey(date), to: dayKey(date) };
  }
}

/** Parse a YYYY-MM-DD key into a local Date (avoids UTC-midnight offset). */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Every day key from `from` through `to`, inclusive. */
export function dayKeysInRange(fromKey: string, toKey: string): string[] {
  const keys: string[] = [];
  const cursor = dateFromKey(fromKey);
  const end = dateFromKey(toKey);
  while (cursor <= end) {
    keys.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function toDate(ref: Date | string): Date {
  return typeof ref === 'string' ? dateFromKey(ref) : ref;
}

function reachedMinForPeriod(habit: Habit, logs: HabitLog[], date: Date): boolean {
  const value = periodValueFor(logs, habit, date);
  const status = progressFor(habit, value).status;
  return status === 'min' || status === 'ideal';
}

function reachedIdealForPeriod(habit: Habit, logs: HabitLog[], date: Date): boolean {
  const value = periodValueFor(logs, habit, date);
  return progressFor(habit, value).status === 'ideal';
}

/** True when every active habit of this frequency reached at least its minimum in-period. */
export function allMinsMetForFrequency(
  habits: Habit[],
  logs: HabitLog[],
  frequency: Frequency,
  date = new Date(),
): boolean {
  const group = habits.filter((h) => !h.archived && h.frequency === frequency);
  if (group.length === 0) return false;
  return group.every((h) => reachedMinForPeriod(h, logs, date));
}

/** True when every active habit of this frequency reached its ideal goal in-period. */
export function allIdealsMetForFrequency(
  habits: Habit[],
  logs: HabitLog[],
  frequency: Frequency,
  date = new Date(),
): boolean {
  const group = habits.filter((h) => !h.archived && h.frequency === frequency);
  if (group.length === 0) return false;
  return group.every((h) => reachedIdealForPeriod(h, logs, date));
}

/** Whether this frequency tier triggers confetti (daily = min; weekly/monthly = ideal). */
export function confettiTierActive(
  habits: Habit[],
  logs: HabitLog[],
  frequency: Frequency,
  date = new Date(),
): boolean {
  if (frequency === 'daily') return allMinsMetForFrequency(habits, logs, 'daily', date);
  return allIdealsMetForFrequency(habits, logs, frequency, date);
}

/**
 * Background confetti: daily tier at minimum; weekly and monthly tiers at ideal.
 * Tiers are independent.
 */
export function shouldCelebrateConfetti(
  habits: Habit[],
  logs: HabitLog[],
  date = new Date(),
): boolean {
  return (
    confettiTierActive(habits, logs, 'daily', date) ||
    confettiTierActive(habits, logs, 'weekly', date) ||
    confettiTierActive(habits, logs, 'monthly', date)
  );
}

/** Glowing card: this habit hit ideal and its tier is celebrating. */
export function habitInCelebratingTier(
  habit: Habit,
  habits: Habit[],
  logs: HabitLog[],
  date = new Date(),
): boolean {
  if (habit.archived) return false;
  if (!reachedIdealForPeriod(habit, logs, date)) return false;
  return confettiTierActive(habits, logs, habit.frequency, date);
}

function statusFor(value: number, minGoal: number, idealGoal: number): ProgressStatus {
  if (value <= 0) return 'none';
  if (value >= idealGoal) return 'ideal';
  if (value >= minGoal) return 'min';
  return 'started';
}

/** Progress of a single habit against its goals, given the value logged. */
export function progressFor(habit: Habit, value: number): Progress {
  const ratio = habit.idealGoal > 0 ? Math.min(value / habit.idealGoal, 1) : value > 0 ? 1 : 0;
  return {
    value,
    minGoal: habit.minGoal,
    idealGoal: habit.idealGoal,
    ratio,
    status: statusFor(value, habit.minGoal, habit.idealGoal),
    remainingToIdeal: Math.max(habit.idealGoal - value, 0),
    remainingToMin: Math.max(habit.minGoal - value, 0),
  };
}

export interface DailySummary {
  total: number;
  untouched: number;
  atLeastMin: number;
  completed: number;
  overallRatio: number;
}

/** Roll up progress for each habit within its own frequency period. */
export function summarize(habits: Habit[], logs: HabitLog[], ref: Date | string = new Date()): DailySummary {
  const date = toDate(ref);
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) {
    return { total: 0, untouched: 0, atLeastMin: 0, completed: 0, overallRatio: 0 };
  }

  let untouched = 0;
  let atLeastMin = 0;
  let completed = 0;
  let ratioSum = 0;

  for (const habit of active) {
    const p = progressFor(habit, periodValueFor(logs, habit, date));
    if (p.status === 'none') untouched += 1;
    if (p.status === 'min' || p.status === 'ideal') atLeastMin += 1;
    if (p.status === 'ideal') completed += 1;
    ratioSum += p.ratio;
  }

  return {
    total: active.length,
    untouched,
    atLeastMin,
    completed,
    overallRatio: ratioSum / active.length,
  };
}

/**
 * Current min-streak: consecutive days ending today (or yesterday) where
 * the habit reached at least its minimum goal. Today is allowed to be empty
 * so the streak "stays alive" until end of day.
 */
export function streakFor(habit: Habit, logs: HabitLog[], today = new Date()): number {
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i += 1) {
    const key = dayKey(cursor);
    const value = valueFor(logs, habit.id, key);
    const reached = value >= habit.minGoal && habit.minGoal > 0;

    if (reached) {
      streak += 1;
    } else if (i === 0) {
      // Today not done yet — that's fine, keep counting from yesterday.
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Current ideal-streak: same as streakFor but the threshold is idealGoal.
 * Used to distinguish "mínimo sostenido" from "racha ideal" in the UI.
 */
export function idealStreakFor(habit: Habit, logs: HabitLog[], today = new Date()): number {
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i += 1) {
    const key = dayKey(cursor);
    const value = valueFor(logs, habit.id, key);
    const reached = value >= habit.idealGoal && habit.idealGoal > 0;

    if (reached) {
      streak += 1;
    } else if (i === 0) {
      // Today not done yet — keep counting from yesterday.
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Best (longest) min-streak ever for a habit, scanning all historical logs.
 * Used to show the personal record in the habit card.
 */
export function bestStreakFor(habit: Habit, logs: HabitLog[]): number {
  const successDates = [
    ...new Set(logs.filter((l) => l.habitId === habit.id).map((l) => l.date)),
  ]
    .filter(
      (date) =>
        valueFor(logs, habit.id, date) >= habit.minGoal && habit.minGoal > 0,
    )
    .sort();

  if (successDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < successDates.length; i += 1) {
    const diff = Math.round(
      (dateFromKey(successDates[i]).getTime() -
        dateFromKey(successDates[i - 1]).getTime()) /
        86_400_000,
    );
    if (diff === 1) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

export interface StreakInfo {
  current: number;
  best: number;
  /** Whether the current streak is at the "ideal" level (all ideal days). */
  isIdeal: boolean;
}

/** Convenience: all streak data for a habit in one call. */
export function streakInfoFor(habit: Habit, logs: HabitLog[]): StreakInfo {
  const current = streakFor(habit, logs);
  const ideal = idealStreakFor(habit, logs);
  return {
    current,
    best: bestStreakFor(habit, logs),
    isIdeal: ideal > 0 && ideal === current,
  };
}
