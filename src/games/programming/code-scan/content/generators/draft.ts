import type { ChallengeIdentity } from '@/domain/challenge';
import type { SpeedChallenge } from '../types';

/** What a Code Scan generator produces; identity and timing are stamped by the game definition. */
export type CodeScanDraft = Omit<SpeedChallenge, keyof ChallengeIdentity | 'timing'>;
