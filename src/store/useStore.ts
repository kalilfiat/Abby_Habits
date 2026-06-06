/**
 * Store — Application state.
 *
 * Zustand + persist over AsyncStorage. The single point where domain + data meet.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DraftHabit,
  Habit,
  HabitLog,
  dateFromKey,
  dayKey,
  dayKeysInRange,
  periodRangeFor,
} from '../core/habit-engine';
import { createId, STORAGE_PREFIX, storage, syncLocalNotifications } from '../data';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  hydrated: boolean;
  /** Display name used in the greeting. */
  userName: string;
  notificationsEnabled: boolean;

  setUserName: (name: string) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;

  addHabit: (draft: DraftHabit) => string;
  updateHabit: (id: string, patch: Partial<DraftHabit>) => void;
  archiveHabit: (id: string) => void;

  addProgress: (habitId: string, delta: number, date?: string) => void;
  setProgress: (habitId: string, value: number, date?: string) => void;
  /** Zeros progress for the habit's current period (day / week / month). */
  resetPeriod: (habitId: string, date?: Date) => void;
  resetToday: (habitId: string, date?: string) => void;
}

export const useStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      hydrated: false,
      userName: '',
      notificationsEnabled: true,

      setUserName: (name) => set({ userName: name }),

      setNotificationsEnabled: async (enabled) => {
        set({ notificationsEnabled: enabled });
        const { habits, logs, userName } = get();
        await syncLocalNotifications(habits, logs, userName, enabled);
      },

      addHabit: (draft) => {
        const habit: Habit = {
          ...draft,
          id: createId('h_'),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, habit] }));
        return habit.id;
      },

      updateHabit: (id, patch) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      archiveHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
        })),

      addProgress: (habitId, delta, date = dayKey()) => {
        const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
        const nextValue = Math.max((existing?.value ?? 0) + delta, 0);
        get().setProgress(habitId, nextValue, date);
      },

      setProgress: (habitId, value, date = dayKey()) =>
        set((state) => {
          const now = new Date().toISOString();
          const idx = state.logs.findIndex((l) => l.habitId === habitId && l.date === date);
          if (idx === -1) {
            const log: HabitLog = {
              id: createId('l_'),
              habitId,
              date,
              value: Math.max(value, 0),
              updatedAt: now,
            };
            return { logs: [...state.logs, log] };
          }
          const logs = state.logs.slice();
          logs[idx] = { ...logs[idx], value: Math.max(value, 0), updatedAt: now };
          return { logs };
        }),

      resetPeriod: (habitId, date = new Date()) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return;
        const { from, to } = periodRangeFor(habit, date);
        for (const key of dayKeysInRange(from, to)) {
          get().setProgress(habitId, 0, key);
        }
      },

      resetToday: (habitId, date = dayKey()) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return;
        get().resetPeriod(habitId, dateFromKey(date));
      },
    }),
    {
      name: `${STORAGE_PREFIX}store`,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        userName: state.userName,
        notificationsEnabled: state.notificationsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        useStore.setState({ hydrated: true });
        return state;
      },
    },
  ),
);
