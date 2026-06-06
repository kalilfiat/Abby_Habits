/** Reminders — fixed schedule (user preference: no per-habit time picker in v1). */

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export const NOTIFICATION_TIMES = {
  /** Recordatorio global de la mañana. */
  morning: { hour: 9, minute: 0 },
  /** Check-in al mediodía. */
  midday: { hour: 13, minute: 0 },
  /** Alerta de tarde: hábitos diarios y rachas en riesgo. */
  afternoon: { hour: 18, minute: 0 },
  /** Viernes: cierre de hábitos semanales (mínimo). */
  friday: { hour: 17, minute: 0 },
  /** Miércoles y domingo: felicitación si vas bien. */
  celebration: { hour: 19, minute: 30 },
} as const;

/** Expo: 1 = domingo … 7 = sábado. */
export const EXPO_WEEKDAY = {
  sunday: 1,
  wednesday: 4,
  friday: 6,
} as const;

/** Días antes del fin de mes para alertar hábitos mensuales. */
export const MONTH_ALERT_DAYS_BEFORE_END = 7;
