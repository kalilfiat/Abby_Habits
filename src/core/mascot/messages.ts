/**
 * Mascot — Contextual messages for the Home ("Hoy") screen.
 *
 * Pure function: given the day's habits + logs, decide what the mascot should
 * say and how it should feel. No randomness on every render — the choice is
 * deterministic given the state, so the mascot doesn't "flicker" between moods.
 *
 * Priority of what to surface:
 *   1. No habits yet            -> invite to create one
 *   2. Everything done          -> celebrate
 *   3. Something almost done     -> cheer ("te falta poco")
 *   4. Nothing logged today     -> remind
 *   5. A habit still untouched  -> suggest a quick action
 *   6. Otherwise                -> happy acknowledgement
 */

import { Habit, HabitLog, progressFor, summarize, periodValueFor } from '../habit-engine';
import { MASCOT } from './personality';
import { MascotMessage } from './types';

/** Format a number without trailing ".0" and with a unit suffix. */
function fmt(value: number, unit: string): string {
  const n = Number.isInteger(value) ? `${value}` : `${Math.round(value * 100) / 100}`;
  return unit ? `${n} ${unit}` : n;
}

export function homeMessage(habits: Habit[], logs: HabitLog[]): MascotMessage {
  const active = habits.filter((h) => !h.archived);

  if (active.length === 0) {
    return {
      mood: 'happy',
      text: `¡Hola! Soy ${MASCOT.name}. Contame qué querés mejorar y armamos tu primer hábito juntas.`,
    };
  }

  const summary = summarize(active, logs);

  // 2. Everything reached its ideal goal.
  if (summary.completed === summary.total) {
    return {
      mood: 'celebrate',
      text: '¡Día redondo! Cumpliste todos tus hábitos. Estoy orgullosa de vos.',
    };
  }

  // Find the habit closest to its ideal goal but not finished — best to cheer on.
  let closest: { habit: Habit; remaining: number; unit: string } | null = null;
  let firstUntouched: Habit | null = null;

  for (const habit of active) {
    const value = periodValueFor(logs, habit);
    const p = progressFor(habit, value);
    if (p.status === 'ideal') continue;

    if (p.status === 'none' && !firstUntouched) {
      firstUntouched = habit;
    }
    if (p.value > 0 && (!closest || p.remainingToIdeal < closest.remaining)) {
      closest = { habit, remaining: p.remainingToIdeal, unit: habit.unit };
    }
  }

  // 3. Something is in progress and close to the ideal.
  if (closest) {
    if (closest.habit.type === 'binary') {
      return {
        mood: 'cheer',
        text: `Ya casi con "${closest.habit.name}". ¡Un último empujón!`,
      };
    }
    return {
      mood: 'cheer',
      text: `Te faltan ${fmt(closest.remaining, closest.unit)} para tu meta de "${closest.habit.name}". ¡Vamos!`,
    };
  }

  // 4. Nothing logged in-period for any habit.
  if (summary.untouched === summary.total) {
    const h = active[0];
    return {
      mood: 'remind',
      text: `Todavía no hay progreso en tus hábitos. ¿Arrancamos con "${h.name}"?`,
    };
  }

  // 5. Some progress made, but a habit is still untouched in its period.
  if (firstUntouched) {
    return {
      mood: 'remind',
      text: `Buen avance. Te quedó pendiente "${firstUntouched.name}", ¿lo sumamos?`,
    };
  }

  // 6. General positive acknowledgement.
  return {
    mood: 'happy',
    text: `Vas bien: ${summary.atLeastMin} de ${summary.total} hábitos ya pasaron su meta mínima en este período.`,
  };
}
