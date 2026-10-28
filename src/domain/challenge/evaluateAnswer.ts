import { err, ok, type Result } from '../shared/result';
import type { Answer, AnswerOf, Response, ResponseOf } from './responseFormats';

export type AnswerErrorCode =
  | 'FORMAT_MISMATCH'
  | 'UNKNOWN_OPTION'
  | 'INVALID_ORDERING'
  | 'OUT_OF_RANGE'
  | 'NOT_A_NUMBER'
  | 'WRONG_LENGTH'
  | 'DUPLICATE_INDEX'
  | 'INVALID_PAIR'
  | 'INCONSISTENT_TAP';

export interface AnswerError {
  readonly code: AnswerErrorCode;
  readonly message: string;
}

type Evaluation = Result<boolean, AnswerError>;

const fail = (code: AnswerErrorCode, message: string): Evaluation => err({ code, message });

function evaluateChoice(response: ResponseOf<'single-choice'>, answer: AnswerOf<'single-choice'>) {
  if (!response.question.options.some((option) => option.id === answer.optionId)) {
    return fail('UNKNOWN_OPTION', `Option "${answer.optionId}" is not part of this challenge`);
  }
  return ok(answer.optionId === response.solution.optionId);
}

function evaluateOrdering(response: ResponseOf<'ordering'>, answer: AnswerOf<'ordering'>) {
  const expected = new Set(response.question.items.map((item) => item.id));
  const given = new Set(answer.order);
  const isPermutation =
    answer.order.length === expected.size &&
    given.size === expected.size &&
    answer.order.every((id) => expected.has(id));
  if (!isPermutation) {
    return fail('INVALID_ORDERING', 'The answer must place every item exactly once');
  }
  return ok(answer.order.every((id, i) => id === response.solution.order[i]));
}

function evaluateLocate(response: ResponseOf<'locate'>, answer: AnswerOf<'locate'>) {
  const { index } = answer;
  if (!Number.isInteger(index) || index < 0 || index >= response.question.itemCount) {
    return fail(
      'OUT_OF_RANGE',
      `Index ${index} is outside [0, ${response.question.itemCount - 1}]`,
    );
  }
  return ok(index === response.solution.index);
}

function evaluateNumeric(response: ResponseOf<'numeric'>, answer: AnswerOf<'numeric'>) {
  if (!Number.isFinite(answer.value))
    return fail('NOT_A_NUMBER', 'The answer must be a finite number');
  return ok(answer.value === response.solution.value);
}

function evaluateSequence(response: ResponseOf<'sequence'>, answer: AnswerOf<'sequence'>) {
  const { symbols, length } = response.question;
  if (answer.sequence.length !== length) {
    return fail('WRONG_LENGTH', `The sequence must have ${length} entries`);
  }
  const known = new Set(symbols.map((s) => s.id));
  const unknown = answer.sequence.find((id) => !known.has(id));
  if (unknown !== undefined) return fail('UNKNOWN_OPTION', `Symbol "${unknown}" is not offered`);
  return ok(answer.sequence.every((id, i) => id === response.solution.sequence[i]));
}

const inRange = (index: number, count: number) =>
  Number.isInteger(index) && index >= 0 && index < count;

/** Errors of a multi-select answer: targets left unmarked plus marks on non-targets. */
export function multiSelectErrors(
  solution: readonly number[],
  marked: readonly number[],
): { readonly missed: number; readonly wrong: number } {
  const targets = new Set(solution);
  const marks = new Set(marked);
  return {
    missed: [...targets].filter((i) => !marks.has(i)).length,
    wrong: [...marks].filter((i) => !targets.has(i)).length,
  };
}

