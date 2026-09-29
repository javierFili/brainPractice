import { evaluateAnswer } from './evaluateAnswer';
import type { Answer, Response } from './responseFormats';

const choice: Response = {
  format: 'single-choice',
  question: {
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
  },
  solution: { optionId: 'b' },
};
const ordering: Response = {
  format: 'ordering',
  question: {
    items: [
      { id: 'x', label: 'X' },
      { id: 'y', label: 'Y' },
      { id: 'z', label: 'Z' },
    ],
  },
  solution: { order: ['z', 'x', 'y'] },
};
const locate: Response = { format: 'locate', question: { itemCount: 4 }, solution: { index: 2 } };
const numeric: Response = { format: 'numeric', question: {}, solution: { value: -3 } };

const errorCode = (response: Response, answer: Answer) => {
  const result = evaluateAnswer(response, answer);
  return result.ok ? null : result.error.code;
};

describe('evaluateAnswer', () => {
  it.each<[string, Response, Answer, boolean]>([
    ['choice correct', choice, { format: 'single-choice', optionId: 'b' }, true],
    ['choice wrong', choice, { format: 'single-choice', optionId: 'a' }, false],
    ['ordering correct', ordering, { format: 'ordering', order: ['z', 'x', 'y'] }, true],
    ['ordering wrong', ordering, { format: 'ordering', order: ['x', 'y', 'z'] }, false],
    ['locate correct', locate, { format: 'locate', index: 2 }, true],
    ['locate wrong (first)', locate, { format: 'locate', index: 0 }, false],
    ['locate wrong (last)', locate, { format: 'locate', index: 3 }, false],
    ['numeric correct', numeric, { format: 'numeric', value: -3 }, true],
    ['numeric wrong', numeric, { format: 'numeric', value: 3 }, false],
    [
      'numeric zero is a valid answer',
      { ...numeric, solution: { value: 0 } },
      { format: 'numeric', value: 0 },
      true,
    ],
  ])('%s', (_, response, answer, expected) => {
    expect(evaluateAnswer(response, answer)).toEqual({ ok: true, value: expected });
  });

  it('rejects an answer of another format', () => {
    expect(errorCode(choice, { format: 'locate', index: 0 })).toBe('FORMAT_MISMATCH');
  });

  it('rejects unknown and empty option ids', () => {
    expect(errorCode(choice, { format: 'single-choice', optionId: 'c' })).toBe('UNKNOWN_OPTION');
    expect(errorCode(choice, { format: 'single-choice', optionId: '' })).toBe('UNKNOWN_OPTION');
  });

  it.each([
    ['empty', []],
    ['incomplete', ['z', 'x']],
    ['duplicated', ['z', 'z', 'x']],
    ['foreign item', ['z', 'x', 'w']],
    ['too long', ['z', 'x', 'y', 'y']],
  ])('rejects a %s ordering', (_, order) => {
    expect(errorCode(ordering, { format: 'ordering', order })).toBe('INVALID_ORDERING');
  });

  it.each([-1, 4, 1.5, Number.NaN])('rejects locate index %s', (index) => {
    expect(errorCode(locate, { format: 'locate', index })).toBe('OUT_OF_RANGE');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('rejects numeric %s', (value) => {
    expect(errorCode(numeric, { format: 'numeric', value })).toBe('NOT_A_NUMBER');
  });
});
