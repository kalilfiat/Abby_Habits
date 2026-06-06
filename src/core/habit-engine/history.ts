/**
 * Habit Engine — Compact period history for progress view.
 */

import {
  dateFromKey,
  dayKey,
  dayKeysInRange,
  monthRange,
  progressFor,
  valueBetween,
  valueFor,
  weekRange,
} from './engine';
import { Habit, HabitLog, ProgressStatus } from './types';

export interface HistoryCell {
  key: string;
  label: string;
  status: ProgressStatus;
  value: number;
}

const WEEKDAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dailyHistory(habit: Habit, logs: HabitLog[], ref: Date): HistoryCell[] {
  const cells: HistoryCell[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = addDays(ref, -offset);
    const key = dayKey(d);
    const value = valueFor(logs, habit.id, key);
    const { status } = progressFor(habit, value);
    cells.push({
      key,
      label: WEEKDAY_SHORT[d.getDay()],
      status,
      value,
    });
  }
  return cells;
}

function weeklyHistory(habit: Habit, logs: HabitLog[], ref: Date): HistoryCell[] {
  const { from: currentMondayKey } = weekRange(ref);
  const currentMonday = dateFromKey(currentMondayKey);
  const cells: HistoryCell[] = [];

  for (let weeksAgo = 3; weeksAgo >= 0; weeksAgo -= 1) {
    const weekStart = addDays(currentMonday, -7 * weeksAgo);
    const { from, to } = weekRange(weekStart);
    const value = valueBetween(logs, habit.id, from, to);
    const { status } = progressFor(habit, value);
    cells.push({
      key: `${from}_${to}`,
      label: `S${4 - weeksAgo}`,
      status,
      value,
    });
  }
  return cells;
}

function monthlyHistory(habit: Habit, logs: HabitLog[], ref: Date): HistoryCell[] {
  const { from } = monthRange(ref);
  const todayKey = dayKey(ref);
  const cells: HistoryCell[] = [];

  for (const key of dayKeysInRange(from, todayKey)) {
    const value = valueBetween(logs, habit.id, from, key);
    const { status } = progressFor(habit, value);
    cells.push({
      key,
      label: `${dateFromKey(key).getDate()}`,
      status,
      value,
    });
  }
  return cells;
}

/** Compact history cells for the progress tab (7 days / 4 weeks / month-to-date). */
export function historyForHabit(
  habit: Habit,
  logs: HabitLog[],
  refDate: Date = new Date(),
): HistoryCell[] {
  switch (habit.frequency) {
    case 'weekly':
      return weeklyHistory(habit, logs, refDate);
    case 'monthly':
      return monthlyHistory(habit, logs, refDate);
    default:
      return dailyHistory(habit, logs, refDate);
  }
}
