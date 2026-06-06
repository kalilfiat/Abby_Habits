/**
 * Mascot — Conversational layer types.
 *
 * The mascot is the personality that sits between the user and the habit engine.
 * For the MVP it does two jobs:
 *   1. Guides habit creation as a chat ("¿qué querés mejorar?").
 *   2. Reacts to the day's progress on the Home screen.
 *
 * Keeping its types separate from the engine lets the personality grow
 * (evolving moods, memory, smart reminders) without leaking into domain logic.
 */

/** Illustrated pose — which Abby artwork to show. */
export type MascotPose = 'hi' | 'worried' | 'nice' | 'happy';

/** Emotional tone — drives the bubble accent color (speech can differ from pose). */
export type MascotMood =
  | 'idle'
  | 'happy'
  | 'cheer' // encouraging, "you're close"
  | 'remind' // gentle nudge
  | 'celebrate'; // goal reached

export interface MascotMessage {
  text: string;
  mood: MascotMood;
}

/** Who is speaking in the creation chat. */
export type ChatRole = 'mascot' | 'user';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Abby pose when role is mascot (optional on user messages). */
  pose?: MascotPose;
}
