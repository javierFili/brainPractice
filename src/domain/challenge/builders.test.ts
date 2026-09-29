import { mulberry32, toSeed } from '../random';
import { retryGeneration, GenerationExhaustedError } from '../game/retryGeneration';
import { locateResponse, numericResponse, singleChoice } from './builders';
import { validateResponse } from './validateChallenge';

describe('response builders', () => {
  it('shuffles the correct option among distractors deterministically', () => {
    const a = singleChoice(mulberry32(toSeed(5)), 'right', ['w1', 'w2', 'w3']);
    const b = singleChoice(mulberry32(toSeed(5)), 'right', ['w1', 'w2', 'w3']);
    expect(a).toEqual(b);
    expect(validateResponse(a)).toEqual([]);
    expect(a.question.options.find((o) => o.id === a.solution.optionId)?.label).toBe('right');
  });

  it('places the correct answer in different positions across seeds', () => {
    const positions = new Set(
      Array.from({ length: 40 }, (_, seed) => {
        const r = singleChoice(mulberry32(toSeed(seed)), 'right', ['w1', 'w2', 'w3']);
        return r.question.options.findIndex((o) => o.label === 'right');
      }),
    );
    expect(positions.size).toBe(4);
  });

  it('rejects duplicate or too many options', () => {
    expect(() => singleChoice(mulberry32(toSeed(1)), 'x', ['x', 'y'])).toThrow(/Duplicate/);
    expect(() =>
      singleChoice(
        mulberry32(toSeed(1)),
        'x',
        Array.from({ length: 8 }, (_, i) => `d${i}`),
      ),
    ).toThrow(/At most/);
  });

  it('builds numeric and locate responses', () => {
    expect(numericResponse(4)).toEqual({ format: 'numeric', question: {}, solution: { value: 4 } });
    expect(numericResponse(4, 'rounds').question).toEqual({ unit: 'rounds' });
    expect(locateResponse(5, 2)).toEqual({
      format: 'locate',
      question: { itemCount: 5 },
      solution: { index: 2 },
    });
  });
});

describe('retryGeneration', () => {
  it('returns the first accepted candidate', () => {
    let calls = 0;
    expect(retryGeneration('thing', () => (++calls === 3 ? 'ok' : null))).toBe('ok');
    expect(calls).toBe(3);
  });

  it('throws when attempts are exhausted instead of returning a bad candidate', () => {
    expect(() => retryGeneration('thing', () => null, 5)).toThrow(GenerationExhaustedError);
  });
});
