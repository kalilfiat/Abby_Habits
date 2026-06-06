/**
 * Mascot — Personality definition.
 *
 * Centralizes the mascot's identity: name, avatar and the accent color it shows
 * per mood. This is the seam where an "evolving personality" feature plugs in
 * later (a level/stage could change the name, art, or message style).
 *
 * Abby is a cat. Illustrated poses live in `AbbyAvatar` (assets/abby/).
 * `icon` remains as a fallback glyph where a tiny vector icon is enough.
 */

import { MascotMood } from './types';

export interface MascotPersona {
  name: string;
  /** Placeholder avatar — a MaterialCommunityIcons glyph. Replace with art later. */
  icon: string;
  /** Accent color per mood (used by the speech bubble / glow). */
  colors: Record<MascotMood, string>;
}

export const MASCOT: MascotPersona = {
  name: 'Abby',
  icon: 'cat',
  colors: {
    idle: '#27C4D4',
    happy: '#34C759',
    cheer: '#FF6B35',
    remind: '#E08B2A',
    celebrate: '#E879A6',
  },
};

export function colorFor(mood: MascotMood): string {
  return MASCOT.colors[mood] ?? MASCOT.colors.idle;
}
