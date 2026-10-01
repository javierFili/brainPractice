import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

export const lesson: Lesson = {
  id: lessonId('instructions-and-sequences'),
  title: 'Instructions and Sequences',
  objective:
    'You will be able to trace a short program line by line and explain why changing the order of its lines changes the result.',
  summary:
    'Programs run from top to bottom, one line at a time. Each line works with what the lines before it left behind, so order matters.',
  minutes: 11,
  concepts: [C.sequence],
  keyPoints: [
    'The computer runs lines from top to bottom, each line once.',
    'Each line works with the values the previous lines left behind.',
    'Swapping two lines can change the result, even if every line is correct on its own.',
    'To trace a program, write down the values after every line.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'top-to-bottom',
      title: 'One line at a time, top to bottom',
      blocks: [
        {
          kind: 'paragraph',
          text: 'A sequence is a list of instructions that run one after another. The computer starts at the first line, finishes it, then moves to the next one.',
        },
        {
          kind: 'code',
          source: 'x = 1\nx = x + 3\nx = x * 2\nprint(x)',
          caption: 'Trace: after line 1, x is 1. After line 2, x is 4. After line 3, x is 8.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: 'Tracing means acting like the computer: go line by line and write down every value as it changes. Do not jump ahead to the end.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-add-then-double',
      title: 'Add, then double',
      intro:
        'This program adds 3 and then doubles. Change the starting number and watch each line.',
      playground: {
        inputs: [{ name: 'start', type: 'number', initial: 1, min: 0, max: 10 }],
        source: 'x = start\nx = x + 3\nx = x * 2\nprint(x)',
        watch: ['start', 'x'],
        prompts: [
          'Set start to 2. Before running, trace it on paper: what does it print?',
          'Set start to 0. Why is the result 6 and not 0?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-run-order',
      phase: 'guided',
      exercise: {
        id: exerciseId('l02-mc-run-order'),
        kind: 'multiple-choice',
        prompt:
          'A program has five lines and no special instructions. How does the computer run it?',
        concept: C.sequence,
        dimension: 'understanding',
        hints: [
          'Think of reading a recipe: where do you start, and how often do you do each step?',
        ],
        explanation:
          'Without special instructions, a program is a plain sequence: the computer runs line 1, then line 2, and so on, each line exactly once.',
        options: [
          { id: 'important', label: 'The most important line first, then the rest' },
          { id: 'sequence', label: 'From top to bottom, each line once' },
          { id: 'together', label: 'All five lines at the same moment' },
          { id: 'bottom', label: 'From the last line up to the first' },
        ],
        correctOptionId: 'sequence',
        misconceptions: {
          important:
            'The computer has no idea which line matters most. It only follows the order you wrote.',
          together:
            'Lines run one after another. That is why a line can use a value that an earlier line produced.',
          bottom:
            'The last line often shows the result, but it runs last, after everything it depends on.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-trace-x',
      phase: 'guided',
      exercise: {
        id: exerciseId('l02-predict-trace-x'),
        kind: 'prediction',
        prompt: 'Trace the program. What is the value of x at the end?',
        concept: C.sequence,
        dimension: 'application',
        hints: ['Write down x after each line.', 'Line 3 doubles whatever x holds after line 2.'],
        explanation: 'x starts at 5, line 2 makes it 6, and line 3 doubles that 6 into 12.',
        code: { source: 'x = 5\nx = x + 1\nx = x * 2' },
        target: { kind: 'variable', name: 'x' },
        expected: '12',
        commonMistakes: {
          '11': 'That is 5 * 2 + 1: doubling first. But the + 1 line comes first, so it runs first.',
          '6': 'You stopped after line 2. Line 3 still runs and doubles x.',
          '10': 'Line 3 doubles the current x (6), not the starting value 5.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'order-matters',
      title: 'Order changes the result',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Here are the same two instructions as before, swapped. Every line is still correct, but the program now doubles first and adds 3 afterwards.',
        },
        {
          kind: 'code',
          source: 'x = 1\nx = x * 2\nx = x + 3\nprint(x)',
          caption: 'Trace: 1, then 2, then 5. The other order gave 8.',
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'A line uses the values that exist at the moment it runs. Move it, and it sees different values.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-double-then-add',
      title: 'Double, then add',
      intro:
        'Same instructions, opposite order. Try the same starting numbers as in the first playground and compare.',
      playground: {
        inputs: [{ name: 'start', type: 'number', initial: 1, min: 0, max: 10 }],
        source: 'x = start\nx = x * 2\nx = x + 3\nprint(x)',
        watch: ['start', 'x'],
        prompts: [
          'Set start to 2. The other order printed 10. What does this one print?',
          'Set start to 0. Why does this order give 3 instead of 6?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-order-teeth',
      phase: 'guided',
      exercise: {
        id: exerciseId('l02-order-brush-teeth'),
        kind: 'ordering',
        prompt: 'Put the steps for brushing your teeth in an order that works.',
        concept: C.sequence,
        dimension: 'understanding',
        hints: ['Which step needs another step to be done first?'],
        explanation:
          'You must hold the brush before you can put toothpaste on it, and it needs toothpaste before brushing. The brush is rinsed after brushing, and only a clean brush goes back.',
        items: [
          { id: 'pick', label: 'Pick up the toothbrush' },
          { id: 'paste', label: 'Put toothpaste on the brush' },
          { id: 'brush', label: 'Brush for two minutes' },
          { id: 'rinse', label: 'Rinse the toothbrush under the tap' },
          { id: 'back', label: 'Put the clean toothbrush back in its cup' },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-order-code',
      phase: 'practice',
      exercise: {
        id: exerciseId('l02-order-code-chain'),
        kind: 'ordering',
        prompt: 'Put these lines in an order that runs without errors and prints 20.',
        concept: C.sequence,
        dimension: 'application',
        hints: [
          'A variable must be set before a line can read it.',
          'Find the line that uses no other variable: it must come first.',
        ],
        explanation:
          '`b` needs `a`, and `c` needs `b`, so they must be set in that order. Printing comes last: (2 + 3) * 4 = 20.',
        items: [
          { id: 'a', label: 'a = 2' },
          { id: 'b', label: 'b = a + 3' },
          { id: 'c', label: 'c = b * 4' },
          { id: 'print', label: 'print(c)' },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-build-temperature',
      phase: 'practice',
      exercise: {
        id: exerciseId('l02-build-celsius-to-fahrenheit'),
        kind: 'block-builder',
        prompt:
          'Build a program that converts 20 °C to Fahrenheit and prints it. The rule: multiply by 9, divide by 5, then add 32. Not every block belongs.',
        concept: C.sequence,
        dimension: 'application',
        hints: [
          'Follow the rule in its order: first the multiply-and-divide step, then the + 32 step.',
          'Two blocks are not part of the rule.',
        ],
        explanation:
          'Set the temperature, apply the rule in its order (20 * 9 / 5 = 36, then 36 + 32 = 68), and print the result last.',
        blocks: [
          { id: 'set', label: 'celsius = 20' },
          { id: 'scale', label: 'f = celsius * 9 / 5' },
          { id: 'shift', label: 'f = f + 32' },
          { id: 'show', label: 'print(f)' },
          { id: 'minus', label: 'f = f - 32' },
          { id: 'early', label: 'print(celsius)' },
        ],
        solution: ['set', 'scale', 'shift', 'show'],
        misconceptions: {
          minus: 'Subtracting 32 is the rule for the other direction (Fahrenheit to Celsius).',
          early: 'This prints the starting temperature, 20, not the converted result.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-debug-stale',
      phase: 'practice',
      exercise: {
        id: exerciseId('l02-debug-skips-step'),
        kind: 'debugging',
        prompt:
          'A shirt costs 50. A coupon takes off 10, then shipping adds 5, so total should be 45. The program gives 55. Which line is wrong, and why?',
        concept: C.sequence,
        dimension: 'debugging',
        code: { source: 'price = 50\nprice = price - 10\ntotal = 50 + 5' },
        bugLine: 3,
        hints: ['Trace: what does price hold after line 2?', 'Does line 3 use that result?'],
        explanation:
          'Line 2 leaves price at 40, but line 3 starts again from 50 and ignores that result. It must build on the previous step: `total = price + 5`.',
        causes: [
          { id: 'ignores', label: 'It ignores the result of the coupon step' },
          { id: 'coupon', label: 'The coupon line runs too late' },
          { id: 'shipping', label: 'Shipping should be subtracted, not added' },
        ],
        correctCauseId: 'ignores',
        misconceptions: {
          coupon:
            'The coupon line runs before line 3 and works: price becomes 40. Line 3 just never reads it.',
          shipping: 'Shipping really does add to the cost. The problem is what it is added to.',
        },
        fix: {
          source: 'price = 50\nprice = price - 10\ntotal = price + 5',
          variable: 'total',
          expected: '45',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-print-moments',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l02-predict-print-moments'),
        kind: 'prediction',
        prompt: 'What does this program print? Write one line per print.',
        concept: C.sequence,
        dimension: 'application',
        hints: [],
        explanation:
          'Each `print` shows n at the moment it runs: 1 first, then 2 after adding 1, then 20 after multiplying by 10.',
        code: { source: 'n = 1\nprint(n)\nn = n + 1\nprint(n)\nn = n * 10\nprint(n)' },
        target: { kind: 'output' },
        expected: '1\n2\n20',
        commonMistakes: {
          '20\n20\n20':
            'A print does not wait for the end. It shows the value n has when that line runs.',
          '20': 'There are three print lines, and each one runs once, so three lines appear.',
          '1\n2\n10': 'The last step multiplies the current n (2) by 10, giving 20.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-swap-lines',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l02-mc-swapped-lines'),
        kind: 'multiple-choice',
        prompt:
          'Program B is program A with its last two lines swapped. What value does each one end with?',
        concept: C.sequence,
        dimension: 'understanding',
        code: {
          source:
            '# Program A\nx = 2\nx = x * 3\nx = x + 1\n# Program B\ny = 2\ny = y + 1\ny = y * 3',
        },
        hints: [],
        explanation:
          'A multiplies first: 2 * 3 = 6, then 6 + 1 = 7. B adds first: 2 + 1 = 3, then 3 * 3 = 9. Same lines, different order, different result.',
        options: [
          { id: 'same', label: 'Both end with 7' },
          { id: 'reversed', label: 'A ends with 9, B ends with 7' },
          { id: 'error', label: 'B stops with an error' },
          { id: 'right', label: 'A ends with 7, B ends with 9' },
        ],
        correctOptionId: 'right',
        misconceptions: {
          same: 'The lines are the same, but each one sees different values when the order changes.',
          reversed: 'Trace A again: it multiplies first (6), then adds 1, so it ends with 7.',
          error:
            'Every line in B reads a value that is already set, so nothing goes wrong. Only the result changes.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-no-recalc',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l02-predict-no-recalculation'),
        kind: 'prediction',
        prompt: 'Trace carefully. What is the value of c at the end?',
        concept: C.sequence,
        dimension: 'application',
        hints: [],
        explanation:
          'Line 2 runs once, while a is 3, so b becomes 6. Line 3 changes a to 10 but does not rerun line 2. So c = 10 + 6 = 16.',
        code: { source: 'a = 3\nb = a * 2\na = 10\nc = a + b' },
        target: { kind: 'variable', name: 'c' },
        expected: '16',
        commonMistakes: {
          '30': 'b was calculated once on line 2, when a was 3. Changing a later does not update b.',
          '9': 'Line 3 sets a to 10 before line 4 runs, so line 4 uses 10, not 3.',
        },
      },
    },
  ],
};
