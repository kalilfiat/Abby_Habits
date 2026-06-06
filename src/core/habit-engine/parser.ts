/**
 * Habit Engine — Natural-language intent parser.
 *
 * Turns a free-text goal ("tomar 2 litros de agua por día") into an editable
 * DraftHabit. The MVP uses a fast, offline heuristic, but everything is hidden
 * behind the `NaturalLanguageParser` interface so it can be swapped for an
 * LLM-backed parser later without touching the rest of the app.
 */

import { DraftHabit, Frequency } from './types';
import { UNIT_CATALOG, UnitPreset, normalizeText } from './units';

export interface ParseResult {
  draft: DraftHabit;
  /** 0..1 — how sure we are. Low confidence => the mascot should ask to confirm. */
  confidence: number;
  rawText: string;
}

export interface NaturalLanguageParser {
  parse(text: string): ParseResult;
}

/** Synonym -> unit preset lookup, built from the shared unit catalog. */
const UNIT_TABLE: Record<string, UnitPreset> = {};
for (const preset of UNIT_CATALOG) {
  for (const synonym of preset.synonyms) {
    UNIT_TABLE[normalizeText(synonym)] = preset;
  }
}

/** Known activities: keyword -> nice name + icon (used when no unit hints the icon). */
const ACTIVITY_TABLE: { keywords: string[]; name: string; icon: string }[] = [
  { keywords: ['agua', 'hidrat'], name: 'Tomar agua', icon: 'cup-water' },
  { keywords: ['dormir', 'sueño', 'sueno', 'descansar'], name: 'Dormir', icon: 'sleep' },
  { keywords: ['leer', 'lectura', 'libro'], name: 'Leer', icon: 'book-open-variant' },
  { keywords: ['correr', 'running', 'trotar'], name: 'Correr', icon: 'run' },
  { keywords: ['caminar', 'camina', 'pasos'], name: 'Caminar', icon: 'walk' },
  { keywords: ['meditar', 'meditación', 'meditacion', 'mindfulness'], name: 'Meditar', icon: 'meditation' },
  { keywords: ['estudiar', 'estudio'], name: 'Estudiar', icon: 'school' },
  { keywords: ['entrenar', 'ejercicio', 'gym', 'gimnasio', 'pesas'], name: 'Entrenar', icon: 'dumbbell' },
  { keywords: ['escribir', 'journaling', 'diario'], name: 'Escribir', icon: 'fountain-pen-tip' },
  { keywords: ['fruta', 'verdura', 'comer sano', 'saludable'], name: 'Comer saludable', icon: 'food-apple' },
];

const FREQUENCY_HINTS: { pattern: RegExp; frequency: Frequency }[] = [
  { pattern: /\b(mes|mensual|mensuales|por mes|cada mes)\b/i, frequency: 'monthly' },
  { pattern: /\b(semana|semanal|semanales|por semana)\b/i, frequency: 'weekly' },
];

/** Strip accents so matching is forgiving ("página" ~ "pagina"). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\u0300-\u036f]','g'), '');
}

/** First number in the text, supporting "1,5" and "1.5". */
function extractNumber(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function findUnit(normalized: string): UnitPreset | null {
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (UNIT_TABLE[clean]) return UNIT_TABLE[clean];
  }
  return null;
}

function findActivity(normalized: string) {
  for (const activity of ACTIVITY_TABLE) {
    if (activity.keywords.some((k) => normalized.includes(normalize(k)))) {
      return activity;
    }
  }
  return null;
}

function findFrequency(text: string): Frequency {
  for (const hint of FREQUENCY_HINTS) {
    if (hint.pattern.test(text)) return hint.frequency;
  }
  return 'daily';
}

/** Round to a friendly default for the minimum goal. */
function niceMin(ideal: number, decimals: boolean): number {
  const half = ideal * 0.5;
  if (decimals) return Math.max(0.25, Math.round(half * 4) / 4);
  return Math.max(1, Math.round(half));
}

/** Fallback name from free text when no known activity matches. */
function nameFromText(raw: string): string {
  const cleaned = raw
    .replace(/\d+(?:[.,]\d+)?/g, '')
    .replace(/\b(litros?|vasos?|horas?|minutos?|min|paginas?|páginas?|km|pasos?|veces?|vez)\b/gi, '')
    .replace(/\b(por|al|a la|cada)?\s*(dia|día|semana|mes|diario|diarios|semanal|mensual)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const text = cleaned || raw.trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Offline heuristic parser. Good enough to validate the MVP flow, and a clean
 * drop-in target for an LLM parser later (same interface, richer extraction).
 */
export class HeuristicParser implements NaturalLanguageParser {
  parse(text: string): ParseResult {
    const raw = text.trim();
    const normalized = normalize(raw);

    const number = extractNumber(raw);
    const unitDef = findUnit(normalized);
    const activity = findActivity(normalized);
    const frequency = findFrequency(raw);

    // Quantity habit: we found a number (a unit is a strong bonus).
    if (number !== null && number > 0) {
      const unit = unitDef?.unit ?? '';
      const decimals = unitDef?.decimals ?? false;
      const ideal = number;
      const draft: DraftHabit = {
        name: activity?.name ?? nameFromText(raw),
        type: 'quantity',
        unit,
        frequency,
        idealGoal: ideal,
        minGoal: niceMin(ideal, decimals),
        quickAdd: unitDef?.defaultQuickAdd ?? [1],
        icon: activity?.icon ?? unitDef?.icon ?? 'target',
      };
      const confidence = unitDef && activity ? 0.95 : unitDef || activity ? 0.75 : 0.55;
      return { draft, confidence, rawText: raw };
    }

    // Binary habit: no measurable quantity, just "did I do it?".
    const draft: DraftHabit = {
      name: activity?.name ?? nameFromText(raw),
      type: 'binary',
      unit: '',
      frequency,
      idealGoal: 1,
      minGoal: 1,
      quickAdd: [],
      icon: activity?.icon ?? 'check-circle-outline',
    };
    return { draft, confidence: activity ? 0.7 : 0.5, rawText: raw };
  }
}

/** Default parser instance used by the app. Swap here to change strategy. */
export const defaultParser: NaturalLanguageParser = new HeuristicParser();
