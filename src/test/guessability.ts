import type { Challenge } from '@/domain/challenge';
import { en } from './i18n';

/**
 * Measurement invariants for multiple-choice content: a player who never reads the material must
 * not beat chance by exploiting how distractors were built. Each heuristic returns its expected hit
 * rate (ties are split evenly), to compare with chance = mean(1 / optionCount).
 */
export interface ChoiceItem {
  readonly options: readonly string[];
  readonly answer: string;
}

export function choiceItems(challenges: readonly Challenge[]): ChoiceItem[] {
  return challenges.flatMap(({ response }) => {
    if (response.format !== 'single-choice') return [];
    const answer = response.question.options.find((o) => o.id === response.solution.optionId);
    if (!answer) throw new Error('Solution is not among the options');
    return [
      { options: response.question.options.map((o) => en(o.label)), answer: en(answer.label) },
    ];
  });
}

export const chanceRate = (items: readonly ChoiceItem[]) =>
  items.reduce((sum, item) => sum + 1 / item.options.length, 0) / items.length;

/** Expected hit rate of always picking among the options that minimise `score`. */
function pickMinRate(
  items: readonly ChoiceItem[],
  score: (option: string, item: ChoiceItem) => number,
): number {
  const total = items.reduce((sum, item) => {
    const scores = item.options.map((option) => score(option, item));
    const best = Math.min(...scores);
    const winners = item.options.filter((_, i) => scores[i] === best);
    return sum + (winners.includes(item.answer) ? 1 / winners.length : 0);
  }, 0);
  return total / items.length;
}

/** Picks the option closest to all the others: exposes distractors derived from the answer. */
export const centroidRate = (
  items: readonly ChoiceItem[],
  distance: (a: string, b: string) => number,
) =>
  pickMinRate(items, (option, item) =>
    item.options.reduce((sum, other) => sum + distance(option, other), 0),
  );

/** Picks the numeric median: exposes distractors placed symmetrically around the answer. */
export const medianRate = (items: readonly ChoiceItem[]) =>
  pickMinRate(items, (option, item) => {
    const values = item.options.map(Number).sort((a, b) => a - b);
    const median =
      ((values[Math.floor((values.length - 1) / 2)] as number) +
        (values[Math.ceil((values.length - 1) / 2)] as number)) /
      2;
    return Math.abs(Number(option) - median);
  });

/** Share of items whose answer is the smallest or largest numeric option (chance = 2 / n). */
export function extremeShare(items: readonly ChoiceItem[]): { observed: number; chance: number } {
  let observed = 0;
  let chance = 0;
  for (const item of items) {
    const values = item.options.map(Number);
    const answer = Number(item.answer);
    if (answer === Math.min(...values) || answer === Math.max(...values)) observed++;
    chance += Math.min(1, 2 / item.options.length);
  }
  return { observed: observed / items.length, chance: chance / items.length };
}

export function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current.push(
        Math.min(
          (previous[j] as number) + 1,
          (current[j - 1] as number) + 1,
          (previous[j - 1] as number) + cost,
        ),
      );
    }
    previous = current;
  }
  return previous[b.length] as number;
}

/** Kendall tau distance between two orders written as "a → b → c". */
export function orderDistance(a: string, b: string): number {
  const left = a.split(' → ');
  const position = new Map(b.split(' → ').map((node, i) => [node, i]));
  let inversions = 0;
  for (let i = 0; i < left.length; i++)
    for (let j = i + 1; j < left.length; j++)
      if ((position.get(left[i] as string) ?? 0) > (position.get(left[j] as string) ?? 0))
        inversions++;
  return inversions;
}
