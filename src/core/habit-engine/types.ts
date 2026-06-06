/**
 * Habit Engine — Domain types.
 *
 * This layer is pure: no UI, no storage, no React. It models *what a habit is*
 * and *how progress is measured*. Everything else (mascot, data, UI) depends on
 * these types, never the other way around.
 */

export type HabitType = 'quantity' | 'binary';

export type Frequency = 'daily' | 'weekly' | 'monthly';

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

/** Badge on cards at ideal when their frequency tier is celebrating. */
export const CELEBRATION_TIER_LABEL: Record<Frequency, string> = {
  daily: '¡Meta ideal!',
  weekly: 'Semana ideal',
  monthly: 'Mes ideal',
};

/** Period noun for copy: "por día", "por semana", "por mes". */
export function frequencyPeriod(freq: Frequency): 'día' | 'semana' | 'mes' {
  if (freq === 'weekly') return 'semana';
  if (freq === 'monthly') return 'mes';
  return 'día';
}

/** Scope label for progress display on cards (resets each period). */
export const PERIOD_SCOPE_LABEL: Record<Frequency, string> = {
  daily: 'hoy',
  weekly: 'esta semana',
  monthly: 'este mes',
};

/** A habit the user is trying to build. */
export interface Habit {
  id: string;
  name: string;
  /** 'quantity' = measurable (litros, páginas...). 'binary' = done / not done. */
  type: HabitType;
  /** Unit label for quantity habits ('litros', 'horas', ...). Empty for binary. */
  unit: string;
  frequency: Frequency;
  /** Meta mínima — the floor that still counts as "a good day". */
  minGoal: number;
  /** Meta ideal — the target the user really wants to hit. */
  idealGoal: number;
  /** Increments offered as quick-log buttons, e.g. [0.25, 0.5, 1]. */
  quickAdd: number[];
  /** Icon glyph name from the MaterialCommunityIcons set (e.g. 'run', 'cup-water'). */
  icon: string;
  /** ISO timestamp. */
  createdAt: string;
  archived?: boolean;
}

/** A single day's accumulated progress for one habit. */
export interface HabitLog {
  id: string;
  habitId: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  value: number;
  updatedAt: string;
}

/** A habit before it is persisted (no id / createdAt yet). */
export type DraftHabit = Omit<Habit, 'id' | 'createdAt'>;

/** Where the user's progress stands against their goals for a given day. */
export type ProgressStatus = 'none' | 'started' | 'min' | 'ideal';

export interface Progress {
  value: number;
  minGoal: number;
  idealGoal: number;
  /** value / idealGoal, clamped to [0, 1]. */
  ratio: number;
  status: ProgressStatus;
  /** How much is left to reach the ideal goal (never negative). */
  remainingToIdeal: number;
  /** How much is left to reach the minimum goal (never negative). */
  remainingToMin: number;
}
