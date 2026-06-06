/** UI — Design tokens. Cyan/teal palette matching the Abby reference design. */

export const colors = {
  // Primary: cyan-teal (from the reference — the dominant blue-green tone)
  primary: '#27C4D4',
  primaryDark: '#18A8B8',
  primaryLight: '#E0F7FA',

  // Success: same fresh green
  success: '#34C759',
  successDark: '#28A048',
  successLight: '#E6F9EE',

  // Text
  text: '#0D1F2D',
  /** Fredoka titles — deep navy-teal (reference greeting). */
  heading: '#142839',
  textMuted: '#5C6B7A',
  textLight: '#8A97A8',

  // Backgrounds — very pale sky-blue, not lavender
  bg: '#EAF6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F2FAFB',

  // Borders
  border: '#D4EEF4',
  borderLight: '#E4F4F8',

  // Streak / fire orange (same; stands out against the cyan palette)
  streak: '#FF6B35',
  streakLight: '#FFF0EB',

  // Warning / accent warm
  warning: '#E08B2A',
  warningLight: '#FFF4E0',
  danger: '#D94F4F',
  dangerLight: '#FDEAEA',

  // CTA gradient: teal → cyan (left to right, as in the reference FAB)
  gradient: ['#18B8C4', '#2BDABE'] as const,

  // Soft blob behind the mascot in the header
  blob: '#C8EFF5',

  // Habit icon circle palette — shifted to match the cyan world
  circles: [
    { bg: '#D6F0F6', tint: '#27C4D4' }, // cyan  (default)
    { bg: '#E6F9EE', tint: '#34C759' }, // green
    { bg: '#FFF1E3', tint: '#E08B2A' }, // orange
    { bg: '#EDE8FF', tint: '#7C5CE4' }, // purple
    { bg: '#FFE6F2', tint: '#E91E7A' }, // pink
    { bg: '#FFF8DB', tint: '#C9A000' }, // gold
  ],
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

/** Loaded via `useAppFonts` in App.tsx. */
export const fontFamily = {
  display: 'Fredoka_700Bold',
  displayRegular: 'Fredoka_400Regular',
  displaySemi: 'Fredoka_600SemiBold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemiBold: 'Nunito_600SemiBold',
} as const;

/** Typography scale. */
export const font = {
  h1: 32,
  h2: 24,
  h3: 18,
  body: 16,
  body2: 14,
  caption: 12,
};

export const line = {
  h1: 40,
  h2: 32,
  body: 24,
  body2: 20,
  caption: 16,
};

export const shadow = {
  shadowColor: '#0A3040',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export const shadowStrong = {
  shadowColor: '#18A8B8',
  shadowOpacity: 0.32,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

/** Pick a squircle color for a habit icon deterministically from its id. */
export function habitCircleColor(id: string): { bg: string; tint: string } {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors.circles[sum % colors.circles.length];
}
