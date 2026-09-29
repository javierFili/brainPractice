import type { ChallengeIdentity } from '@/domain/challenge';
import type { LogicChallenge } from '../types';

/** What a Logic generator produces; identity and timing are stamped by the game definition. */
export type LogicDraft = Omit<LogicChallenge, keyof ChallengeIdentity | 'timing'>;
