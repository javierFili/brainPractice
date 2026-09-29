import type { ChallengeIdentity } from '@/domain/challenge';
import type { MemoryChallenge } from '../types';

/** What a Code Memory generator produces; identity and timing are stamped by the game definition. */
export type MemoryDraft = Omit<MemoryChallenge, keyof ChallengeIdentity | 'timing'>;
