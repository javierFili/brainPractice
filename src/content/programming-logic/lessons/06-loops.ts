import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

const code = (...lines: string[]) => lines.join('\n');

export const lesson: Lesson = {
  id: lessonId('loops'),
  title: 'Loops',
  objective:
    'You will be able to trace a while or for loop pass by pass, predict the values it leaves behind, and spot loops that never stop or run one time too few.',
  summary:
    'A loop repeats a block. while repeats as long as a condition is true, so something must change for it to stop. for repeats once per item of a list or range. Accumulators collect a result across the passes.',
  minutes: 12,
  concepts: [C.loops, C.lists],
  keyPoints: [
    'A while loop needs a variable that changes inside the loop and a condition that eventually becomes false.',
    '`for item in list:` runs the block once for each item; `len(list)` tells how many items there are.',
    '`range(1, 5)` gives 1, 2, 3, 4: the end is not included. Use `range(1, 6)` to reach 5.',
    'Accumulator pattern: start with `total = 0` before the loop, then `total = total + x` inside it.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: 'Doing it again',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Writing `print(1)`, `print(2)`, `print(3)` … works for three lines, not for a thousand. A loop says "repeat this block" once, and the computer does the repeating.',
        },
        {
          kind: 'code',
          caption: 'Ask the question, run the block, ask again. Stop when the answer is false.',
          source: code(
            'count = 1',
            'while count <= 3:',
            '    print(count)',
            '    count = count + 1',
          ),
        },
        {
          kind: 'list',
          items: [
            'A starting value: `count = 1`',
            'A stop condition, checked before every pass: `count <= 3`',
            'A change inside the loop that moves toward the stop: `count = count + 1`',
          ],
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'If nothing inside the loop changes the condition, it stays true forever: an infinite loop. Here the program stops it after 5000 steps.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-laps',
      title: 'Change the limit',
      intro: 'Change the limit and watch how many times the loop body runs.',
      playground: {
        inputs: [{ name: 'limit', type: 'number', initial: 3, min: 0, max: 10 }],
        source: code(
          'count = 1',
          'while count <= limit:',
          '    print("lap", count)',
          '    count = count + 1',
          'print("finished, count is", count)',
        ),
        watch: ['limit', 'count'],
        prompts: [
          'Set limit to 5. Predict the last "lap" line before you look.',
          'Set limit to 0. Why does the loop body never run?',
          'After the loop, count is always one more than limit. Why?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'trace-doubling',
      phase: 'guided',
      exercise: {
        id: exerciseId('l06-trace-doubling'),
        kind: 'prediction',
        prompt: 'What is the value of n after the loop?',
        concept: C.loops,
        dimension: 'application',
        hints: ['Write a small table: n before each check, and whether n < 20 is true. 1, 2, 4, …'],
        explanation:
          'n goes 1, 2, 4, 8, 16. 16 < 20 is still true, so one more pass makes n 32. Then 32 < 20 is false and the loop stops.',
        code: { source: code('n = 1', 'while n < 20:', '    n = n * 2') },
        target: { kind: 'variable', name: 'n' },
        expected: '32',
        commonMistakes: {
          '16': 'With n = 16 the condition 16 < 20 is still true, so the loop runs once more.',
          '20': 'n only takes the values 1, 2, 4, 8, 16, 32. It never equals 20; the loop stops at the first value that is not below 20.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'never-stops',
      phase: 'guided',
      exercise: {
        id: exerciseId('l06-never-stops'),
        kind: 'multiple-choice',
        prompt: 'What happens when this program runs?',
        concept: C.loops,
        dimension: 'understanding',
        hints: ['Which line inside the loop changes n?'],
        explanation:
          'Nothing inside the loop changes n, so `n > 0` stays true forever. The loop prints 5 again and again and never ends.',
        code: { source: code('n = 5', 'while n > 0:', '    print(n)') },
        options: [
          { id: 'countdown', label: 'It prints 5, 4, 3, 2, 1' },
          { id: 'once', label: 'It prints 5 once and stops' },
          { id: 'error', label: 'It shows an error before printing anything' },
          { id: 'forever', label: 'It prints 5 over and over and never stops' },
        ],
        correctOptionId: 'forever',
        misconceptions: {
          countdown:
            'A loop does not count down by itself. Only a line like `n = n - 1` would change n.',
          once: 'while is not if: after the body it checks the condition again, and 5 > 0 is still true.',
          error:
            'Every line is valid code. The problem is not the syntax; it is that the loop has no way to stop.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'for-loops',
      title: 'for: one pass per item',
      blocks: [
        {
          kind: 'paragraph',
          text: 'When you already know what to go through, use `for`. It takes each item in turn, puts it in the loop variable and runs the block. A list holds several values in order: `prices = [4, 10, 6]`, and `len(prices)` is 3.',
        },
        {
          kind: 'code',
          caption: 'Accumulator: total starts at 0 and grows by one price on each pass.',
          source: code(
            'prices = [4, 10, 6]',
            'total = 0',
            'for price in prices:',
            '    total = total + price',
            'print(total)',
          ),
        },
        {
          kind: 'paragraph',
          text: '`range(a, b)` makes the numbers from a up to, but not including, b. `range(1, 5)` is 1, 2, 3, 4, and `range(4)` is 0, 1, 2, 3.',
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'Off by one is the classic loop bug: one pass too many or too few. Check the first and last value the loop variable takes.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-sum',
      title: 'Sum up to n',
      intro: 'Change n and watch total grow pass by pass.',
      playground: {
        inputs: [{ name: 'n', type: 'number', initial: 4, min: 1, max: 10 }],
        source: code(
          'total = 0',
          'for i in range(1, n + 1):',
          '    total = total + i',
          'print("sum of 1 to", n, "is", total)',
        ),
        watch: ['n', 'i', 'total'],
        prompts: [
          'Set n to 1. How many passes does the loop make?',
          'Set n to 5. Predict total before running: 1 + 2 + 3 + 4 + 5.',
          'What is i after the loop? Why is it n and not n + 1?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'range-values',
      phase: 'guided',
      exercise: {
        id: exerciseId('l06-range-values'),
        kind: 'prediction',
        prompt: 'What does this program print?',
        concept: C.loops,
        dimension: 'application',
        hints: ['range(1, 4) starts at 1. Is 4 included?'],
        explanation: '`range(1, 4)` gives 1, 2 and 3: the end value 4 is not included.',
        code: { source: code('for i in range(1, 4):', '    print(i)') },
        target: { kind: 'output' },
        expected: '1\n2\n3',
        commonMistakes: {
          '1\n2\n3\n4': 'The end of a range is not included: range(1, 4) stops before 4.',
          '0\n1\n2\n3': 'range(1, 4) starts at its first value, 1. Only range(4) starts at 0.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'complete-average',
      phase: 'practice',
      exercise: {
        id: exerciseId('l06-complete-average'),
        kind: 'code-completion',
        prompt: 'Complete the program so that average is the average of the numbers (4).',
        concept: C.lists,
        dimension: 'application',
        hints: ['An average is the sum divided by how many values there are.'],
        explanation:
          'total starts at 0 and adds each number: 3 + 5 + 2 + 6 = 16. `len(numbers)` is 4, so the average is 16 / 4 = 4.',
        template: code(
          'numbers = [3, 5, 2, 6]',
          'total = [[start]]',
          'for n in numbers:',
          '    total = [[update]]',
          'average = total / [[count]]',
        ),
        blanks: [
          { id: 'start', options: ['1', '0', '3'], correct: '0' },
          { id: 'update', options: ['n', 'total + 1', 'total + n'], correct: 'total + n' },
          { id: 'count', options: ['len(numbers)', '3', 'n'], correct: 'len(numbers)' },
        ],
        check: { variable: 'average', expected: '4' },
        misconceptions: {
          'start:1': 'Starting at 1 adds an extra 1 that is not in the list.',
          'start:3':
            'Starting at 3 counts the first number twice: the loop adds it again on its first pass.',
          'update:n': '`total = n` replaces total on every pass, so only the last number is kept.',
          'update:total + 1': '`total + 1` counts the numbers instead of adding them up.',
          'count:3':
            'There are four numbers, and `len(numbers)` stays correct if the list changes.',
          'count:n': 'After the loop n is the last number (6), not how many numbers there are.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'count-passed',
      phase: 'practice',
      exercise: {
        id: exerciseId('l06-count-passed'),
        kind: 'prediction',
        prompt: 'What is the value of passed after the loop?',
        concept: C.loops,
        dimension: 'application',
        hints: ['Go through the list one score at a time and ask: is it >= 5?'],
        explanation:
          '7, 9 and 5 are at least 5, and 3 is not. passed starts at 0 and goes up by 1 three times.',
        code: {
          source: code(
            'scores = [7, 3, 9, 5]',
            'passed = 0',
            'for s in scores:',
            '    if s >= 5:',
            '        passed = passed + 1',
          ),
        },
        target: { kind: 'variable', name: 'passed' },
        expected: '3',
        commonMistakes: {
          '2': '`>=` includes 5, so the last score counts too.',
          '4': 'The if inside the loop skips 3: only scores of 5 or more are counted.',
          '21': 'passed goes up by 1 each time, it does not add the scores themselves.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-forever',
      phase: 'practice',
      exercise: {
        id: exerciseId('l06-debug-never-ends'),
        kind: 'debugging',
        prompt:
          'This should add 1 + 2 + 3 + 4 + 5 into total (15), but it never finishes. Which line is wrong, and why?',
        concept: C.loops,
        dimension: 'debugging',
        hints: ['Follow n: 1, then 0, then …. Does `n <= 5` ever become false?'],
        explanation:
          'Line 5 makes n smaller, so `n <= 5` stays true forever. Changing it to `n = n + 1` moves n toward the stop condition.',
        code: {
          source: code(
            'n = 1',
            'total = 0',
            'while n <= 5:',
            '    total = total + n',
            '    n = n - 1',
          ),
        },
        bugLine: 5,
        causes: [
          { id: 'start', label: 'total should start at 1' },
          { id: 'away', label: 'n moves away from the stop condition, so the loop never ends' },
          { id: 'condition', label: 'The condition should be `n < 5`' },
        ],
        correctCauseId: 'away',
        misconceptions: {
          start: 'The start value changes the sum, but it cannot make the loop stop.',
          condition:
            'With n going 1, 0, -1, … `n < 5` is just as true forever. The change to n is what is wrong.',
        },
        fix: {
          source: code(
            'n = 1',
            'total = 0',
            'while n <= 5:',
            '    total = total + n',
            '    n = n + 1',
          ),
          variable: 'total',
          expected: '15',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-off-by-one',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l06-debug-off-by-one'),
        kind: 'debugging',
        prompt:
          'total should be 1 + 2 + 3 + 4 + 5 = 15, but it is 10. Which line is wrong, and why?',
        concept: C.loops,
        dimension: 'debugging',
        hints: [],
        explanation:
          '`range(1, 5)` stops before 5, so 5 is never added and total is 10. `range(1, 6)` includes 5.',
        code: {
          source: code(
            'total = 0',
            'for i in range(1, 5):',
            '    total = total + i',
            'print(total)',
          ),
        },
        bugLine: 2,
        causes: [
          { id: 'start', label: 'total should start at 1' },
          { id: 'replace', label: 'It should be `total = i`' },
          { id: 'end', label: 'The range stops one number too early' },
          { id: 'print', label: 'print should be inside the loop' },
        ],
        correctCauseId: 'end',
        misconceptions: {
          start: 'Starting at 1 would give 11, still not 15. The missing 5 is the problem.',
          replace: '`total = i` keeps only the last number and throws the sum away.',
          print: 'Printing inside the loop shows the steps, but the final total is still 10.',
        },
        fix: {
          source: code(
            'total = 0',
            'for i in range(1, 6):',
            '    total = total + i',
            'print(total)',
          ),
          variable: 'total',
          expected: '15',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'trace-steps',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l06-trace-steps'),
        kind: 'prediction',
        prompt: 'What is the value of count after the loop?',
        concept: C.loops,
        dimension: 'application',
        hints: [],
        explanation:
          'n goes 10, 7, 4, 1, -2. The loop runs while n > 0, and 1 > 0 is true, so there are 4 passes before n becomes -2.',
        code: {
          source: code(
            'count = 0',
            'n = 10',
            'while n > 0:',
            '    n = n - 3',
            '    count = count + 1',
          ),
        },
        target: { kind: 'variable', name: 'count' },
        expected: '4',
        commonMistakes: {
          '3': 'At n = 1 the condition 1 > 0 is still true, so there is a fourth pass.',
          '-2': 'That is n after the loop. count goes up by 1 on every pass.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'pick-range',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l06-pick-range'),
        kind: 'multiple-choice',
        prompt: 'You want to print the numbers 1 to 5. Which loop header is right?',
        concept: C.loops,
        dimension: 'understanding',
        hints: [],
        explanation:
          'A range stops before its end value, so to include 5 the end must be 6: `range(1, 6)` gives 1, 2, 3, 4, 5.',
        options: [
          { id: 'six', label: '`for i in range(1, 6):`' },
          { id: 'five', label: '`for i in range(1, 5):`' },
          { id: 'zero', label: '`for i in range(0, 5):`' },
          { id: 'short', label: '`for i in range(5):`' },
        ],
        correctOptionId: 'six',
        misconceptions: {
          five: 'The end is not included: range(1, 5) gives 1, 2, 3, 4 and misses 5.',
          zero: 'This also makes five passes, but the numbers are 0 to 4, not 1 to 5.',
          short: 'range(5) is the same as range(0, 5): 0, 1, 2, 3, 4.',
        },
      },
    },
  ],
};
