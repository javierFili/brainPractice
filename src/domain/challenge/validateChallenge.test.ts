import { generateChallenge } from '../game/generateChallenge';
import { fixtureGame } from '@/test/fixtures/fixtureGame';
import type { Challenge } from './challenge';
import type { Response } from './responseFormats';
import { validateChallenge, validateResponse, validateTiming } from './validateChallenge';

const valid: Challenge = generateChallenge(fixtureGame, { level: 3, seed: 1 });
const options = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

describe('validateChallenge', () => {
  it('accepts a well-formed challenge', () => {
    expect(validateChallenge(valid)).toEqual([]);
  });

  it('reports every missing text field', () => {
    const issues = validateChallenge({
      ...valid,
      prompt: ' ',
      explanation: '',
      skills: [],
      content: { kind: '' },
    });
    expect(issues).toEqual([
      'prompt is empty',
      'explanation is empty',
      'at least one skill is required',
      'content.kind is empty',
    ]);
  });
});

describe('validateResponse', () => {
  it.each<[string, Response, string]>([
    [
      'single option',
      {
        format: 'single-choice',
        question: { options: [{ id: 'a', label: 'A' }] },
        solution: { optionId: 'a' },
      },
      'options: at least 2 entries required',
    ],
    [
      'duplicate ids',
      {
        format: 'single-choice',
        question: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'a', label: 'B' },
          ],
        },
        solution: { optionId: 'a' },
      },
      'options: duplicate ids',
    ],
    [
      'duplicate labels',
      {
        format: 'single-choice',
        question: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'A' },
          ],
        },
        solution: { optionId: 'a' },
      },
      'options: duplicate labels make the challenge ambiguous',
    ],
    [
      'empty label',
      {
        format: 'single-choice',
        question: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'b', label: ' ' },
          ],
        },
        solution: { optionId: 'a' },
      },
      'options: empty label',
    ],
    [
      'unknown solution',
      { format: 'single-choice', question: { options }, solution: { optionId: 'z' } },
      'solution references an unknown option',
    ],
    [
      'non-permutation',
      { format: 'ordering', question: { items: options }, solution: { order: ['a', 'a'] } },
      'solution must be a permutation of the items',
    ],
    [
      'short ordering',
      { format: 'ordering', question: { items: options }, solution: { order: ['a'] } },
      'solution must be a permutation of the items',
    ],
    [
      'tiny locate',
      { format: 'locate', question: { itemCount: 1 }, solution: { index: 0 } },
      'itemCount must be an integer >= 2',
    ],
    [
      'locate out of range',
      { format: 'locate', question: { itemCount: 3 }, solution: { index: 3 } },
      'solution index out of range',
    ],
    [
      'numeric NaN',
      { format: 'numeric', question: {}, solution: { value: Number.NaN } },
      'solution must be a finite number',
    ],
  ])('reports %s', (_, response, issue) => {
    expect(validateResponse(response)).toContain(issue);
  });

  it('accepts valid responses of every format', () => {
    expect(
      validateResponse({
        format: 'ordering',
        question: { items: options },
        solution: { order: ['b', 'a'] },
      }),
    ).toEqual([]);
    expect(
      validateResponse({ format: 'locate', question: { itemCount: 3 }, solution: { index: 0 } }),
    ).toEqual([]);
    expect(
      validateResponse({ format: 'numeric', question: { unit: 'ms' }, solution: { value: 0 } }),
    ).toEqual([]);
  });
});

describe('validateTiming', () => {
  it('accepts untimed and timed configurations', () => {
    expect(validateTiming({ studyMs: null, limitMs: null, targetMs: 1 })).toEqual([]);
    expect(validateTiming({ studyMs: 3000, limitMs: 5000, targetMs: 5000 })).toEqual([]);
  });

  it('reports zero, negative and inconsistent values', () => {
    expect(validateTiming({ studyMs: 0, limitMs: -1, targetMs: 0 })).toEqual([
      'studyMs must be positive or null',
      'limitMs must be positive or null',
      'targetMs must be positive',
    ]);
    expect(validateTiming({ studyMs: null, limitMs: 1000, targetMs: 2000 })).toEqual([
      'targetMs exceeds limitMs',
    ]);
  });
});
