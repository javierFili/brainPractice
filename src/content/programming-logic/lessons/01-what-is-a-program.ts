import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

export const lesson: Lesson = {
  id: lessonId('what-is-a-program'),
  title: 'What is a Program?',
  objective:
    'You will be able to explain what a program is and predict what a tiny program prints.',
  summary:
    'A program is a precise recipe: the computer follows each instruction literally, in order, turning input into output.',
  minutes: 10,
  concepts: [C.programs],
  keyPoints: [
    'A program is a list of precise instructions; the computer does exactly what they say, nothing more.',
    'Most programs follow the same shape: input → processing → output.',
    'An instruction that is vague or incomplete gives the wrong result, even if a person would "know what you meant".',
    '`print(...)` shows a value; text in quotes is shown as written.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'recipe',
      title: 'A program is a precise recipe',
      blocks: [
        {
          kind: 'paragraph',
          text: 'A program is a list of instructions for a computer. The computer follows them literally: it never guesses what you meant.',
        },
        {
          kind: 'paragraph',
          text: '"Make tea" is fine for a person, but far too vague for a computer. It needs every step spelled out:',
        },
        {
          kind: 'list',
          items: [
            'Fill the kettle with water.',
            'Switch the kettle on and wait until it boils.',
            'Put a tea bag in the cup.',
            'Pour the hot water into the cup.',
          ],
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'If a step is missing or unclear, the computer will not fill the gap. Precision is your job.',
        },
        {
          kind: 'code',
          source: 'price = 4\nquantity = 3\ntotal = price * quantity\nprint("Total:", total)',
          caption:
            'A tiny program: four exact instructions. `*` means multiply; `print` shows a result.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-shop',
      title: 'Run a real program',
      intro:
        'Change the input values and run the program. The instructions stay the same; only the data changes.',
      playground: {
        inputs: [
          { name: 'price', type: 'number', initial: 4, min: 0, max: 20 },
          { name: 'quantity', type: 'number', initial: 3, min: 0, max: 10 },
        ],
        source: 'total = price * quantity\nprint("Total:", total)',
        watch: ['price', 'quantity', 'total'],
        prompts: [
          'Set quantity to 5. Before running, predict what the program prints.',
          'Set price to 0. What is the output, and why?',
          'Set quantity to 0. Did any instruction change, or only the data?',
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
        prompt: 'A robot must water a plant. Which instruction could it follow without guessing?',
        concept: C.programs,
        dimension: 'understanding',
        hints: ['Ask yourself: does the robot know exactly what to do, how much, and where?'],
        explanation:
          'Only this instruction says what to use, how much and where to put it. The others rely on the robot guessing what "some", "properly" or "when needed" mean.',
        options: [
          { id: 'some', label: 'Give the plant some water.' },
          { id: 'properly', label: 'Look after the plant properly.' },
          { id: 'exact', label: 'Pour 200 ml of water into the pot.' },
          { id: 'needed', label: 'Water the plant when it needs it.' },
        ],
        correctOptionId: 'exact',
        misconceptions: {
          some: '"Some" is not an amount. A computer cannot decide between a drop and a bucket.',
          properly:
            '"Properly" makes sense to a person, but it does not say a single action the robot can carry out.',
          needed:
            'This hides the hard part: how does the robot know when the plant needs water? That rule is missing.',
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
        prompt: 'What does this program print? Write one line per print.',
        concept: C.programs,
        dimension: 'application',
        hints: [
          'The computer runs the lines from top to bottom.',
          'Text in quotes is printed exactly as written, without the quotes.',
        ],
        explanation:
          'The first line prints `Hello`, then the second line prints `World`. Each `print` shows its text on its own line, in the order the lines appear.',
        code: { source: 'print("Hello")\nprint("World")' },
        target: { kind: 'output' },
        expected: 'Hello\nWorld',
        commonMistakes: {
          'Hello World':
            'Each `print` writes its own line, so the two words appear on separate lines.',
          'World\nHello': 'The computer starts at the top: `Hello` is printed first.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'ipo',
      title: 'Input → processing → output',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Almost every program takes some data (input), works with it (processing) and shows a result (output).',
        },
        {
          kind: 'flow',
          nodes: [
            { id: 'start', kind: 'start', label: 'Start' },
            { id: 'in', kind: 'action', label: 'Input: price = 4, quantity = 3' },
            { id: 'work', kind: 'action', label: 'Processing: total = price * quantity' },
            { id: 'out', kind: 'action', label: 'Output: print(total) shows 12' },
            { id: 'end', kind: 'end', label: 'End' },
          ],
          caption: 'The shape of a small shopping program.',
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
        prompt: 'Match each line of the shopping program with its role.',
        concept: C.programs,
        dimension: 'understanding',
        hints: ['Input is the starting data, processing works with it, output shows the result.'],
        explanation:
          '`price = 4` gives the program its data, `total = price * 3` calculates with it, and `print(total)` shows the result to the user.',
        pairs: [
          {
            left: { id: 'set', label: 'price = 4' },
            right: { id: 'input', label: 'Input: the data the program starts with' },
          },
          {
            left: { id: 'calc', label: 'total = price * 3' },
            right: { id: 'processing', label: 'Processing: working out something new' },
          },
          {
            left: { id: 'show', label: 'print(total)' },
            right: { id: 'output', label: 'Output: showing the result' },
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
        prompt: 'Put the precise "make tea" instructions in an order a machine could follow.',
        concept: C.programs,
        dimension: 'application',
        hints: ['A step can only happen once the thing it needs is ready.'],
        explanation:
          'Each step needs the one before it: water must be in the kettle before it boils, it must boil before it is poured, and the tea needs time to brew before the bag comes out.',
        items: [
          { id: 'fill', label: 'Fill the kettle with water' },
          { id: 'boil', label: 'Switch the kettle on and wait until it boils' },
          { id: 'pour', label: 'Pour the boiling water over the tea bag in the cup' },
          { id: 'wait', label: 'Wait 3 minutes' },
          { id: 'remove', label: 'Take the tea bag out' },
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
        prompt: 'What does this program print?',
        concept: C.programs,
        dimension: 'application',
        hints: ['`print(a + b)` works out `a + b` first, then shows the result.'],
        explanation:
          '`a` holds 3 and `b` holds 4. The computer calculates `a + b` = 7 and prints the number, not the formula.',
        code: { source: 'a = 3\nb = 4\nprint(a + b)' },
        target: { kind: 'output' },
        expected: '7',
        commonMistakes: {
          'a + b':
            'Without quotes, `a + b` is a calculation, not text. The computer prints its result.',
          '34': '`+` between two numbers adds them; it does not stick the digits together.',
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
        prompt:
          'This program should work out the cost of 3 items at 4 each (12), but it gives 4. Which line is wrong, and why?',
        concept: C.programs,
        dimension: 'debugging',
        code: { source: 'price = 4\nquantity = 3\ntotal = price\nprint(total)' },
        bugLine: 3,
        hints: [
          'Follow the program line by line and write down what `total` holds.',
          'Is `quantity` ever used?',
        ],
        explanation:
          'Line 3 only copies the price into `total`; it never says to multiply by the quantity. The computer does exactly what the line says, so the fix is `total = price * quantity`.',
        causes: [
          { id: 'order', label: 'print runs before total is calculated' },
          { id: 'incomplete', label: 'The instruction never says to use the quantity' },
          { id: 'guess', label: 'The computer forgot what quantity means' },
        ],
        correctCauseId: 'incomplete',
        misconceptions: {
          order: '`print(total)` is the last line, so `total` is already set when it runs.',
          guess:
            'The computer still has `quantity = 3` stored. It simply was never told to use it.',
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
        prompt:
          'A program should print the total of a bill, but one instruction forgets to add the tip. What does the computer do?',
        concept: C.programs,
        dimension: 'understanding',
        hints: [],
        explanation:
          'A computer follows the instructions literally. It has no idea a tip was intended, so it calculates and prints the total without it.',
        options: [
          { id: 'fixes', label: 'It notices the tip is missing and adds it' },
          { id: 'literal', label: 'It prints the total without the tip' },
          { id: 'refuses', label: 'It stops because the instructions are incomplete' },
        ],
        correctOptionId: 'literal',
        misconceptions: {
          fixes:
            'The computer does not know what you intended; it only knows what the instructions say.',
          refuses:
            "The instructions are complete from the computer's point of view: each line is valid, so it runs them. Only you know a step is missing.",
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
        prompt: 'What does this program print? Write one line per print.',
        concept: C.programs,
        dimension: 'application',
        hints: [],
        explanation:
          'The lines run in order: `Start` is printed, `x` is set to 2 * 5 = 10, `print(x)` shows the value 10, then `End` is printed.',
        code: { source: 'print("Start")\nx = 2 * 5\nprint(x)\nprint("End")' },
        target: { kind: 'output' },
        expected: 'Start\n10\nEnd',
        commonMistakes: {
          'Start\nx\nEnd':
            '`x` has no quotes, so `print(x)` shows the value stored in `x`, not the letter x.',
          'Start\n2 * 5\nEnd': 'Line 2 calculates `2 * 5` and stores the result, 10.',
          'Start\nEnd': 'Line 2 prints nothing, but line 3 does: it shows the value of `x`.',
        },
      },
    },
  ],
};
