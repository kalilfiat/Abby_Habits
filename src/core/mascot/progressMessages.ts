/**
 * Mascot — Contextual copy for the Progreso tab (deterministic).
 */

import {
  Habit,
  HabitLog,
  periodValueFor,
  progressFor,
  progressOverview,
} from '../habit-engine';
import { MASCOT } from './personality';
import { MascotMessage, MascotPose } from './types';

function greet(name: string): string {
  return name ? `${name}, ` : '';
}

export function progressMessage(
  habits: Habit[],
  logs: HabitLog[],
  userName = '',
): MascotMessage {
  const g = greet(userName);
  const o = progressOverview(habits, logs);

  if (o.total === 0) {
    return {
      mood: 'happy',
      text: `${g}cuando tengas hábitos, acá vas a ver cómo venís en el tiempo.`,
    };
  }

  if (o.atIdeal === o.total) {
    return {
      mood: 'celebrate',
      text: `${g}¡todos tus hábitos están en la meta ideal este período! ${MASCOT.name} está feliz.`,
    };
  }

  if (o.atLeastMin === o.total) {
    return {
      mood: 'celebrate',
      text: `${g}cerraste el mínimo en los ${o.total} hábitos. Si querés, apuntá al ideal.`,
    };
  }

  if (o.topStreak && o.topStreak.days >= 7) {
    const { habit, days } = o.topStreak;
    return {
      mood: 'cheer',
      text: `${g}tu racha de "${habit.name}" lleva ${days} días. ¡Eso es constancia de verdad!`,
    };
  }

  if (o.atLeastMin >= Math.ceil(o.total / 2)) {
    return {
      mood: 'happy',
      text: `${g}vas bien: ${o.atLeastMin} de ${o.total} hábitos ya pasaron el mínimo en este período.`,
    };
  }

  if (o.topStreak && o.topStreak.days >= 3) {
    return {
      mood: 'cheer',
      text: `${g}"${o.topStreak.habit.name}" suma ${o.topStreak.days} días de racha. Seguí así.`,
    };
  }

  if (o.needsAttention.length > 0) {
    const habit = pickEncouragementHabit(o.needsAttention, logs);
    const value = periodValueFor(logs, habit);
    const p = progressFor(habit, value);

    if (p.status === 'none') {
      return {
        mood: 'remind',
        text: `${g}todavía no hay registro de "${habit.name}" en este período. Un paso chico alcanza.`,
      };
    }

    if (habit.type === 'binary') {
      return {
        mood: 'cheer',
        text: `${g}"${habit.name}" está en marcha. Marcá el mínimo cuando puedas.`,
      };
    }

    return {
      mood: 'cheer',
      text: `${g}te faltan ${formatRemaining(p.remainingToMin, habit.unit)} en "${habit.name}" para el mínimo. Vos podés.`,
    };
  }

  return {
    mood: 'happy',
    text: `${g}cada día cuenta. Mirá el detalle de cada hábito y elegí por dónde seguir.`,
  };
}

/** Habit closest to minimum among those still below it. */
function pickEncouragementHabit(habits: Habit[], logs: HabitLog[]): Habit {
  let best: { habit: Habit; remaining: number } | null = null;
  for (const habit of habits) {
    const p = progressFor(habit, periodValueFor(logs, habit));
    if (p.status === 'min' || p.status === 'ideal') continue;
    const remaining = p.status === 'none' ? habit.minGoal : p.remainingToMin;
    if (!best || remaining < best.remaining) {
      best = { habit, remaining };
    }
  }
  return best?.habit ?? habits[0];
}

function formatRemaining(n: number, unit: string): string {
  const v = Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
  return unit ? `${v} ${unit}` : v;
}

const MOOD_POSE: Record<MascotMessage['mood'], MascotPose> = {
  celebrate: 'happy',
  cheer: 'nice',
  remind: 'worried',
  happy: 'nice',
  idle: 'hi',
};

export function progressPose(habits: Habit[], logs: HabitLog[], userName = ''): MascotPose {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return 'hi';
  return MOOD_POSE[progressMessage(habits, logs, userName).mood];
}
