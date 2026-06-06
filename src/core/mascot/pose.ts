/**
 * Mascot — Visual pose from today's progress.
 */

import { Habit, HabitLog, dayKey, summarize } from '../habit-engine';
import { MascotPose } from './types';

const NICE_RATIO = 0.35;
const WORRIED_RATIO = 0.2;

export function homePose(habits: Habit[], logs: HabitLog[], date = dayKey()): MascotPose {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return 'hi';

  const summary = summarize(active, logs, date);

  if (summary.completed === summary.total) return 'happy';
  if (summary.untouched === summary.total) return 'worried';
  if (summary.atLeastMin > 0) return 'nice';
  if (summary.overallRatio >= NICE_RATIO) return 'nice';
  if (summary.overallRatio < WORRIED_RATIO) return 'worried';
  return 'hi';
}
