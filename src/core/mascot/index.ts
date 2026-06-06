/** Mascot — public surface. The conversational/personality layer. */
export * from './types';
export * from './personality';
export * from './pose';
export * from './messages';
export * from './progressMessages';
export * from './chatIntents';
export {
  introLines,
  respondToGoal,
  respondToMessage,
  type ChatTurnResult,
  type GoalResponse,
} from './conversation';
