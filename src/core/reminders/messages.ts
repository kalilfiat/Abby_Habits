/**
 * Reminders — Notification copy (Abby voice, rioplatense).
 */

import { Habit } from '../habit-engine';
import { MASCOT } from '../mascot';

function greet(name: string): string {
  return name ? `${name}, ` : '';
}

export function globalMorningBody(userName: string): string {
  return `${greet(userName)}¿cómo arrancamos hoy con tus hábitos? ${MASCOT.name} te espera en la app.`;
}

export function globalMiddayBody(userName: string): string {
  return `${greet(userName)}pasó el mediodía — ¿querés registrar un hábito antes de que se achique el día?`;
}

export function dailyAfternoonBody(userName: string, habits: Habit[]): string {
  if (habits.length === 1) {
    return `${greet(userName)}todavía no llegaste al mínimo de "${habits[0].name}" hoy. ¿Lo sumamos?`;
  }
  const names = habits.slice(0, 2).map((h) => h.name).join(' y ');
  const extra = habits.length > 2 ? ` (+${habits.length - 2})` : '';
  return `${greet(userName)}te falta cerrar el mínimo de ${names}${extra} hoy.`;
}

export function weeklyFridayBody(userName: string, habits: Habit[]): string {
  if (habits.length === 1) {
    return `${greet(userName)}es viernes: esta semana aún no llegaste al mínimo de "${habits[0].name}". ¡Todavía hay tiempo!`;
  }
  return `${greet(userName)}viernes de cierre — revisá tus hábitos semanales antes de que termine la semana.`;
}

export function monthlyAlertBody(userName: string, habits: Habit[]): string {
  if (habits.length === 1) {
    return `${greet(userName)}queda una semana de mes: "${habits[0].name}" todavía no llegó al mínimo.`;
  }
  return `${greet(userName)}se acerca el fin de mes — tenés hábitos mensuales que aún no pasaron el mínimo.`;
}

export function streakRiskBody(userName: string, habit: Habit, remaining: number, unit: string): string {
  const isBinary = habit.type === 'binary';
  if (isBinary) {
    return `${greet(userName)}tu racha de "${habit.name}" sigue viva. Hacelo hoy para mantenerla.`;
  }
  return `${greet(userName)}tu racha de "${habit.name}" sigue viva. Te faltan ${remaining} ${unit} hoy para el mínimo.`;
}

export function celebrationBody(userName: string): string {
  return `${greet(userName)}vas muy bien con tus hábitos. ${MASCOT.name} está contenta — ¡seguí así!`;
}
