import { locateResponse, type ResponseOf } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, type RandomGenerator } from '@/domain/random';
import { lineText } from '../format';
import type { CodeScanProfile, Mutation, MutationCategory, Snippet } from '../types';
import type { CodeScanDraft } from './draft';
import { applyMutation, pickMutation, type PlannedMutation } from './mutations';
import { buildSnippet } from './snippets';

/** Answer options for classify-the-change, in a fixed order so number-key shortcuts stay stable. */
export const CATEGORY_LABELS: Readonly<Record<MutationCategory, string>> = {
  operator: 'Operator changed',
  variable: 'Variable swapped',
  number: 'Number changed',
  typo: 'Name misspelled',
  negation: 'Condition negated',
};

export const SAME_LABEL = 'Identical';
export const DIFFERENT_LABEL = 'Different';

const SKILLS = ['attention', 'debugging'] as const;

/** Fixed-order single-choice response (the builder shuffles, which would cost speed here). */
function fixedChoice(
  options: readonly { id: string; label: string }[],
  solutionId: string,
): ResponseOf<'single-choice'> {
  return { format: 'single-choice', question: { options }, solution: { optionId: solutionId } };
}

/** Plain-language account of a mutation, e.g. `the operator "<" became "<="`. */
export function describeMutation(mutation: Mutation): string {
  const { before, after } = mutation;
  switch (mutation.category) {
    case 'operator':
      return `the operator “${before ?? ''}” became “${after}”`;
    case 'variable':
      return `the variable “${before ?? ''}” was replaced by “${after}”, another variable of the snippet`;
    case 'number':
      return `the number ${before ?? ''} became ${after}`;
    case 'typo':
      return `the name “${before ?? ''}” was misspelled as “${after}”`;
    case 'negation':
      return `“not” was added in front of the condition, negating it`;
  }
}

interface Pair {
  readonly original: Snippet;
  readonly copy: Snippet;
  readonly mutation: PlannedMutation;
}

function mutatedPair(
  random: RandomGenerator,
  profile: CodeScanProfile,
  allowComplement: boolean,
): Pair {
  return retryGeneration('code scan mutation', () => {
    const { lines, runLines } = buildSnippet(random, profile);
    const mutation = pickMutation(random, lines, runLines, profile, { allowComplement });
    return mutation === null
      ? null
      : { original: lines, copy: applyMutation(lines, mutation), mutation };
  });
}

const changeSentence = ({ original, copy, mutation }: Pair) => {
  const n = mutation.line + 1;
  const from = lineText(original[mutation.line] ?? { indent: 0, tokens: [] });
  const to = lineText(copy[mutation.line] ?? { indent: 0, tokens: [] });
  return `On line ${n}, ${describeMutation(mutation)}: “${from}” → “${to}”.`;
};

export function sameOrDifferent(random: RandomGenerator, profile: CodeScanProfile): CodeScanDraft {
  const options = [
    { id: 'same', label: SAME_LABEL },
    { id: 'different', label: DIFFERENT_LABEL },
  ];
  const prompt = 'Is the copy identical to the original?';
  if (chance(random, 0.5)) {
    const { lines } = buildSnippet(random, profile);
    return {
      prompt,
      content: { kind: 'same-or-different', original: lines, copy: lines },
      response: fixedChoice(options, 'same'),
      explanation: `${SAME_LABEL}: all ${lines.length} lines match token for token.`,
      skills: SKILLS,
    };
  }
  const pair = mutatedPair(random, profile, true);
  return {
    prompt,
    content: { kind: 'same-or-different', original: pair.original, copy: pair.copy },
    response: fixedChoice(options, 'different'),
    explanation: `${DIFFERENT_LABEL}: exactly one token differs. ${changeSentence(pair)}`,
    skills: SKILLS,
  };
}

export function findTheChange(random: RandomGenerator, profile: CodeScanProfile): CodeScanDraft {
  const pair = mutatedPair(random, profile, true);
  const n = pair.mutation.line + 1;
  return {
    prompt: 'One token of the copy differs from the original. Which line of the copy changed?',
    content: { kind: 'find-the-change', original: pair.original, copy: pair.copy },
    response: locateResponse(pair.original.length, pair.mutation.line),
    explanation: `Line ${n} changed. ${changeSentence(pair)}`,
    skills: SKILLS,
  };
}

export function classifyTheChange(
  random: RandomGenerator,
  profile: CodeScanProfile,
): CodeScanDraft {
  // Complement swaps (`=` → `≠`) would read as both "operator" and "negation": never classified.
  const pair = mutatedPair(random, profile, false);
  const { line, category } = pair.mutation;
  const highlightLine = profile.highlightChange ? line : null;
  const options = (Object.keys(CATEGORY_LABELS) as MutationCategory[]).map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
  }));
  return {
    prompt:
      highlightLine === null
        ? 'One token of the copy changed. What kind of change is it?'
        : `Line ${line + 1} of the copy has one changed token. What kind of change is it?`,
    content: {
      kind: 'classify-the-change',
      original: pair.original,
      copy: pair.copy,
      highlightLine,
    },
    response: fixedChoice(options, category),
    explanation: `${CATEGORY_LABELS[category]}. ${changeSentence(pair)}`,
    skills: [...SKILLS, 'pattern-recognition'],
  };
}
