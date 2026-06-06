/**
 * Data — Local notifications adapter (expo-notifications).
 *
 * Re-schedules on each sync so bodies reflect current habit state.
 * Mobile only; web shows settings but does not schedule.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit, HabitLog } from '../core/habit-engine';
import {
  EXPO_WEEKDAY,
  NOTIFICATION_TIMES,
  buildNotificationPayloads,
  isDoingWell,
  monthAlertDate,
  NotificationPayload,
} from '../core/reminders';
import { TimeOfDay } from '../core/reminders/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function requestPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

/** Ask once if the user hasn't chosen yet (e.g. default-on at first launch). */
export async function ensureNotificationPermission(): Promise<PermissionStatus> {
  const current = await getPermissionStatus();
  if (current !== 'undetermined') return current;
  return requestPermission();
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('habits', {
    name: 'Abby Habits',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function dailyTrigger(time: TimeOfDay) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: time.hour,
    minute: time.minute,
  } as Notifications.DailyTriggerInput;
}

function weeklyTrigger(weekday: number, time: TimeOfDay) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: time.hour,
    minute: time.minute,
  } as Notifications.WeeklyTriggerInput;
}

function dateTrigger(when: Date) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: when,
  } as Notifications.DateTriggerInput;
}

function atTimeOnDay(time: TimeOfDay, day: Date): Date {
  const d = new Date(day);
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

async function schedule(
  payload: NotificationPayload,
  trigger: Notifications.NotificationTriggerInput,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: payload.id,
    content: {
      title: payload.title,
      body: payload.body,
      sound: true,
      data: { id: payload.id },
    },
    trigger,
  });
}

function afternoonPayload(
  payloads: ReturnType<typeof buildNotificationPayloads>,
): NotificationPayload | null {
  if (payloads.afternoon) return payloads.afternoon;
  if (payloads.streak) return payloads.streak;
  return null;
}

async function scheduleAfternoonForDay(
  habits: Habit[],
  logs: HabitLog[],
  userName: string,
  day: Date,
  idSuffix: string,
): Promise<void> {
  const payloads = buildNotificationPayloads(habits, logs, userName, day);
  const alert = afternoonPayload(payloads);
  if (!alert) return;

  const when = atTimeOnDay(NOTIFICATION_TIMES.afternoon, day);
  if (when <= new Date()) return;

  await schedule({ ...alert, id: `afternoon-${idSuffix}` }, dateTrigger(when));
}

/** Cancel and re-register all local notifications from current state. */
export async function syncLocalNotifications(
  habits: Habit[],
  logs: HabitLog[],
  userName: string,
  enabled: boolean,
): Promise<void> {
  if (Platform.OS === 'web' || !enabled) {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    return;
  }

  const permission = await getPermissionStatus();
  if (permission !== 'granted') return;

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const payloads = buildNotificationPayloads(habits, logs, userName, now);

  await schedule(payloads.morning, dailyTrigger(NOTIFICATION_TIMES.morning));
  await schedule(payloads.midday, dailyTrigger(NOTIFICATION_TIMES.midday));

  if (payloads.friday) {
    await schedule(payloads.friday, weeklyTrigger(EXPO_WEEKDAY.friday, NOTIFICATION_TIMES.friday));
  }

  if (payloads.celebration && isDoingWell(habits, logs, now)) {
    await schedule(
      { ...payloads.celebration, id: 'celebration-wed' },
      weeklyTrigger(EXPO_WEEKDAY.wednesday, NOTIFICATION_TIMES.celebration),
    );
    await schedule(
      { ...payloads.celebration, id: 'celebration-sun' },
      weeklyTrigger(EXPO_WEEKDAY.sunday, NOTIFICATION_TIMES.celebration),
    );
  }

  await scheduleAfternoonForDay(habits, logs, userName, now, 'today');

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  await scheduleAfternoonForDay(habits, logs, userName, tomorrow, 'tomorrow');

  if (payloads.monthly) {
    const alert = monthAlertDate(now);
    alert.setHours(NOTIFICATION_TIMES.midday.hour, NOTIFICATION_TIMES.midday.minute, 0, 0);
    if (alert > now) {
      await schedule(payloads.monthly, dateTrigger(alert));
    }
  }
}
