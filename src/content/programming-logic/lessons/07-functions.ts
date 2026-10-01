import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

const lines = (...rows: string[]) => rows.join('\n');

export const lesson: Lesson = {
  id: lessonId('functions'),
  title: 'Functions',
  objective:
    'You will be able to define a function, call it with arguments, and use the value it returns.',
  summary:
    'A function gives a name to a group of steps. You define it once, call it with values, and it hands a result back with return.',
  minutes: 11,
  concepts: [C.functions],
  keyPoints: [
    'Defining a function runs nothing; its steps run only when it is called.',
    'Arguments fill the parameters in order: the first value goes to the first parameter.',
    '`return` hands a value back to the caller; `print` only shows it, and the call gives `none`.',
    'Variables set inside a function are local: they do not change top-level variables.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'why-functions',
      title: 'Naming a group of steps',
      blocks: [
        {
          kind: 'paragraph',
          text: 'When the same steps are needed in several places, you can give them a name once and reuse that name. The name also says what the steps are for, so the main program reads like a plan.',
        },
        {
          kind: 'code',
          source: lines(
            'function total_price(price, quantity):',
            '    total = price * quantity',
            '    return total',
            '',
            'bill = total_price(4, 3)',
          ),
          caption: 'Lines 1–3 define the function. Line 5 calls it and stores the result, 12.',
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'Defining is not running. The `function` line only remembers the steps; they run when a line calls `total_price(…)`, with `price` set to 4 and `quantity` set to 3.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-call',
      title: 'Call it with different values',
      intro:
        'The function is fixed. You choose the arguments, and the call hands back a different result each time.',
      playground: {
        inputs: [
          { name: 'price', type: 'number', initial: 4, min: 0, max: 20 },
          { name: 'quantity', type: 'number', initial: 3, min: 0, max: 10 },
        ],
        source: lines(
          'function total_price(price, quantity):',
          '    total = price * quantity',
          '    return total',
          '',
          'bill = total_price(price, quantity)',
          'print("Bill:", bill)',
        ),
        watch: ['bill'],
        prompts: [
          'Set quantity to 0. What does the call return now?',
          'Look at which lines ran: the function body runs only after line 5 calls it.',
          'Set price to 10 and quantity to 2. Predict bill before you run it.',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'e1',
      phase: 'guided',
      exercise: {
        id: exerciseId('l07-mc-define-runs-nothing'),
        kind: 'multiple-choice',
        prompt: 'What does this program print?',
        concept: C.functions,
        dimension: 'understanding',
        hints: ['Is there any line that calls `greet(…)`?'],
        explanation:
          'The `function` block only defines `greet`; nothing ever calls it. The only line that runs a print is `print("Start")`.',
        code: {
          source: lines('function greet(name):', '    print("Hello", name)', '', 'print("Start")'),
        },
        options: [
          { id: 'hello-start', label: 'Hello name, then Start' },
          { id: 'start', label: 'Start' },
          { id: 'start-hello', label: 'Start, then Hello' },
          { id: 'error', label: 'An error, because name has no value' },
        ],
        correctOptionId: 'start',
        misconceptions: {
          'hello-start':
            'That treats the definition as if it ran. The body of a function runs only when it is called.',
          'start-hello':
            'A function does not run by itself after the program ends; some line has to call it.',
          error:
            'name only needs a value when the function runs. It never runs here, so nothing reads name.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e2',
      phase: 'guided',
      exercise: {
        id: exerciseId('l07-predict-return'),
        kind: 'prediction',
        prompt: 'What is the value of b?',
        concept: C.functions,
        dimension: 'application',
        hints: [
          'Work out a first: `double(4)` returns 4 * 2.',
          'Then `double(a)` uses the value stored in a.',
        ],
        explanation:
          '`double(4)` returns 8, so a is 8. `double(a)` returns 16, and adding 1 gives 17.',
        code: {
          source: lines(
            'function double(n):',
            '    return n * 2',
            '',
            'a = double(4)',
            'b = double(a) + 1',
          ),
        },
        target: { kind: 'variable', name: 'b' },
        expected: '17',
        commonMistakes: {
          '9': 'That doubles 4 again. The second call receives a, which already holds 8.',
          '16': 'That is what `double(a)` returns; the + 1 still applies to the returned value.',
          '18': 'The + 1 is added after the call returns, not to n inside the function.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e3',
      phase: 'guided',
      exercise: {
        id: exerciseId('l07-match-params'),
        kind: 'matching',
        prompt:
          'A function starts with `function describe(name, age, city):` and is called as `describe("Lima", 30, "Ana")`. Match each parameter with the value it receives.',
        concept: C.functions,
        dimension: 'understanding',
        hints: ['Arguments are matched by position, not by what they look like.'],
        explanation:
          'The first argument goes to the first parameter, the second to the second, and so on. The function cannot know that "Lima" looks like a city.',
        pairs: [
          { left: { id: 'name', label: 'name' }, right: { id: 'lima', label: '"Lima"' } },
          { left: { id: 'age', label: 'age' }, right: { id: 'thirty', label: '30' } },
          { left: { id: 'city', label: 'city' }, right: { id: 'ana', label: '"Ana"' } },
        ],
      },
    },
    {
      kind: 'explain',
      id: 'return-vs-print',
      title: 'Giving a value back',
      blocks: [
        {
          kind: 'paragraph',
          text: '`return` ends the function and hands a value to the line that called it, which can store it or compute with it. `print` only shows a value on the screen; the caller gets nothing back.',
        },
        {
          kind: 'code',
          source: lines(
            'function show_square(x):',
            '    print(x * x)',
            '',
            'function give_square(x):',
            '    return x * x',
            '',
            'shown = show_square(3)',
            'given = give_square(3)',
          ),
          caption: 'Both calls work out 9, but only given stores it. shown is none.',
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'A function without `return` gives back `none`. Variables set inside a function are local: they disappear when it ends and never change a top-level variable with the same name.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-print-return',
      title: 'Print or return?',
      intro:
        'Both functions compute the same square. Watch which variable actually receives the value.',
      playground: {
        inputs: [{ name: 'n', type: 'number', initial: 3, min: -10, max: 10 }],
        source: lines(
          'function show_square(x):',
          '    print(x * x)',
          '',
          'function give_square(x):',
          '    return x * x',
          '',
          'shown = show_square(n)',
          'given = give_square(n)',
          'print("given + 1 is", given + 1)',
        ),
        watch: ['shown', 'given'],
        prompts: [
          'Run it with n = 3. The square is printed once, yet only one variable holds 9. Which one?',
          'Change n to -4. Does shown ever get a value?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'e4',
      phase: 'practice',
      exercise: {
        id: exerciseId('l07-predict-print-vs-return'),
        kind: 'prediction',
        prompt: 'What does this program print? Write one line per print.',
        concept: C.functions,
        dimension: 'application',
        hints: ['What does `half` give back to the line that called it?'],
        explanation:
          'Inside the call, `print(n / 2)` shows 5. The function has no return, so result is none, and the last line prints none.',
        code: {
          source: lines(
            'function half(n):',
            '    print(n / 2)',
            '',
            'result = half(10)',
            'print(result)',
          ),
        },
        target: { kind: 'output' },
        expected: '5\nnone',
        commonMistakes: {
          '5\n5':
            'Printing inside the function does not hand the value back, so result does not hold 5.',
          '5': 'The last line also prints: it shows the value of result, which is none.',
          none: 'The call still runs the function body, and that body prints 5 first.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e5',
      phase: 'practice',
      exercise: {
        id: exerciseId('l07-complete-return'),
        kind: 'code-completion',
        prompt: 'Complete the return so that avg is the average of the two numbers (8).',
        concept: C.functions,
        dimension: 'application',
        hints: ['What has to be done to total to turn a sum of two numbers into their average?'],
        explanation:
          'total holds 16, the sum of the two parameters. Returning `total / 2` hands 8 back to the caller.',
        template: lines(
          'function average(a, b):',
          '    total = a + b',
          '    return [[ret]]',
          '',
          'avg = average(6, 10)',
        ),
        blanks: [
          { id: 'ret', options: ['total', 'total / 2', 'a + b / 2', 'avg'], correct: 'total / 2' },
        ],
        check: { variable: 'avg', expected: '8' },
        misconceptions: {
          'ret:total': 'That returns the sum, 16. The division never happens.',
          'ret:a + b / 2': 'Division runs before addition, so this is 6 + 5 = 11.',
          'ret:avg':
            'avg is the top-level variable that will receive the result; inside the function it has no value yet.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e6',
      phase: 'practice',
      exercise: {
        id: exerciseId('l07-debug-print-not-return'),
        kind: 'debugging',
        prompt:
          'cost should be 60, but it ends up as none even though 60 appears on screen. Which line is wrong, and why?',
        concept: C.functions,
        dimension: 'debugging',
        hints: ['What does the function hand back to line 5?'],
        explanation:
          'Line 3 shows taxed but does not give it back, so the call returns none. `return taxed` hands 60 to cost.',
        code: {
          source: lines(
            'function with_tax(price):',
            '    taxed = price * 1.2',
            '    print(taxed)',
            '',
            'cost = with_tax(50)',
          ),
          highlight: [3, 5],
        },
        bugLine: 3,
        causes: [
          { id: 'name', label: 'The parameter should be called cost so the result reaches cost' },
          { id: 'prints', label: 'The function prints the result instead of returning it' },
          { id: 'math', label: 'The tax calculation multiplies by the wrong number' },
          { id: 'order', label: 'The function is called before its steps have run' },
        ],
        correctCauseId: 'prints',
        misconceptions: {
          name: 'Parameter names are local; renaming one does not send a value back to the caller.',
          math: '50 * 1.2 is 60, which is exactly what is printed. The value is right; it just never comes back.',
          order:
            'The function is defined on lines 1–3 and called on line 5, which is the correct order.',
        },
        fix: {
          source: lines(
            'function with_tax(price):',
            '    taxed = price * 1.2',
            '    return taxed',
            '',
            'cost = with_tax(50)',
          ),
          variable: 'cost',
          expected: '60',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e7',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l07-predict-nested-call'),
        kind: 'prediction',
        prompt: 'What is the value of r?',
        concept: C.functions,
        dimension: 'application',
        hints: [],
        explanation:
          '`sum_of_squares(2, 3)` calls `square(2)`, which returns 4, and `square(3)`, which returns 9. It returns 4 + 9 = 13.',
        code: {
          source: lines(
            'function square(x):',
            '    return x * x',
            '',
            'function sum_of_squares(a, b):',
            '    return square(a) + square(b)',
            '',
            'r = sum_of_squares(2, 3)',
          ),
        },
        target: { kind: 'variable', name: 'r' },
        expected: '13',
        commonMistakes: {
          '25': 'That squares the sum (2 + 3). Each number is squared separately, then the results are added.',
          '5': 'That only adds the arguments; each one passes through square first.',
          '10': 'That doubles instead of squaring: x * x is 2 * 2 and 3 * 3.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e8',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l07-mc-local'),
        kind: 'multiple-choice',
        prompt: 'What does the last line print?',
        concept: C.functions,
        dimension: 'understanding',
        hints: [],
        explanation:
          'The assignment `count = 0` inside `reset` creates a local variable that disappears when the function ends. The top-level count still holds 10.',
        code: {
          source: lines(
            'count = 10',
            '',
            'function reset():',
            '    count = 0',
            '    return count',
            '',
            'value = reset()',
            'print(count)',
          ),
        },
        options: [
          { id: 'zero', label: '0' },
          { id: 'none', label: 'none' },
          { id: 'ten', label: '10' },
          { id: 'error', label: 'An error, because count is set twice' },
        ],
        correctOptionId: 'ten',
        misconceptions: {
          zero: 'value is 0, but count inside the function is local. The top-level count is untouched.',
          none: 'The function returns 0, so nothing here is none, and count was set to 10 at the top.',
          error:
            'Setting a variable again is allowed; here the two counts are even separate variables.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e9',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l07-debug-return-in-loop'),
        kind: 'debugging',
        prompt:
          'cart should be 12, the sum of the prices, but it is 3. Which line is wrong, and why?',
        concept: C.functions,
        dimension: 'debugging',
        hints: [],
        explanation:
          '`return` ends the function immediately. Indented inside the loop, it runs on the first pass with only 3 added; moved out of the loop, it runs after every price is added.',
        code: {
          source: lines(
            'function total(prices):',
            '    amount = 0',
            '    for p in prices:',
            '        amount = amount + p',
            '        return amount',
            '',
            'cart = total([3, 4, 5])',
          ),
        },
        bugLine: 5,
        causes: [
          { id: 'start', label: 'amount should start at the first price, not 0' },
          { id: 'early', label: 'It returns inside the loop, on the first pass' },
          { id: 'add', label: 'The loop adds p to the wrong variable' },
        ],
        correctCauseId: 'early',
        misconceptions: {
          start:
            'Starting at 0 is right for a sum; the problem is that the loop stops after one price.',
          add: 'amount = amount + p is correct; it just only gets to run once.',
        },
        fix: {
          source: lines(
            'function total(prices):',
            '    amount = 0',
            '    for p in prices:',
            '        amount = amount + p',
            '    return amount',
            '',
            'cart = total([3, 4, 5])',
          ),
          variable: 'cart',
          expected: '12',
        },
      },
    },
  ],
};
