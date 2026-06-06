/** UI motion — shared timings and spring presets. */

export const motion = {
  fast: 180,
  normal: 320,
  slow: 480,
  stagger: 55,
} as const;

export const spring = {
  snappy: { speed: 22, bounciness: 6 },
  soft: { speed: 14, bounciness: 8 },
  press: { speed: 50, bounciness: 4 },
} as const;
