import type { Challenge, ChallengeIdentity } from '@/domain/challenge';

/** What a generator produces; identity and timing are stamped by the game definition. */
export type DraftOf<C extends Challenge> = Omit<C, keyof ChallengeIdentity | 'timing'>;
