/**
 * Mascot — Habit-creation conversation.
 *
 * A tiny dialog helper that powers the chat-based onboarding. It owns the words
 * the mascot says; the UI owns the rendering and the message list. Parsing is
 * delegated to the habit engine, keeping conversation and domain concerns apart.
 */

import { DraftHabit, defaultParser, frequencyPeriod } from '../habit-engine';
import { ChatIntent, classifyChatIntent, stableVariantIndex } from './chatIntents';
import { MASCOT } from './personality';

/** Opening lines shown when the creation chat starts. */
export function introLines(userName = ''): string[] {
  const name = userName.trim();
  const hello = name
    ? `¡Hola, ${name}! Soy ${MASCOT.name}, tu compañera de hábitos.`
    : `¡Hola! Soy ${MASCOT.name}, tu compañera de hábitos.`;
  return [
    hello,
    'Contame qué querés mejorar — por ejemplo: "tomar 2 litros de agua por día".',
  ];
}

export interface GoalResponse {
  replies: string[];
  draft: DraftHabit;
  needsConfirmation: boolean;
}

export interface ChatTurnResult {
  intent: ChatIntent;
  replies: string[];
  draft?: DraftHabit;
  needsConfirmation?: boolean;
}

function describeDraft(draft: DraftHabit): string {
  const period = frequencyPeriod(draft.frequency);
  if (draft.type === 'binary') {
    return `"${draft.name}" como un hábito de sí/no, cada ${period}.`;
  }
  const unit = draft.unit ? ` ${draft.unit}` : '';
  return `"${draft.name}" con una meta ideal de ${draft.idealGoal}${unit} por ${period} (mínimo ${draft.minGoal}${unit}).`;
}

function parseGoal(text: string): GoalResponse {
  const { draft, confidence } = defaultParser.parse(text);
  const needsConfirmation = confidence < 0.7;

  const replies = [
    `¡Buenísimo! Entendí esto: ${describeDraft(draft)}`,
    needsConfirmation
      ? 'No estoy 100% segura de los detalles. Revisá la ficha y ajustá lo que haga falta.'
      : 'Revisá la ficha, ajustá lo que quieras y guardalo cuando estés lista.',
  ];

  return { replies, draft, needsConfirmation };
}

function socialReplies(intent: ChatIntent, text: string, userName: string): string[] {
  const name = userName.trim();
  const you = name ? `${name}` : 'vos';
  const vi = stableVariantIndex(text + intent, 3);

  switch (intent) {
    case 'greeting': {
      const variants = [
        name
          ? `¡Hola, ${name}! Qué bueno verte. ¿Qué hábito querés armar hoy?`
          : `¡Hola! Qué bueno verte. ¿Qué hábito querés armar?`,
        `¡Hey! Acá ${MASCOT.name}. Contame en pocas palabras qué querés mejorar.`,
        `¡Buenas! Cuando quieras, escribime el hábito que te gustaría construir.`,
      ];
      return [variants[vi]];
    }
    case 'thanks': {
      const variants = [
        '¡De nada! Cuando quieras seguimos.',
        `¡Un placer, ${you}! Estoy acá si necesitás armar otro hábito.`,
        '¡Genial! Cualquier cosa, escribime de nuevo.',
      ];
      return [variants[vi]];
    }
    case 'help': {
      const variants = [
        [
          'Es fácil: escribí el hábito como lo dirías en voz alta.',
          'Yo te propongo una ficha; vos la revisás, ajustás metas y guardás.',
        ],
        [
          'Podés decirme cosas como "leer 10 páginas por día" o "meditar".',
          'Después tocá la tarjeta del hábito para ver la ficha antes de guardar.',
        ],
      ];
      return variants[vi];
    }
    case 'too_vague': {
      const variants = [
        'Contame un poco más: ¿qué querés hacer y cada cuánto?',
        'No llegué a entender el hábito. ¿Me lo explicás con un ejemplo?',
        'Probá algo como "caminar 30 minutos por día" o "tomar agua".',
      ];
      return [variants[vi]];
    }
    default:
      return [];
  }
}

/** Process any user message: social intents or habit goal parsing. */
export function respondToMessage(text: string, userName = ''): ChatTurnResult {
  const { intent, goalText } = classifyChatIntent(text);

  if (intent === 'goal') {
    const goal = parseGoal(goalText || text);
    return {
      intent: 'goal',
      replies: goal.replies,
      draft: goal.draft,
      needsConfirmation: goal.needsConfirmation,
    };
  }

  return {
    intent,
    replies: socialReplies(intent, text, userName),
  };
}

/** @deprecated Use respondToMessage — kept for tests or direct goal-only calls. */
export function respondToGoal(text: string): GoalResponse {
  const { intent, goalText } = classifyChatIntent(text);
  const toParse = intent === 'goal' ? goalText || text : text;
  return parseGoal(toParse);
}
