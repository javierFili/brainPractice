import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile, LevelTable } from '@/domain/difficulty';
import type { GameDefinition } from '@/domain/game';
import { shuffle } from '@/domain/random';
import { DIFFICULTY_LEVELS, gameIdOf, tierOf, type DifficultyLevel } from '@/domain/shared';

/** Minimal game used to exercise the domain pipeline; not player content. */
export type FixtureChallenge = Challenge<'logic', { kind: 'max-of'; values: readonly number[] }>;

export interface FixtureProfile extends DifficultyProfile {
  readonly valueCount: number;
}

export function buildLevelTable<P extends DifficultyProfile>(
  extra: (level: DifficultyLevel) => Omit<P, keyof DifficultyProfile>,
): LevelTable<P> {
  const entries = DIFFICULTY_LEVELS.map((level) => [
    level,
    {
      level,
      tier: tierOf(level),
      objective: `Objective ${level}`,
      challengeCount: 5,
      timing: { studyMs: null, limitMs: 10_000, targetMs: 5_000 },
      ...extra(level),
    },
  ]);
  return Object.fromEntries(entries) as LevelTable<P>;
}

export const fixtureGame: GameDefinition<FixtureChallenge, FixtureProfile> = {
  id: gameIdOf('fixture-max'),
  name: 'Fixture Max',
  tagline: 'Pick the largest value',
  description: 'Test fixture.',
  area: 'logic',
  skills: ['logical-reasoning'],
  meta: {
    category: 'logic',
    audiences: ['adults'],
    interaction: 'choice',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: 'Accuracy.',
    feedback: 'explain',
  },
  instructions: ['Pick the largest value.'],
  levels: buildLevelTable<FixtureProfile>((level) => ({ valueCount: level + 1 })),
  generate({ identity, profile, random }) {
    const pool = Array.from({ length: 50 }, (_, i) => i + 1);
    const values = shuffle(random, pool).slice(0, profile.valueCount);
    const max = Math.max(...values);
    const order = shuffle(random, values);
    return {
      ...identity,
      prompt: 'Which value is the largest?',
      content: { kind: 'max-of', values: order },
      response: {
        format: 'single-choice',
        question: { options: order.map((v) => ({ id: `v${v}`, label: String(v) })) },
        solution: { optionId: `v${max}` },
      },
      explanation: `${max} is greater than every other value.`,
      skills: ['logical-reasoning'],
      timing: profile.timing,
    };
  },
};
