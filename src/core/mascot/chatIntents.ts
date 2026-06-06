/**
 * Mascot — Chat intent classification (social vs habit goal).
 * Pure; no parser imports except for goal path in conversation.ts.
 */

export type ChatIntent = 'greeting' | 'thanks' | 'help' | 'goal' | 'too_vague';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable 0..n-1 from text (no Math.random). */
export function stableVariantIndex(text: string, modulo: number): number {
  if (modulo <= 1) return 0;
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

const GREETING_ONLY =
  /^(hola|holaa|hey|hi|hello|buenas|buen dia|buenos dias|buenas tardes|buenas noches|que tal|como estas|como va|como andas|como te va)(\s|$)/;

const GREETING_PREFIX =
  /^(hola|holaa|hey|hi|hello|buenas|buen dia|buenos dias|buenas tardes|buenas noches|que tal|como estas|como va|como andas|como te va)[,!.\s]+/i;

const THANKS_ONLY =
  /^(gracias|muchas gracias|genial|barbaro|dale|listo|perfecto|ok gracias|thank you|thanks)(\s|$)/;

const HELP_ONLY =
  /^(ayuda|help|como funciona|que puedo hacer|que hago|no entiendo)(\s|\?|$)/;

const TOO_VAGUE = /^(ok|si|no|ya|eh|mmm|\?)$/;

/** Strip leading greeting so "hola, leer 10 paginas" becomes a goal. */
export function stripSocialPrefix(raw: string): string {
  const trimmed = raw.trim();
  const normalized = normalize(trimmed);
  if (!GREETING_PREFIX.test(normalized)) return trimmed;
  const stripped = normalized.replace(GREETING_PREFIX, '').trim();
  if (!stripped) return '';
  return stripped;
}

function looksLikeGoalContent(normalized: string): boolean {
  if (normalized.length < 4) return false;
  if (/\d/.test(normalized)) return true;
  const goalHints =
    /\b(leer|agua|correr|caminar|meditar|estudiar|entrenar|dormir|litro|litros|pagina|paginas|hora|horas|minuto|minutos|por dia|por semana|por mes|diario|semanal|mensual)\b/;
  return goalHints.test(normalized);
}

export function classifyChatIntent(text: string): { intent: ChatIntent; goalText: string } {
  const raw = text.trim();
  const normalized = normalize(raw);

  if (!normalized) {
    return { intent: 'too_vague', goalText: '' };
  }

  const afterStrip = stripSocialPrefix(raw);
  const afterNorm = normalize(afterStrip);

  if (afterNorm && looksLikeGoalContent(afterNorm)) {
    return { intent: 'goal', goalText: afterStrip };
  }

  if (HELP_ONLY.test(normalized) && !looksLikeGoalContent(normalized)) {
    return { intent: 'help', goalText: '' };
  }

  if (THANKS_ONLY.test(normalized) && !looksLikeGoalContent(normalized)) {
    return { intent: 'thanks', goalText: '' };
  }

  if (GREETING_ONLY.test(normalized) || (afterNorm === '' && GREETING_PREFIX.test(normalize(raw)))) {
    return { intent: 'greeting', goalText: '' };
  }

  if (TOO_VAGUE.test(normalized)) {
    return { intent: 'too_vague', goalText: '' };
  }

  if (afterNorm && afterNorm.length >= 4) {
    return { intent: 'goal', goalText: afterStrip };
  }

  if (normalized.length < 4 && !looksLikeGoalContent(normalized)) {
    return { intent: 'too_vague', goalText: '' };
  }

  return { intent: 'goal', goalText: raw };
}
