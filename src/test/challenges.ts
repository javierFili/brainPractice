import type { Challenge } from '@/domain/challenge';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import type { DifficultyLevel } from '@/domain/shared';
import { logicGame } from '@/games/algorithmic-logic/content/definition';

/** The challenge a session with `sessionSeed` shows at `index`. */
export const sessionChallenge = (
  level: DifficultyLevel,
  sessionSeed: number,
  index = 0,
): Challenge =>
  generateChallenge(logicGame, { level, seed: deriveSeed(toSeed(sessionSeed), index) });

export function choiceLabels(challenge: Challenge): { correct: string; wrong: string } {
  const { response } = challenge;
  if (response.format !== 'single-choice')
    throw new Error(`Expected single-choice, got ${response.format}`);
  const { options } = response.question;
  const correct = options.find((o) => o.id === response.solution.optionId);
  const wrong = options.find((o) => o.id !== response.solution.optionId);
  if (!correct || !wrong) throw new Error('Malformed options');
  return { correct: correct.label, wrong: wrong.label };
}

/** First session seed whose first challenge uses the given response format. */
export function seedWhereFirst(
  level: DifficultyLevel,
  format: Challenge['response']['format'],
): number {
  for (let seed = 1; seed < 500; seed++)
    if (sessionChallenge(level, seed).response.format === format) return seed;
  throw new Error(`No seed found for ${format}`);
}
