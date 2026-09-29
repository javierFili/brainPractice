import type { ChallengeTiming } from '../challenge/challenge';
import { validateTiming } from '../challenge/validateChallenge';
import {
  DIFFICULTY_LEVELS,
  tierOf,
  type DifficultyLevel,
  type DifficultyTier,
} from '../shared/difficultyLevel';

/**
 * Common part of every level design. Games extend it with their own typed parameters, using the
 * shared vocabulary where it applies: complexity, memoryLoad, sequenceLength, distractors,
 * elementCount, abstractionLevel, visualNoise, decisionCount, dependencyCount.
 * The extended profile is the single source of truth consumed by the game's generator.
 */
export interface DifficultyProfile {
  readonly level: DifficultyLevel;
  readonly tier: DifficultyTier;
  /** Cognitive purpose of the level, shown to the player. */
  readonly objective: string;
  readonly challengeCount: number;
  readonly timing: ChallengeTiming;
}

/** Exactly one profile per level 1–10, enforced by the type. */
export type LevelTable<P extends DifficultyProfile = DifficultyProfile> = Readonly<
  Record<DifficultyLevel, P>
>;

export function validateLevelTable(table: LevelTable): string[] {
  return DIFFICULTY_LEVELS.flatMap((level) => {
    const profile = table[level];
    const at = (issue: string) => `level ${level}: ${issue}`;
    const issues: string[] = [];
    if (profile.level !== level) issues.push(at(`profile declares level ${profile.level}`));
    if (profile.tier !== tierOf(level)) issues.push(at(`tier must be "${tierOf(level)}"`));
    if (profile.objective.trim() === '') issues.push(at('objective is empty'));
    if (!Number.isInteger(profile.challengeCount) || profile.challengeCount < 1) {
      issues.push(at('challengeCount must be a positive integer'));
    }
    return [...issues, ...validateTiming(profile.timing).map(at)];
  });
}
