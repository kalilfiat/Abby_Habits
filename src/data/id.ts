/**
 * Data layer — ID generation.
 *
 * Small, dependency-free unique IDs for locally-created records. Good enough for
 * a single-device MVP; replace with UUIDs when sync/multi-device lands.
 */
export function createId(prefix = ''): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${time}${rand}`;
}
