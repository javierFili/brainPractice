import { multiSelectResponse, pairsResponse, sequenceResponse, tapResponse } from './builders';
import { evaluateAnswer, multiSelectErrors, pairsTally } from './evaluateAnswer';
import type { Answer, Response } from './responseFormats';
import { solutionAnswer } from './solutionAnswer';
import { validateResponse } from './validateChallenge';

const outcome = (response: Response, answer: Answer) => {
  const result = evaluateAnswer(response, answer);
  return result.ok ? result.value : result.error.code;
};

const symbols = [
  { id: 'r', label: 'red' },
  { id: 'g', label: 'green' },
  { id: 'b', label: 'blue' },
];

describe('sequence format', () => {
  const response = sequenceResponse(symbols, ['r', 'r', 'b', 'g']);

  it('accepts the exact sequence, repeats included', () => {
    expect(validateResponse(response)).toEqual([]);
    expect(outcome(response, solutionAnswer(response))).toBe(true);
  });

  it('is incorrect when any position differs', () => {
    expect(outcome(response, { format: 'sequence', sequence: ['r', 'b', 'r', 'g'] })).toBe(false);
  });

  it('rejects malformed answers instead of scoring them', () => {
    expect(outcome(response, { format: 'sequence', sequence: ['r', 'r', 'b'] })).toBe(
      'WRONG_LENGTH',
    );
    expect(outcome(response, { format: 'sequence', sequence: ['r', 'r', 'b', 'x'] })).toBe(
      'UNKNOWN_OPTION',
    );
  });

  it('flags a solution that uses symbols outside the palette', () => {
    expect(validateResponse({ ...response, solution: { sequence: ['r', 'x', 'b', 'g'] } })).toEqual(
      ['solution uses an unknown symbol'],
    );
  });
});

describe('multi-select format', () => {
  const exact = multiSelectResponse(9, [7, 1, 4]);
  const tolerant = multiSelectResponse(12, [0, 3, 5, 8], { exact: false, maxErrors: 1 });

  it('sorts the solution and accepts any order of marks', () => {
    expect(exact.solution.indices).toEqual([1, 4, 7]);
    expect(outcome(exact, { format: 'multi-select', indices: [4, 7, 1] })).toBe(true);
  });

  it('is incorrect when one mark is wrong and no error is allowed', () => {
    expect(outcome(exact, { format: 'multi-select', indices: [4, 7, 2] })).toBe(false);
  });

  it('enforces the announced number of marks', () => {
    expect(outcome(exact, { format: 'multi-select', indices: [4, 7] })).toBe('WRONG_LENGTH');
  });

  it('counts misses and false marks against the tolerance', () => {
    expect(multiSelectErrors([0, 3, 5, 8], [0, 3, 5, 9])).toEqual({ missed: 1, wrong: 1 });
    expect(outcome(tolerant, { format: 'multi-select', indices: [0, 3, 5] })).toBe(true);
    expect(outcome(tolerant, { format: 'multi-select', indices: [0, 3, 5, 8, 11] })).toBe(true);
    expect(outcome(tolerant, { format: 'multi-select', indices: [0, 3, 5, 9] })).toBe(false);
    expect(outcome(tolerant, { format: 'multi-select', indices: [] })).toBe(false);
  });

  it('rejects out-of-range and duplicated marks', () => {
    expect(outcome(exact, { format: 'multi-select', indices: [1, 4, 9] })).toBe('OUT_OF_RANGE');
    expect(outcome(exact, { format: 'multi-select', indices: [1, 1, 4] })).toBe('DUPLICATE_INDEX');
  });

  it('refuses a tolerance that would accept an empty answer', () => {
    expect(validateResponse(multiSelectResponse(6, [1, 2], { maxErrors: 2 }))).toContain(
      'maxErrors must be smaller than the number of targets',
    );
  });
});

describe('pairs format', () => {
  const response = pairsResponse(
    [
      [0, 3],
      [1, 2],
    ],
    1,
  );

  it('accepts all pairs found, in any card order', () => {
    expect(validateResponse(response)).toEqual([]);
    expect(
      outcome(response, {
        format: 'pairs',
        attempts: [
          [2, 1],
          [3, 0],
        ],
      }),
    ).toBe(true);
  });

  it('allows up to maxMisses mismatches', () => {
    const attempts = [
      [0, 1],
      [0, 3],
      [1, 2],
    ] as const;
    expect(pairsTally(response.solution.pairs, attempts)).toEqual({ found: 2, misses: 1 });
    expect(outcome(response, { format: 'pairs', attempts })).toBe(true);
    expect(
      outcome(response, {
        format: 'pairs',
        attempts: [[0, 1], [0, 2], ...attempts.slice(1)],
      }),
    ).toBe(false);
  });

  it('is incorrect when pairs remain hidden; repeated finds count once', () => {
    expect(
      outcome(response, {
        format: 'pairs',
        attempts: [
          [0, 3],
          [3, 0],
        ],
      }),
    ).toBe(false);
  });

  it('rejects impossible attempts', () => {
    expect(outcome(response, { format: 'pairs', attempts: [[1, 1]] })).toBe('INVALID_PAIR');
    expect(outcome(response, { format: 'pairs', attempts: [[1, 4]] })).toBe('INVALID_PAIR');
  });

  it('requires the pairs to cover every card once', () => {
    expect(
      validateResponse({
        ...response,
        solution: {
          pairs: [
            [0, 1],
            [1, 2],
          ],
        },
      }),
    ).toContain('pairs must cover every card exactly once');
  });
});

describe('tap format', () => {
  const go = tapResponse(true, 1500, 1000);
  const noGo = tapResponse(false, 1500, 1000);

  it('accepts a tap inside the signal window on go trials', () => {
    expect(outcome(go, { format: 'tap', tapped: true, reactionMs: 320 })).toBe(true);
    expect(outcome(go, { format: 'tap', tapped: true, reactionMs: 1000 })).toBe(true);
  });

  it('treats a false start, a late tap and no tap as incorrect on go trials', () => {
    expect(outcome(go, { format: 'tap', tapped: true, reactionMs: -40 })).toBe(false);
    expect(outcome(go, { format: 'tap', tapped: true, reactionMs: 1001 })).toBe(false);
    expect(outcome(go, { format: 'tap', tapped: false, reactionMs: null })).toBe(false);
  });

  it('rewards restraint on no-go trials', () => {
    expect(outcome(noGo, solutionAnswer(noGo))).toBe(true);
    expect(outcome(noGo, { format: 'tap', tapped: true, reactionMs: 300 })).toBe(false);
  });

  it('rejects inconsistent answers', () => {
    expect(outcome(go, { format: 'tap', tapped: true, reactionMs: null })).toBe('INCONSISTENT_TAP');
    expect(outcome(go, { format: 'tap', tapped: false, reactionMs: 200 })).toBe('INCONSISTENT_TAP');
  });
});

describe('solutionAnswer', () => {
  it.each([
    sequenceResponse(symbols, ['g']),
    multiSelectResponse(4, [2]),
    pairsResponse(
      [
        [0, 1],
        [2, 3],
      ],
      0,
    ),
    tapResponse(true, 0, 400),
  ])('solves a $format response', (response) => {
    expect(outcome(response, solutionAnswer(response))).toBe(true);
  });
});
