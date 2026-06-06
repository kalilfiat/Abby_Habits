/** UI — Navigation route map shared across screens. */

import { DraftHabit } from '../core/habit-engine';

export type RootStackParamList = {
  Today: undefined;
  Chat: undefined;
  Notifications: undefined;
  /** Edit an existing habit (habitId) or confirm a freshly-parsed draft. */
  HabitEdit: { habitId?: string; draft?: DraftHabit };
};
