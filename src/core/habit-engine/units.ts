/**
 * Habit Engine — Unit catalog.
 *
 * Single source of truth about measurable units: their canonical label, icon,
 * the quick-log increments they suggest, and the words that map to them when
 * parsing free text. Both the parser and the UI build on this — so adding a unit
 * here makes it available everywhere (parsing, the unit picker, quick buttons).
 */

export interface UnitPreset {
  /** Canonical label shown to the user, e.g. 'litros'. */
  unit: string;
  /** MaterialCommunityIcons glyph. */
  icon: string;
  /** Whether fractional values make sense (1.5 litros). */
  decimals: boolean;
  /** All selectable quick-log increments offered in the picker (broad). */
  suggestions: number[];
  /** Default active subset used for new habits and parsing. */
  defaultQuickAdd: number[];
  /** Words that map to this unit when parsing free text (accent-insensitive). */
  synonyms: string[];
}

/** Strip accents + lowercase so matching is forgiving ("página" ~ "pagina"). */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\u0300-\u036f]','g'), '');
}

export const UNIT_CATALOG: UnitPreset[] = [
  {
    unit: 'litros', icon: 'cup-water', decimals: true,
    suggestions: [0.25, 0.5, 1, 2], defaultQuickAdd: [0.25, 0.5, 1],
    synonyms: ['litro', 'litros', 'l'],
  },
  {
    unit: 'mililitros', icon: 'cup-water', decimals: false,
    suggestions: [100, 250, 500], defaultQuickAdd: [250, 500],
    synonyms: ['ml', 'mililitro', 'mililitros'],
  },
  {
    unit: 'vasos', icon: 'cup', decimals: false,
    suggestions: [1, 2, 3], defaultQuickAdd: [1, 2],
    synonyms: ['vaso', 'vasos'],
  },
  {
    unit: 'horas', icon: 'clock-outline', decimals: true,
    suggestions: [0.5, 1, 2], defaultQuickAdd: [0.5, 1],
    synonyms: ['hora', 'horas', 'h'],
  },
  {
    unit: 'minutos', icon: 'timer-sand', decimals: false,
    suggestions: [1, 5, 10, 15, 30, 60], defaultQuickAdd: [5, 10, 15],
    synonyms: ['minuto', 'minutos', 'min'],
  },
  {
    unit: 'páginas', icon: 'book-open-variant', decimals: false,
    suggestions: [1, 5, 10, 20, 50], defaultQuickAdd: [5, 10],
    synonyms: ['pagina', 'paginas', 'pag', 'página', 'páginas'],
  },
  {
    unit: 'km', icon: 'map-marker-distance', decimals: true,
    suggestions: [0.5, 1, 2, 5, 10], defaultQuickAdd: [1, 2, 5],
    synonyms: ['km', 'kilometro', 'kilometros', 'kilómetro', 'kilómetros'],
  },
  {
    unit: 'pasos', icon: 'shoe-print', decimals: false,
    suggestions: [500, 1000, 2000, 5000], defaultQuickAdd: [500, 1000],
    synonyms: ['paso', 'pasos'],
  },
  {
    unit: 'repeticiones', icon: 'repeat', decimals: false,
    suggestions: [1, 5, 10, 20], defaultQuickAdd: [5, 10],
    synonyms: ['repeticion', 'repeticiones', 'reps', 'rep'],
  },
  {
    unit: 'series', icon: 'format-list-numbered', decimals: false,
    suggestions: [1, 2, 3, 4], defaultQuickAdd: [1, 2],
    synonyms: ['serie', 'series'],
  },
  {
    unit: 'gramos', icon: 'weight-gram', decimals: false,
    suggestions: [10, 25, 50, 100], defaultQuickAdd: [25, 50],
    synonyms: ['gramo', 'gramos', 'g', 'gr'],
  },
  {
    unit: 'calorías', icon: 'fire', decimals: false,
    suggestions: [50, 100, 200, 500], defaultQuickAdd: [100, 200],
    synonyms: ['caloria', 'calorias', 'caloría', 'calorías', 'kcal'],
  },
  {
    unit: 'veces', icon: 'check-circle-outline', decimals: false,
    suggestions: [1, 2, 3], defaultQuickAdd: [1],
    synonyms: ['vez', 'veces'],
  },
];

/** Quick-log increments to offer when the unit is custom / unknown. */
export const GENERIC_SUGGESTIONS = [1, 2, 5, 10];

/** Find a preset by canonical label or any synonym (accent-insensitive). */
export function findUnitPreset(unit: string): UnitPreset | undefined {
  const n = normalizeText(unit.trim());
  if (!n) return undefined;
  return UNIT_CATALOG.find(
    (p) => normalizeText(p.unit) === n || p.synonyms.some((s) => normalizeText(s) === n),
  );
}
