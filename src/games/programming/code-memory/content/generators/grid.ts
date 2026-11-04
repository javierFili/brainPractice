import { locateResponse } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, sample, type RandomGenerator } from '@/domain/random';
import { msg } from '@/domain/shared';
import { cellLabelAt } from '@/games/kit/content';
import type { CodeMemoryProfile } from '../types';
import { KEYWORD_FAMILIES } from '../vocabulary';
import type { MemoryDraft } from './draft';

const familyOf = (word: string) => KEYWORD_FAMILIES.find((family) => family.includes(word)) ?? [];

/**
 * Distinct keywords. Look-alike grids draw them from few families, so most words have a
 * near-twin elsewhere on the grid (`map` / `max`); otherwise at most one word per family.
 */
function chooseWords(random: RandomGenerator, count: number, similar: boolean): string[] {
  if (!similar)
    return sample(random, KEYWORD_FAMILIES, count).map((family) => pick(random, family));
  const familyCount = Math.ceil(count / 4) + 1;
  return sample(random, sample(random, KEYWORD_FAMILIES, familyCount).flat(), count);
}

/** A grid of keywords shown, then hidden: point at the cell where one of them was. */
export function positionRecall(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  const { rows, cols, elementCount, similarKeywords } = profile.grid;
  const cellCount = rows * cols;
  return retryGeneration('position-recall', () => {
    const words = chooseWords(random, elementCount, similarKeywords);
    const slots = sample(
      random,
      Array.from({ length: cellCount }, (_, i) => i),
      elementCount,
    );
    const cells: (string | null)[] = Array.from({ length: cellCount }, () => null);
    slots.forEach((slot, i) => {
      cells[slot] = words[i] ?? null;
    });

    const twinOf = (word: string) =>
      words.find((other) => other !== word && familyOf(word).includes(other));
    const withTwin = words.filter((word) => twinOf(word) !== undefined);
    if (similarKeywords && withTwin.length === 0) return null;
    const target = pick(random, similarKeywords ? withTwin : words);
    const index = cells.indexOf(target);
    const twin = similarKeywords ? twinOf(target) : undefined;

    return {
      prompt: msg('programming:codeMemory.position.prompt', { keyword: target }),
      content: { kind: 'position-recall', rows, cols, cells, target },
      response: locateResponse(cellCount, index),
      explanation:
        twin === undefined
          ? msg('programming:codeMemory.position.explanation', {
              keyword: target,
              cell: cellLabelAt(index, cols),
            })
          : msg('programming:codeMemory.position.explanationTwin', {
              keyword: target,
              cell: cellLabelAt(index, cols),
              twin,
              twinCell: cellLabelAt(cells.indexOf(twin), cols),
            }),
      skills: ['working-memory', 'attention'],
    };
  });
}
