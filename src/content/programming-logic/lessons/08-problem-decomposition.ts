import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

const lines = (...rows: string[]) => rows.join('\n');

export const lesson: Lesson = {
  id: lessonId('problem-decomposition'),
  title: 'Problem Decomposition',
  objective:
    'You will be able to split a problem into sub-problems with clear inputs and outputs, and connect them as small functions.',
  summary:
    'Big problems become manageable when you split them into small steps. Each step takes an input and produces an output, and the output of one step feeds the next.',
  minutes: 12,
  concepts: [C.decomposition],
  keyPoints: [
    'Describe each sub-problem by its input and its output before writing any code.',
    'Order the sub-problems so each one has the inputs it needs from the earlier ones.',
    'Each sub-problem becomes a small function; the main program connects their results.',
    'A step that solves a different problem is a distraction, and a missing step gives a wrong result.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'break-it-down',
      title: 'One problem, several small ones',
      blocks: [
        {
          kind: 'paragraph',
          text: '"Calculate the price of an order with a discount" is too big to solve in one go. Split it into smaller questions, each with something that goes in and something that comes out.',
        },
        {
          kind: 'list',
          items: [
            'Subtotal: price and quantity in → the amount before discount out.',
            'Discount: the subtotal and whether the buyer is a member in → the amount to take off out.',
            'Final price: the subtotal and the discount in → what the buyer pays out.',
          ],
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'The output of one sub-problem is the input of the next. If you can say what goes in and what comes out, you are ready to write that step.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-order',
      title: 'An order, step by step',
      intro:
        'Each sub-problem is a small function. `final_price` connects them: the subtotal goes into the discount step.',
      playground: {
        inputs: [
          { name: 'price', type: 'number', initial: 20, min: 0, max: 100, step: 5 },
          { name: 'quantity', type: 'number', initial: 3, min: 0, max: 10 },
          { name: 'member', type: 'boolean', initial: true },
        ],
        source: lines(
          'function subtotal(price, quantity):',
          '    return price * quantity',
          '',
          'function discount(amount, member):',
          '    if member:',
          '        return amount * 0.1',
          '    return 0',
          '',
          'function final_price(price, quantity, member):',
          '    base = subtotal(price, quantity)',
          '    return base - discount(base, member)',
          '',
          'total = final_price(price, quantity, member)',
        ),
        watch: ['total'],
        prompts: [
          'Set member to false. Which sub-problem gives a different output now?',
          'Set quantity to 5. Which functions see the new value, and which only see its result?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'e1',
      phase: 'guided',
      exercise: {
        id: exerciseId('l08-mc-sub-problem-io'),
        kind: 'multiple-choice',
        prompt:
          'One sub-problem of the order is "work out the discount". What are its input and its output?',
        concept: C.decomposition,
        dimension: 'understanding',
        hints: ['What do you need to know before you can compute a discount?'],
        explanation:
          'A discount is a share of the amount being paid, so it needs the subtotal as input and produces the amount to take off. The final price is a later step that uses this output.',
        options: [
          { id: 'final-in', label: 'In: the final price · Out: the subtotal' },
          { id: 'names', label: 'In: the names of the items · Out: a printed receipt' },
          { id: 'subtotal-in', label: 'In: the subtotal · Out: the amount to take off' },
          { id: 'nothing', label: 'In: nothing · Out: the final price' },
        ],
        correctOptionId: 'subtotal-in',
        misconceptions: {
          'final-in':
            'That runs the steps backwards: the final price is only known after the discount is.',
          names: 'Item names do not affect the discount; a receipt is a different sub-problem.',
          nothing:
            'A step with no input cannot depend on the order. And the final price is the job of the last step.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e2',
      phase: 'guided',
      exercise: {
        id: exerciseId('l08-build-order-plan'),
        kind: 'block-builder',
        prompt:
          'Build the plan for "the price of an order with a 10% discount". Use only the steps that solve this problem, in order.',
        concept: C.decomposition,
        dimension: 'application',
        hints: [
          'Start from what you have: each item with its price and quantity.',
          'One step answers a question nobody asked.',
        ],
        explanation:
          'Each step uses the output of the previous one: line totals make the subtotal, the subtotal gives the discount, and both give the final price.',
        blocks: [
          { id: 'lines', label: 'Multiply each price by its quantity → line totals' },
          { id: 'sum', label: 'Add up the line totals → subtotal' },
          { id: 'cheapest', label: 'Find the most expensive item → highest price' },
          { id: 'discount', label: 'Take 10% of the subtotal → discount' },
          { id: 'final', label: 'Subtract the discount from the subtotal → final price' },
          { id: 'per-item', label: 'Lower each quantity by 10% → new quantities' },
        ],
        solution: ['lines', 'sum', 'discount', 'final'],
        misconceptions: {
          cheapest:
            'The highest price is never used by any later step. It solves a different problem.',
          'per-item':
            'The discount reduces the price, not how many items are bought. It changes the wrong value.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e3',
      phase: 'guided',
      exercise: {
        id: exerciseId('l08-predict-composed'),
        kind: 'prediction',
        prompt: 'Each sub-problem is a function. What is the value of final?',
        concept: C.decomposition,
        dimension: 'application',
        hints: [
          'Work out subtotal first: it is the input of the next step.',
          'apply_discount returns the amount minus the discount, not the discount itself.',
        ],
        explanation:
          'line_total gives 8 * 5 = 40. apply_discount takes 25% of 40, which is 10, and returns 40 - 10 = 30.',
        code: {
          source: lines(
            'function line_total(price, quantity):',
            '    return price * quantity',
            '',
            'function apply_discount(amount, percent):',
            '    return amount - amount * percent / 100',
            '',
            'subtotal = line_total(8, 5)',
            'final = apply_discount(subtotal, 25)',
          ),
        },
        target: { kind: 'variable', name: 'final' },
        expected: '30',
        commonMistakes: {
          '40': 'That is the subtotal. The second step still takes the discount off it.',
          '10': 'That is the discount itself; the function subtracts it from the amount.',
          '15': 'The discount is a share of the subtotal (40), not the subtotal minus 25.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'inputs-outputs-first',
      title: 'Inputs and outputs before code',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Take "grade a list of scores". Before any code, write each step as a name with what it takes and what it gives back. Then each line of the plan becomes one small function.',
        },
        {
          kind: 'code',
          source: lines(
            '# average(scores)       list of numbers → number',
            '# label(avg, pass_mark) number, number  → "pass" or "fail"',
            '',
            'avg = average(scores)',
            'result = label(avg, pass_mark)',
          ),
          caption:
            'The plan already shows how the steps connect: avg flows from one into the other.',
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'If a step is missing, the program still runs, but the next step receives the wrong kind of value, such as a total where an average was expected.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-grade',
      title: 'Grading in two steps',
      intro:
        'Three scores go into `average`; its output goes into `label`. Change the inputs and see which step reacts.',
      playground: {
        inputs: [
          { name: 's1', type: 'number', initial: 70, min: 0, max: 100 },
          { name: 's2', type: 'number', initial: 40, min: 0, max: 100 },
          { name: 's3', type: 'number', initial: 55, min: 0, max: 100 },
          { name: 'pass_mark', type: 'number', initial: 50, min: 0, max: 100 },
        ],
        source: lines(
          'function average(scores):',
          '    total = 0',
          '    for s in scores:',
          '        total = total + s',
          '    return total / len(scores)',
          '',
          'function label(avg, pass_mark):',
          '    if avg >= pass_mark:',
          '        return "pass"',
          '    return "fail"',
          '',
          'scores = [s1, s2, s3]',
          'avg = average(scores)',
          'result = label(avg, pass_mark)',
        ),
        watch: ['avg', 'result'],
        prompts: [
          'Set pass_mark to 60. Does avg change, or only result?',
          'Set s2 to 10. Which step gives a new output first?',
          'Find scores that make result "pass" with pass_mark 60.',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'e4',
      phase: 'practice',
      exercise: {
        id: exerciseId('l08-order-grade-steps'),
        kind: 'ordering',
        prompt: 'Put the sub-problems of "grade a list of scores" in an order that works.',
        concept: C.decomposition,
        dimension: 'understanding',
        hints: ['For each step, ask: which earlier output does it need?'],
        explanation:
          'Each step needs the output of the step before it: the total gives the average, the average is compared with the pass mark, and that comparison becomes the label.',
        items: [
          { id: 'total', label: 'Add up the scores → total' },
          { id: 'average', label: 'Divide the total by the number of scores → average' },
          { id: 'compare', label: 'Compare the average with 50 → passed (true/false)' },
          { id: 'label', label: 'Turn passed into a word → "pass" or "fail"' },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'e5',
      phase: 'practice',
      exercise: {
        id: exerciseId('l08-complete-compose'),
        kind: 'code-completion',
        prompt:
          'Connect the sub-problems so that pay is the subtotal plus shipping (40). Shipping is free from 50.',
        concept: C.decomposition,
        dimension: 'application',
        hints: ['What does shipping expect as its input: a list of prices or an amount?'],
        explanation:
          'shipping takes an amount, so it must receive the output of subtotal, which is stored in base. 35 is below 50, so shipping returns 5 and pay is 40.',
        template: lines(
          'function subtotal(prices):',
          '    total = 0',
          '    for p in prices:',
          '        total = total + p',
          '    return total',
          '',
          'function shipping(amount):',
          '    if amount >= 50:',
          '        return 0',
          '    return 5',
          '',
          'order = [20, 15]',
          'base = subtotal(order)',
          'pay = base + [[ship]]',
        ),
        blanks: [
          {
            id: 'ship',
            options: ['shipping(order)', 'subtotal(order)', 'shipping(base)', 'shipping(pay)'],
            correct: 'shipping(base)',
          },
        ],
        check: { variable: 'pay', expected: '40' },
        misconceptions: {
          'ship:shipping(order)':
            'shipping expects an amount, but this gives it the list of prices. Its input is the output of subtotal.',
          'ship:subtotal(order)':
            'That works out the subtotal again and adds it twice: 35 + 35 = 70. No shipping is computed.',
          'ship:shipping(pay)':
            'pay is the value being computed on this line, so it has no value yet.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e6',
      phase: 'practice',
      exercise: {
        id: exerciseId('l08-debug-missing-step'),
        kind: 'debugging',
        prompt:
          'The scores 30, 40 and 50 average 40, so result should be "fail". It is "pass". Which line is wrong, and why?',
        concept: C.decomposition,
        dimension: 'debugging',
        hints: ['Check each function: does its output match what the plan says it gives back?'],
        explanation:
          'average skips the step that divides by the number of scores, so it hands 120 to label. With `return total / len(scores)` it outputs 40, which fails.',
        code: {
          source: lines(
            'function average(scores):',
            '    total = 0',
            '    for s in scores:',
            '        total = total + s',
            '    return total',
            '',
            'function label(avg):',
            '    if avg >= 50:',
            '        return "pass"',
            '    return "fail"',
            '',
            'result = label(average([30, 40, 50]))',
          ),
        },
        bugLine: 5,
        causes: [
          { id: 'mark', label: 'label compares with the wrong pass mark' },
          { id: 'nested', label: 'Passing one call as the argument of another loses the value' },
          { id: 'missing', label: 'A step is missing: the total is never divided into an average' },
          { id: 'loop', label: 'The loop skips the last score' },
        ],
        correctCauseId: 'missing',
        misconceptions: {
          mark: '50 is the intended pass mark; the problem is the value label receives.',
          nested:
            'The inner call runs first and its returned value becomes the argument. That part works.',
          loop: 'The loop visits all three scores; total really is 120.',
        },
        fix: {
          source: lines(
            'function average(scores):',
            '    total = 0',
            '    for s in scores:',
            '        total = total + s',
            '    return total / len(scores)',
            '',
            'function label(avg):',
            '    if avg >= 50:',
            '        return "pass"',
            '    return "fail"',
            '',
            'result = label(average([30, 40, 50]))',
          ),
          variable: 'result',
          expected: '"fail"',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e7',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l08-mc-best-split'),
        kind: 'multiple-choice',
        prompt:
          'Problem: "Does a shopping cart get free delivery? It does when the total is at least 50." Which split works?',
        concept: C.decomposition,
        dimension: 'understanding',
        hints: [],
        explanation:
          'The question needs the total first, then a yes/no decision about it. Each step has a clear input and output, and the first output is exactly what the second needs.',
        options: [
          { id: 'one-step', label: 'One step: look at the cart and decide' },
          {
            id: 'total-then-check',
            label: '1. total(prices) → number   2. is_free(total) → true/false',
          },
          {
            id: 'cheapest',
            label: '1. cheapest(prices) → number   2. is_free(cheapest) → true/false',
          },
          {
            id: 'backwards',
            label: '1. is_free(prices) → true/false   2. total(is_free) → number',
          },
        ],
        correctOptionId: 'total-then-check',
        misconceptions: {
          'one-step':
            'That restates the problem without splitting it; it names no inputs or outputs.',
          cheapest: 'The rule is about the total, so the cheapest item solves a different problem.',
          backwards:
            'The decision needs the total, but the total is computed after it, from a true/false value.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e8',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l08-predict-report'),
        kind: 'prediction',
        prompt: 'What does this program print?',
        concept: C.decomposition,
        dimension: 'application',
        hints: [],
        explanation:
          'count_above counts scores strictly above 80: 90 and 85, so high is 2. report uses that output to get low = 4 - 2 = 2 and builds the text.',
        code: {
          source: lines(
            'function count_above(scores, limit):',
            '    count = 0',
            '    for s in scores:',
            '        if s > limit:',
            '            count = count + 1',
            '    return count',
            '',
            'function report(scores):',
            '    high = count_above(scores, 80)',
            '    low = len(scores) - high',
            '    return str(high) + " high, " + str(low) + " other"',
            '',
            'print(report([90, 80, 85, 60]))',
          ),
        },
        target: { kind: 'output' },
        expected: '2 high, 2 other',
        commonMistakes: {
          '3 high, 1 other': '80 is not greater than 80, so it is not counted as high.',
          '2 high, 4 other': 'low is the number of scores minus the high ones: 4 - 2.',
          '2': 'report returns the whole sentence, and that sentence is what gets printed.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'e9',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l08-match-outputs'),
        kind: 'matching',
        prompt: 'Match each sub-problem of a checkout with the output it should give back.',
        concept: C.decomposition,
        dimension: 'understanding',
        hints: [],
        explanation:
          'Knowing the output of each step tells you how the next step can use it: numbers can be added, true/false drives a decision, text is shown.',
        pairs: [
          {
            left: { id: 'subtotal', label: 'subtotal(prices)' },
            right: { id: 'sum', label: 'A number: the sum of the prices' },
          },
          {
            left: { id: 'discount', label: 'discount(subtotal)' },
            right: { id: 'off', label: 'A number: how much to take off' },
          },
          {
            left: { id: 'member', label: 'is_member(name)' },
            right: { id: 'bool', label: 'true or false' },
          },
          {
            left: { id: 'receipt', label: 'receipt_line(name, price)' },
            right: { id: 'text', label: 'Text to show the buyer' },
          },
        ],
      },
    },
  ],
};
