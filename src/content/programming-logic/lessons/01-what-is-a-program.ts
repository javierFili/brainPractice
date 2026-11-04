import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { msg, type Message } from '@/domain/shared';
import { C } from '../concepts';

/** Every prose text of this lesson lives in the `lessons` namespace; code stays literal. */
const t = (key: string): Message => msg(`lessons:whatIsAProgram.${key}`);

export const lesson: Lesson = {
  id: lessonId('what-is-a-program'),
  title: t('title'),
  objective: t('objective'),
  summary: t('summary'),
  minutes: 10,
  concepts: [C.programs],
  keyPoints: [t('keyPoints.1'), t('keyPoints.2'), t('keyPoints.3'), t('keyPoints.4')],
  steps: [
    {
      kind: 'explain',
      id: 'recipe',
      title: t('steps.recipe.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.recipe.blocks.b1'),
        },
        {
          kind: 'paragraph',
          text: t('steps.recipe.blocks.b2'),
        },
        {
          kind: 'list',
          items: [
            t('steps.recipe.blocks.b3.1'),
            t('steps.recipe.blocks.b3.2'),
            t('steps.recipe.blocks.b3.3'),
            t('steps.recipe.blocks.b3.4'),
          ],
        },
        {
          kind: 'callout',
          tone: 'key',
          text: t('steps.recipe.blocks.b4'),
        },
        {
          kind: 'code',
          source: 'price = 4\nquantity = 3\ntotal = price * quantity\nprint("Total:", total)',
          caption: t('steps.recipe.blocks.b5'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-shop',
      title: t('steps.playShop.title'),
      intro: t('steps.playShop.intro'),
      playground: {
        inputs: [
          { name: 'price', type: 'number', initial: 4, min: 0, max: 20 },
          { name: 'quantity', type: 'number', initial: 3, min: 0, max: 10 },
        ],
        source: 'total = price * quantity\nprint("Total:", total)',
        watch: ['price', 'quantity', 'total'],
        prompts: [
          t('steps.playShop.prompts.1'),
          t('steps.playShop.prompts.2'),
          t('steps.playShop.prompts.3'),
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-precise',
      phase: 'guided',
      exercise: {
        id: exerciseId('l01-mc-precise-instruction'),
        kind: 'multiple-choice',
        prompt: t('exercises.mcPreciseInstruction.prompt'),
        concept: C.programs,
        dimension: 'understanding',
        hints: [t('exercises.mcPreciseInstruction.hints.1')],
        explanation: t('exercises.mcPreciseInstruction.explanation'),
        options: [
          { id: 'some', label: t('exercises.mcPreciseInstruction.options.some') },
          { id: 'properly', label: t('exercises.mcPreciseInstruction.options.properly') },
          { id: 'exact', label: t('exercises.mcPreciseInstruction.options.exact') },
          { id: 'needed', label: t('exercises.mcPreciseInstruction.options.needed') },
        ],
        correctOptionId: 'exact',
        misconceptions: {
          some: t('exercises.mcPreciseInstruction.misconceptions.some'),
          properly: t('exercises.mcPreciseInstruction.misconceptions.properly'),
          needed: t('exercises.mcPreciseInstruction.misconceptions.needed'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-first-print',
      phase: 'guided',
      exercise: {
        id: exerciseId('l01-predict-first-print'),
        kind: 'prediction',
        prompt: t('exercises.predictFirstPrint.prompt'),
        concept: C.programs,
        dimension: 'application',
        hints: [t('exercises.predictFirstPrint.hints.1'), t('exercises.predictFirstPrint.hints.2')],
        explanation: t('exercises.predictFirstPrint.explanation'),
        code: { source: 'print("Hello")\nprint("World")' },
        target: { kind: 'output' },
        expected: 'Hello\nWorld',
        commonMistakes: {
          'Hello World': t('exercises.predictFirstPrint.mistakes.m1'),
          'World\nHello': t('exercises.predictFirstPrint.mistakes.m2'),
        },
      },
    },
    {
      kind: 'explain',
      id: 'ipo',
      title: t('steps.ipo.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.ipo.blocks.b1'),
        },
        {
          kind: 'flow',
          nodes: [
            { id: 'start', kind: 'start', label: t('steps.ipo.blocks.b2.nodes.start') },
            { id: 'in', kind: 'action', label: t('steps.ipo.blocks.b2.nodes.in') },
            { id: 'work', kind: 'action', label: t('steps.ipo.blocks.b2.nodes.work') },
            { id: 'out', kind: 'action', label: t('steps.ipo.blocks.b2.nodes.out') },
            { id: 'end', kind: 'end', label: t('steps.ipo.blocks.b2.nodes.end') },
          ],
          caption: t('steps.ipo.blocks.b2.caption'),
        },
      ],
    },
    {
      kind: 'exercise',
      id: 'ex-ipo-match',
      phase: 'guided',
      exercise: {
        id: exerciseId('l01-match-input-processing-output'),
        kind: 'matching',
        prompt: t('exercises.matchInputProcessingOutput.prompt'),
        concept: C.programs,
        dimension: 'understanding',
        hints: [t('exercises.matchInputProcessingOutput.hints.1')],
        explanation: t('exercises.matchInputProcessingOutput.explanation'),
        pairs: [
          {
            left: { id: 'set', label: 'price = 4' },
            right: { id: 'input', label: t('exercises.matchInputProcessingOutput.pairs.input') },
          },
          {
            left: { id: 'calc', label: 'total = price * 3' },
            right: {
              id: 'processing',
              label: t('exercises.matchInputProcessingOutput.pairs.processing'),
            },
          },
          {
            left: { id: 'show', label: 'print(total)' },
            right: { id: 'output', label: t('exercises.matchInputProcessingOutput.pairs.output') },
          },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-tea-order',
      phase: 'practice',
      exercise: {
        id: exerciseId('l01-order-make-tea'),
        kind: 'ordering',
        prompt: t('exercises.orderMakeTea.prompt'),
        concept: C.programs,
        dimension: 'application',
        hints: [t('exercises.orderMakeTea.hints.1')],
        explanation: t('exercises.orderMakeTea.explanation'),
        items: [
          { id: 'fill', label: t('exercises.orderMakeTea.items.fill') },
          { id: 'boil', label: t('exercises.orderMakeTea.items.boil') },
          { id: 'pour', label: t('exercises.orderMakeTea.items.pour') },
          { id: 'wait', label: t('exercises.orderMakeTea.items.wait') },
          { id: 'remove', label: t('exercises.orderMakeTea.items.remove') },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-sum-print',
      phase: 'practice',
      exercise: {
        id: exerciseId('l01-predict-sum-print'),
        kind: 'prediction',
        prompt: t('exercises.predictSumPrint.prompt'),
        concept: C.programs,
        dimension: 'application',
        hints: [t('exercises.predictSumPrint.hints.1')],
        explanation: t('exercises.predictSumPrint.explanation'),
        code: { source: 'a = 3\nb = 4\nprint(a + b)' },
        target: { kind: 'output' },
        expected: '7',
        commonMistakes: {
          'a + b': t('exercises.predictSumPrint.mistakes.m1'),
          '34': t('exercises.predictSumPrint.mistakes.m2'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-debug-total',
      phase: 'practice',
      exercise: {
        id: exerciseId('l01-debug-incomplete-instruction'),
        kind: 'debugging',
        prompt: t('exercises.debugIncompleteInstruction.prompt'),
        concept: C.programs,
        dimension: 'debugging',
        code: { source: 'price = 4\nquantity = 3\ntotal = price\nprint(total)' },
        bugLine: 3,
        hints: [
          t('exercises.debugIncompleteInstruction.hints.1'),
          t('exercises.debugIncompleteInstruction.hints.2'),
        ],
        explanation: t('exercises.debugIncompleteInstruction.explanation'),
        causes: [
          { id: 'order', label: t('exercises.debugIncompleteInstruction.causes.order') },
          { id: 'incomplete', label: t('exercises.debugIncompleteInstruction.causes.incomplete') },
          { id: 'guess', label: t('exercises.debugIncompleteInstruction.causes.guess') },
        ],
        correctCauseId: 'incomplete',
        misconceptions: {
          order: t('exercises.debugIncompleteInstruction.misconceptions.order'),
          guess: t('exercises.debugIncompleteInstruction.misconceptions.guess'),
        },
        fix: {
          source: 'price = 4\nquantity = 3\ntotal = price * quantity\nprint(total)',
          variable: 'total',
          expected: '12',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-literal',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l01-mc-follows-literally'),
        kind: 'multiple-choice',
        prompt: t('exercises.mcFollowsLiterally.prompt'),
        concept: C.programs,
        dimension: 'understanding',
        hints: [],
        explanation: t('exercises.mcFollowsLiterally.explanation'),
        options: [
          { id: 'fixes', label: t('exercises.mcFollowsLiterally.options.fixes') },
          { id: 'literal', label: t('exercises.mcFollowsLiterally.options.literal') },
          { id: 'refuses', label: t('exercises.mcFollowsLiterally.options.refuses') },
        ],
        correctOptionId: 'literal',
        misconceptions: {
          fixes: t('exercises.mcFollowsLiterally.misconceptions.fixes'),
          refuses: t('exercises.mcFollowsLiterally.misconceptions.refuses'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-trace',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l01-predict-start-end'),
        kind: 'prediction',
        prompt: t('exercises.predictStartEnd.prompt'),
        concept: C.programs,
        dimension: 'application',
        hints: [],
        explanation: t('exercises.predictStartEnd.explanation'),
        code: { source: 'print("Start")\nx = 2 * 5\nprint(x)\nprint("End")' },
        target: { kind: 'output' },
        expected: 'Start\n10\nEnd',
        commonMistakes: {
          'Start\nx\nEnd': t('exercises.predictStartEnd.mistakes.m1'),
          'Start\n2 * 5\nEnd': t('exercises.predictStartEnd.mistakes.m2'),
          'Start\nEnd': t('exercises.predictStartEnd.mistakes.m3'),
        },
      },
    },
  ],
};