function evaluateMultiSelect(
  response: ResponseOf<'multi-select'>,
  answer: AnswerOf<'multi-select'>,
) {
  const { itemCount, exactCount, maxErrors } = response.question;
  const outside = answer.indices.find((i) => !inRange(i, itemCount));
  if (outside !== undefined) {
    return fail('OUT_OF_RANGE', `Index ${outside} is outside [0, ${itemCount - 1}]`);
  }
  if (new Set(answer.indices).size !== answer.indices.length) {
    return fail('DUPLICATE_INDEX', 'Each element can be marked once');
  }
  if (exactCount !== null && answer.indices.length !== exactCount) {
    return fail('WRONG_LENGTH', `Exactly ${exactCount} elements must be marked`);
  }
  const { missed, wrong } = multiSelectErrors(response.solution.indices, answer.indices);
  return ok(missed + wrong <= maxErrors);
}

/** Mismatched attempts and pairs found, for a pairs answer already known to be valid. */
export function pairsTally(
  solution: readonly (readonly [number, number])[],
  attempts: readonly (readonly [number, number])[],
): { readonly found: number; readonly misses: number } {
  const partner = new Map<number, number>();
  for (const [a, b] of solution) {
    partner.set(a, b);
    partner.set(b, a);
  }
  const found = new Set<number>();
  let misses = 0;
  for (const [a, b] of attempts) {
    if (partner.get(a) === b) found.add(Math.min(a, b));
    else misses++;
  }
  return { found: found.size, misses };
}

function evaluatePairs(response: ResponseOf<'pairs'>, answer: AnswerOf<'pairs'>) {
  const { itemCount, maxMisses } = response.question;
  for (const attempt of answer.attempts) {
    const [a, b] = attempt;
    // Answers may come from untrusted input: the tuple type is not a runtime guarantee.
    const cards: readonly number[] = attempt;
    if (cards.length !== 2 || !inRange(a, itemCount) || !inRange(b, itemCount) || a === b) {
      return fail('INVALID_PAIR', `Attempt [${attempt.join(', ')}] is not two distinct cards`);
    }
  }
  const { found, misses } = pairsTally(response.solution.pairs, answer.attempts);
  return ok(found === response.solution.pairs.length && misses <= maxMisses);
}

function evaluateTap(response: ResponseOf<'tap'>, answer: AnswerOf<'tap'>) {
  const { reactionMs, tapped } = answer;
  if (tapped !== (reactionMs !== null) || (reactionMs !== null && !Number.isFinite(reactionMs))) {
    return fail('INCONSISTENT_TAP', 'A tap needs a finite reaction time and only a tap has one');
  }
  if (!response.solution.shouldTap) return ok(!tapped);
  return ok(reactionMs !== null && reactionMs >= 0 && reactionMs <= response.question.windowMs);
}

/**
 * Returns whether a structurally valid answer is correct. Malformed answers are errors, not
 * "incorrect", so a UI bug can never be scored as a player mistake.
 */
export function evaluateAnswer(response: Response, answer: Answer): Evaluation {
  if (answer.format !== response.format) {
    return fail(
      'FORMAT_MISMATCH',
      `Expected a "${response.format}" answer, got "${answer.format}"`,
    );
  }
  // Each branch narrows `response`; `answer.format` was just proven equal to it.
  switch (response.format) {
    case 'single-choice':
      return evaluateChoice(response, answer as AnswerOf<'single-choice'>);
    case 'ordering':
      return evaluateOrdering(response, answer as AnswerOf<'ordering'>);
    case 'locate':
      return evaluateLocate(response, answer as AnswerOf<'locate'>);
    case 'numeric':
      return evaluateNumeric(response, answer as AnswerOf<'numeric'>);
    case 'sequence':
      return evaluateSequence(response, answer as AnswerOf<'sequence'>);
    case 'multi-select':
      return evaluateMultiSelect(response, answer as AnswerOf<'multi-select'>);
    case 'pairs':
      return evaluatePairs(response, answer as AnswerOf<'pairs'>);
    case 'tap':
      return evaluateTap(response, answer as AnswerOf<'tap'>);
  }
}
