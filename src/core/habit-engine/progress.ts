/**
 * Habit Engine — Roll-up stats for the Progreso tab.
 */

import { Habit, HabitLog } from './types';
import { periodValueFor, progressFor, streakFor, summarize } from './engine';

export interface ProgressOverview {
  total: number;
  atLeastMin: number;
  atIdeal: number;
  untouched: number;
  overallRatio: number;
  topStreak: { habit: Habit; days: number } | null;
  /** Active habits still below minimum this period. */
  needsAttention: Habit[];
}

export function progressOverview(
  habits: Habit[],
  logs: HabitLog[],
  ref: Date = new Date(),
): ProgressOverview {
  const active = habits.filter((h) => !h.archived);
  const summary = summarize(active, logs, ref);

  let topStreak: ProgressOverview['topStreak'] = null;
  const needsAttention: Habit[] = [];

  for (const habit of active) {
    const value = periodValueFor(logs, habit, ref);
    const status = progressFor(habit, value).status;
    if (status === 'none' || status === 'started') {
      needsAttention.push(habit);
    }

    const days = streakFor(habit, logs, ref);
    if (days > 0 && (!topStreak || days > topStreak.days)) {
      topStreak = { habit, days };
    }
  }

  return {
    total: summary.total,
    atLeastMin: summary.atLeastMin,
    atIdeal: summary.completed,
    untouched: summary.untouched,
    overallRatio: summary.overallRatio,
    topStreak,
    needsAttention,
  };
}
