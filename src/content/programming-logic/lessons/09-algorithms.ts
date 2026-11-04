import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { msg } from '@/domain/shared/text';
import { C } from '../concepts';

const t = (key: string) => msg(`lessons:algorithms.${key}`);

export const lesson: Lesson = {
  id: lessonId('algorithms'),
  title: t('title'),
  objective: t('objective'),
  summary: t('summary'),
  minutes: 13,
  concepts: [C.algorithms, C.lists],
  keyPoints: [t('keyPoints.1'), t('keyPoints.2'), t('keyPoints.3'), t('keyPoints.4')],
  steps: [
    {
      kind: 'explain',
      id: 'recipe',
      title: t('steps.recipe.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.recipe.blocks.p1'),
        },
        {
          kind: 'code',
          source: 'total = 0\nfor n in numbers:\n    total = total + n',
          caption: t('steps.recipe.blocks.code1.caption'),
        },
        {
          kind: 'paragraph',
          text: t('steps.recipe.blocks.p2'),
        },
        {
          kind: 'list',
          items: [
            t('steps.recipe.blocks.list1.1'),
            t('steps.recipe.blocks.list1.2'),
            t('steps.recipe.blocks.list1.3'),
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-shapes',
      title: t('steps.play-shapes.title'),
      intro: t('steps.play-shapes.intro'),
      playground: {
        inputs: [
          { name: 'a', type: 'number', initial: 4, min: -20, max: 20 },
          { name: 'b', type: 'number', initial: 9, min: -20, max: 20 },
          { name: 'c', type: 'number', initial: 2, min: -20, max: 20 },
          { name: 'd', type: 'number', initial: 7, min: -20, max: 20 },
          { name: 'limit', type: 'number', initial: 5, min: -20, max: 20 },
        ],
        source:
          'numbers = [a, b, c, d]\ntotal = 0\nabove = 0\nlargest = numbers[0]\nfor n in numbers:\n    total = total + n\n    if n > limit:\n        above = above + 1\n    if n > largest:\n        largest = n\nprint("total:", total)\nprint("above limit:", above)\nprint("largest:", largest)',
        watch: ['total', 'above', 'largest'],
        prompts: [
          t('steps.play-shapes.prompts.1'),
          t('steps.play-shapes.prompts.2'),
          t('steps.play-shapes.prompts.3'),
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'what-is',
      phase: 'guided',
      exercise: {
        id: exerciseId('l09-what-is-algorithm'),
        kind: 'multiple-choice',
        prompt: t('exercises.what-is-algorithm.prompt'),
        concept: C.algorithms,
        dimension: 'understanding',
        hints: [t('exercises.what-is-algorithm.hints.1')],
        explanation: t('exercises.what-is-algorithm.explanation'),
        options: [
          { id: 'one', label: t('exercises.what-is-algorithm.options.one') },
          { id: 'vague', label: t('exercises.what-is-algorithm.options.vague') },
          {
            id: 'recipe',
            label: t('exercises.what-is-algorithm.options.recipe'),
          },
          { id: 'forever', label: t('exercises.what-is-algorithm.options.forever') },
        ],
        correctOptionId: 'recipe',
        misconceptions: {
          one: t('exercises.what-is-algorithm.misconceptions.one'),
          vague: t('exercises.what-is-algorithm.misconceptions.vague'),
          forever: t('exercises.what-is-algorithm.misconceptions.forever'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'count-trace',
      phase: 'guided',
      exercise: {
        id: exerciseId('l09-count-adults'),
        kind: 'prediction',
        prompt: t('exercises.count-adults.prompt'),
        concept: C.algorithms,
        dimension: 'application',
        hints: [t('exercises.count-adults.hints.1'), t('exercises.count-adults.hints.2')],
        explanation: t('exercises.count-adults.explanation'),
        code: {
          source:
            'ages = [12, 19, 30, 17, 18]\nadults = 0\nfor a in ages:\n    if a >= 18:\n        adults = adults + 1',
          highlight: [5],
        },
        target: { kind: 'variable', name: 'adults' },
        expected: '3',
        commonMistakes: {
          '2': t('exercises.count-adults.commonMistakes.2'),
          '67': t('exercises.count-adults.commonMistakes.67'),
          '5': t('exercises.count-adults.commonMistakes.5'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'build-max',
      phase: 'guided',
      exercise: {
        id: exerciseId('l09-build-max'),
        kind: 'block-builder',
        prompt: t('exercises.build-max.prompt'),
        concept: C.algorithms,
        dimension: 'application',
        hints: [t('exercises.build-max.hints.1'), t('exercises.build-max.hints.2')],
        explanation: t('exercises.build-max.explanation'),
        blocks: [
          { id: 'start', label: t('exercises.build-max.blocks.start') },
          { id: 'set', label: t('exercises.build-max.blocks.set') },
          { id: 'read', label: t('exercises.build-max.blocks.read') },
          { id: 'compare', label: t('exercises.build-max.blocks.compare') },
          { id: 'update', label: t('exercises.build-max.blocks.update') },
          { id: 'repeat', label: t('exercises.build-max.blocks.repeat') },
          { id: 'return', label: t('exercises.build-max.blocks.return') },
          { id: 'zero', label: t('exercises.build-max.blocks.zero') },
          { id: 'last', label: t('exercises.build-max.blocks.last') },
        ],
        solution: ['start', 'set', 'read', 'compare', 'update', 'repeat', 'return'],
        misconceptions: {
          zero: t('exercises.build-max.misconceptions.zero'),
          last: t('exercises.build-max.misconceptions.last'),
        },
      },
    },
    {
      kind: 'explain',
      id: 'search-cost',
      title: t('steps.search-cost.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.search-cost.blocks.p1'),
        },
        {
          kind: 'code',
          source: 'found = false\nfor item in items:\n    if item == target:\n        found = true',
          caption: t('steps.search-cost.blocks.code1.caption'),
        },
        {
          kind: 'paragraph',
          text: t('steps.search-cost.blocks.p2'),
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: t('steps.search-cost.blocks.callout1'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-search',
      title: t('steps.play-search.title'),
      intro: t('steps.play-search.intro'),
      playground: {
        inputs: [{ name: 'target', type: 'number', initial: 7, min: 0, max: 10 }],
        source:
          'items = [4, 9, 2, 7, 5, 1, 8, 3]\nfound = false\ni = 0\ncomparisons = 0\nwhile i < len(items) and not found:\n    comparisons = comparisons + 1\n    if items[i] == target:\n        found = true\n    else:\n        i = i + 1\nprint("found:", found, "at index", i)\nprint("comparisons:", comparisons)',
        watch: ['found', 'i', 'comparisons'],
        prompts: [
          t('steps.play-search.prompts.1'),
          t('steps.play-search.prompts.2'),
          t('steps.play-search.prompts.3'),
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'search-position',
      phase: 'practice',
      exercise: {
        id: exerciseId('l09-search-position'),
        kind: 'prediction',
        prompt: t('exercises.search-position.prompt'),
        concept: C.lists,
        dimension: 'application',
        hints: [t('exercises.search-position.hints.1'), t('exercises.search-position.hints.2')],
        explanation: t('exercises.search-position.explanation'),
        code: {
          source:
            'items = [3, 8, 5, 8]\ntarget = 8\nposition = -1\nfor i in range(len(items)):\n    if items[i] == target:\n        position = i',
          highlight: [6],
        },
        target: { kind: 'variable', name: 'position' },
        expected: '3',
        commonMistakes: {
          '1': t('exercises.search-position.commonMistakes.1'),
          '4': t('exercises.search-position.commonMistakes.4'),
          '2': t('exercises.search-position.commonMistakes.2'),
          '-1': t('exercises.search-position.commonMistakes.-1'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'search-cost-mc',
      phase: 'practice',
      exercise: {
        id: exerciseId('l09-search-cost'),
        kind: 'multiple-choice',
        prompt: t('exercises.search-cost.prompt'),
        concept: C.algorithms,
        dimension: 'understanding',
        hints: [t('exercises.search-cost.hints.1')],
        explanation: t('exercises.search-cost.explanation'),
        options: [
          { id: 'one', label: '1' },
          { id: 'half', label: '500' },
          { id: 'all', label: '1000' },
          { id: 'ten', label: t('exercises.search-cost.options.ten') },
        ],
        correctOptionId: 'all',
        misconceptions: {
          one: t('exercises.search-cost.misconceptions.one'),
          half: t('exercises.search-cost.misconceptions.half'),
          ten: t('exercises.search-cost.misconceptions.ten'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'count-complete',
      phase: 'practice',
      exercise: {
        id: exerciseId('l09-count-passed'),
        kind: 'code-completion',
        prompt: t('exercises.count-passed.prompt'),
        concept: C.algorithms,
        dimension: 'application',
        hints: [t('exercises.count-passed.hints.1'), t('exercises.count-passed.hints.2')],
        explanation: t('exercises.count-passed.explanation'),
        template:
          'scores = [72, 45, 50, 90, 38]\npassed = 0\nfor s in scores:\n    if s [[cmp]] 50:\n        passed = [[update]]',
        blanks: [
          { id: 'cmp', options: ['>', '>=', '<'], correct: '>=' },
          { id: 'update', options: ['passed + s', '1', 'passed + 1'], correct: 'passed + 1' },
        ],
        check: { variable: 'passed', expected: '3' },
        misconceptions: {
          'cmp:>': t('exercises.count-passed.misconceptions.k1'),
          'cmp:<': t('exercises.count-passed.misconceptions.k2'),
          'update:passed + s': t('exercises.count-passed.misconceptions.k3'),
          'update:1': t('exercises.count-passed.misconceptions.k4'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-max',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l09-debug-max-start'),
        kind: 'debugging',
        prompt: t('exercises.debug-max-start.prompt'),
        concept: C.algorithms,
        dimension: 'debugging',
        hints: [t('exercises.debug-max-start.hints.1')],
        explanation: t('exercises.debug-max-start.explanation'),
        code: {
          source:
            'temps = [-4, -9, -2, -7]\nlargest = 0\nfor t in temps:\n    if t > largest:\n        largest = t',
        },
        bugLine: 2,
        causes: [
          {
            id: 'start',
            label: t('exercises.debug-max-start.causes.start'),
          },
          { id: 'compare', label: t('exercises.debug-max-start.causes.compare') },
          { id: 'skip', label: t('exercises.debug-max-start.causes.skip') },
          { id: 'update', label: t('exercises.debug-max-start.causes.update') },
        ],
        correctCauseId: 'start',
        misconceptions: {
          compare: t('exercises.debug-max-start.misconceptions.compare'),
          skip: t('exercises.debug-max-start.misconceptions.skip'),
          update: t('exercises.debug-max-start.misconceptions.update'),
        },
        fix: {
          source:
            'temps = [-4, -9, -2, -7]\nlargest = temps[0]\nfor t in temps:\n    if t > largest:\n        largest = t',
          variable: 'largest',
          expected: '-2',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'range-sum',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l09-range-sum'),
        kind: 'prediction',
        prompt: t('exercises.range-sum.prompt'),
        concept: C.lists,
        dimension: 'application',
        hints: [],
        explanation: t('exercises.range-sum.explanation'),
        code: {
          source:
            'prices = [5, 3, 8, 4]\ntotal = 0\nfor i in range(1, len(prices)):\n    total = total + prices[i]\nprint(total)',
        },
        target: { kind: 'output' },
        expected: '15',
        commonMistakes: {
          '20': t('exercises.range-sum.commonMistakes.20'),
          '16': t('exercises.range-sum.commonMistakes.16'),
          '11': t('exercises.range-sum.commonMistakes.11'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-shapes',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l09-match-shapes'),
        kind: 'matching',
        prompt: t('exercises.match-shapes.prompt'),
        concept: C.algorithms,
        dimension: 'understanding',
        hints: [],
        explanation: t('exercises.match-shapes.explanation'),
        pairs: [
          {
            left: { id: 'spend', label: t('exercises.match-shapes.pairs.spend') },
            right: { id: 'sum', label: t('exercises.match-shapes.pairs.sum') },
          },
          {
            left: { id: 'unread', label: t('exercises.match-shapes.pairs.unread') },
            right: { id: 'count', label: t('exercises.match-shapes.pairs.count') },
          },
          {
            left: { id: 'best', label: t('exercises.match-shapes.pairs.best') },
            right: { id: 'largest', label: t('exercises.match-shapes.pairs.largest') },
          },
          {
            left: { id: 'guest', label: t('exercises.match-shapes.pairs.guest') },
            right: { id: 'search', label: t('exercises.match-shapes.pairs.search') },
          },
        ],
      },
    },
  ],
};
