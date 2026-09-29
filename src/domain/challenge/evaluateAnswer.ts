import { err, ok, type Result } from '../shared/result';
import type { Answer, AnswerOf, Response, ResponseOf } from './responseFormats';

export type AnswerErrorCode =
  'FORMAT_MISMATCH' | 'UNKNOWN_OPTION' | 'INVALID_ORDERING' | 'OUT_OF_RANGE' | 'NOT_A_NUMBER';

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
  }
}
