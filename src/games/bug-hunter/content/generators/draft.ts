import type { ChallengeIdentity } from '@/domain/challenge';
import type { AttentionChallenge } from '../types';

/** What a Bug Hunter generator produces; identity and timing are stamped by the game definition. */
export type BugHunterDraft = Omit<AttentionChallenge, keyof ChallengeIdentity | 'timing'>;
