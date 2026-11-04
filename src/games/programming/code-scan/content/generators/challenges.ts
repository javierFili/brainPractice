import { locateResponse, type ResponseOf } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, type RandomGenerator } from '@/domain/random';
import { msg, type Message, type Text } from '@/domain/shared';
import { lineText } from '../format';
import type { CodeScanProfile, MutationCategory, Snippet } from '../types';
import type { CodeScanDraft } from './draft';
import { applyMutation, pickMutation, type PlannedMutation } from './mutations';
import { buildSnippet } from './snippets';

const KEY = 'programming:codeScan';

/** Answer options for classify-the-change, in a fixed order so number-key shortcuts stay stable. */
export const CATEGORY_LABELS: Readonly<Record<MutationCategory, Message>> = {
  operator: msg(`${KEY}.category.operator`),
  variable: msg(`${KEY}.category.variable`),
  number: msg(`${KEY}.category.number`),
  typo: msg(`${KEY}.category.typo`),
  negation: msg(`${KEY}.category.negation`),
};

export const SAME_LABEL = msg(`${KEY}.same`);
export const DIFFERENT_LABEL = msg(`${KEY}.different`);

const SKILLS = ['attention', 'debugging'] as const;

/** Fixed-order single-choice response (the builder shuffles, which would cost speed here). */
function fixedChoice(
  options: readonly { id: string; label: Text }[],
  solutionId: string,
): ResponseOf<'single-choice'> {
  return { format: 'single-choice', question: { options }, solution: { optionId: solutionId } };
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

/**
 * Plain-language account of the change with both versions of the line, e.g. "On line 3, the
 * operator “<” became “<=”: …". Tokens and lines stay literal code.
 */
const changeSentence = ({ original, copy, mutation }: Pair): Message =>
  msg(`${KEY}.change.${mutation.category}`, {
    line: mutation.line + 1,
    before: mutation.before ?? '',
    after: mutation.after,
    from: lineText(original[mutation.line] ?? { indent: 0, tokens: [] }),
    to: lineText(copy[mutation.line] ?? { indent: 0, tokens: [] }),
  });

export function sameOrDifferent(random: RandomGenerator, profile: CodeScanProfile): CodeScanDraft {
  const options = [
    { id: 'same', label: SAME_LABEL },
    { id: 'different', label: DIFFERENT_LABEL },
  ];
  const prompt = msg(`${KEY}.prompt.sameOrDifferent`);
  if (chance(random, 0.5)) {
    const { lines } = buildSnippet(random, profile);
    return {
      prompt,
      content: { kind: 'same-or-different', original: lines, copy: lines },
      response: fixedChoice(options, 'same'),
      explanation: msg(`${KEY}.explanation.same`, { label: SAME_LABEL, count: lines.length }),
      skills: SKILLS,
    };
  }
  const pair = mutatedPair(random, profile, true);
  return {
    prompt,
    content: { kind: 'same-or-different', original: pair.original, copy: pair.copy },
    response: fixedChoice(options, 'different'),
    explanation: msg(`${KEY}.explanation.different`, {
      label: DIFFERENT_LABEL,
      change: changeSentence(pair),
    }),
    skills: SKILLS,
  };
}

export function findTheChange(random: RandomGenerator, profile: CodeScanProfile): CodeScanDraft {
  const pair = mutatedPair(random, profile, true);
  return {
    prompt: msg(`${KEY}.prompt.findTheChange`),
    content: { kind: 'find-the-change', original: pair.original, copy: pair.copy },
    response: locateResponse(pair.original.length, pair.mutation.line),
    explanation: msg(`${KEY}.explanation.line`, {
      line: pair.mutation.line + 1,
      change: changeSentence(pair),
    }),
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
        ? msg(`${KEY}.prompt.classify`)
        : msg(`${KEY}.prompt.classifyLine`, { line: line + 1 }),
    content: {
      kind: 'classify-the-change',
      original: pair.original,
      copy: pair.copy,
      highlightLine,
    },
    response: fixedChoice(options, category),
    explanation: msg(`${KEY}.explanation.classify`, {
      category: CATEGORY_LABELS[category],
      change: changeSentence(pair),
    }),
    skills: [...SKILLS, 'pattern-recognition'],
  };
}
