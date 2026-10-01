import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

export const lesson: Lesson = {
  id: lessonId('debugging'),
  title: 'Debugging',
  objective:
    'You will be able to find and explain bugs with a method: reproduce, read the message, trace values, form a hypothesis, change one thing and re-test.',
  summary:
    'Debugging is a method, not luck. You practise it on the bug families met in this module: off-by-one, boundaries, overwriting, uninitialised variables, type errors, endless loops and misplaced returns.',
  minutes: 14,
  concepts: [C.debugging],
  keyPoints: [
    'Reproduce the bug first: know the input, the result you expected and the result you got.',
    'The error line is where the program noticed the problem, which is not always where the mistake is.',
    'Trace the values line by line, then test one hypothesis by changing one thing at a time.',
    'Most bugs belong to a few families: off-by-one, boundary, overwrite, missing start value, type mix, endless loop, misplaced return.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'method',
      title: 'A method, not luck',
      blocks: [
        {
          kind: 'paragraph',
          text: 'A bug is a difference between what you expected and what the program does. Guessing and changing lines at random can hide one bug and add two more.',
        },
        {
          kind: 'list',
          items: [
            'Reproduce: find an input that shows the bug every time.',
            'Read the error message and the line it names.',
            'Trace the values: write down each variable after each line.',
            'Form a hypothesis: "I think the loop stops one step early."',
            'Change one thing, then re-test with the same input.',
          ],
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'The bug is where your expectation and the trace first disagree. That line is your suspect.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-trace',
      title: 'Reproduce and trace',
      intro:
        'This program should add up every whole number from 1 to n. For n = 3 the right answer is 1 + 2 + 3 = 6. Reproduce the bug and trace i and total.',
      playground: {
        inputs: [{ name: 'n', type: 'number', initial: 3, min: 1, max: 10 }],
        source:
          'total = 0\nfor i in range(1, n):\n    total = total + i\nprint("sum 1 to", n, "is", total)',
        watch: ['i', 'total'],
        prompts: [
          'With n = 3, what is the last value of i? Is n ever added?',
          'Try n = 1. The answer should be 1. What do you get, and why?',
          'Form a hypothesis: which single change to line 2 would fix every n?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'order-method',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-order-method'),
        kind: 'ordering',
        prompt: 'Put the debugging method in order.',
        concept: C.debugging,
        dimension: 'understanding',
        hints: [
          'You cannot study a bug you cannot make happen.',
          'A change only proves something once you test it again.',
        ],
        explanation:
          'First make the bug happen reliably, then gather evidence (message, trace), then explain it with a hypothesis, test it with one change, and confirm by re-testing.',
        items: [
          { id: 'reproduce', label: 'Reproduce the bug with a known input' },
          { id: 'read', label: 'Read the error message and its line' },
          { id: 'trace', label: 'Trace the values line by line' },
          { id: 'hypothesis', label: 'Form a hypothesis about the cause' },
          { id: 'change', label: 'Change one thing' },
          { id: 'retest', label: 'Re-test with the same input' },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-off-by-one',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-debug-off-by-one'),
        kind: 'debugging',
        prompt:
          'total should be 1 + 2 + 3 + 4 = 10, but the program gives 6. Which line is wrong, and why?',
        concept: C.debugging,
        dimension: 'debugging',
        hints: [
          'Trace i: which values does it take inside the loop?',
          'When i is 4, is the condition true or false?',
        ],
        explanation:
          'When i reaches 4, `i < n` is false, so 4 is never added. `<=` keeps the last number inside the loop: a classic off-by-one.',
        code: {
          source: 'n = 4\ntotal = 0\ni = 1\nwhile i < n:\n    total = total + i\n    i = i + 1',
        },
        bugLine: 4,
        causes: [
          {
            id: 'boundary',
            label: 'The loop stops one step early, so the last number is never added',
          },
          { id: 'start', label: 'i should start at 0 so that more numbers are added' },
          { id: 'overwrite', label: 'total is overwritten on every pass instead of growing' },
          { id: 'step', label: 'i grows too fast and skips numbers' },
        ],
        correctCauseId: 'boundary',
        misconceptions: {
          start: 'Starting at 0 adds 0, which changes nothing: the loop would still stop before 4.',
          overwrite: '`total = total + i` keeps the old total and adds to it, so it does grow.',
          step: 'i goes 1, 2, 3: it grows by one and skips nothing. It just stops too soon.',
        },
        fix: {
          source: 'n = 4\ntotal = 0\ni = 1\nwhile i <= n:\n    total = total + i\n    i = i + 1',
          variable: 'total',
          expected: '10',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'hypothesis',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-test-hypothesis'),
        kind: 'multiple-choice',
        prompt: 'Your hypothesis: "the loop runs one time too few." Which next step tests it best?',
        concept: C.debugging,
        dimension: 'application',
        hints: ['A good test gives clear evidence and changes as little as possible.'],
        explanation:
          'Printing i on every pass shows exactly how many times the loop runs, with nothing else changed. The evidence confirms or rejects the hypothesis.',
        options: [
          { id: 'rewrite', label: 'Rewrite the whole loop in a different way' },
          { id: 'many', label: 'Change the condition, the start value and the update together' },
          { id: 'trace', label: 'Print i on every pass and count the passes' },
          { id: 'rerun', label: 'Run it a few more times without changes' },
        ],
        correctOptionId: 'trace',
        misconceptions: {
          rewrite:
            'A rewrite may hide the bug without telling you what it was, and can add new ones.',
          many: 'If three changes fix it, you do not know which one mattered, or whether two of them cancel out.',
          rerun:
            'The same program with the same input gives the same result: rerunning adds no evidence.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'families',
      title: 'Bug families',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Most bugs belong to a few families. Recognising the family turns "something is wrong" into a concrete hypothesis.',
        },
        {
          kind: 'list',
          items: [
            'Off-by-one or wrong boundary: `<` instead of `<=`, or `len(xs)` used as an index.',
            'Overwrite instead of accumulate: `total = x` instead of `total = total + x`.',
            'Wrong variable updated, or a variable used before it has a value.',
            'Type mix: `"Score: " + 5` needs `str(5)`.',
            'Endless loop: the loop variable never moves towards the stop condition.',
            'Return in the wrong place: inside the loop, so the function stops after one item.',
          ],
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'An error message names the line where the program could not go on. The real mistake is often earlier, for example a variable that was never set.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-error',
      title: 'Read the error message',
      intro:
        'Turn useStr off to make the program fail. Read the message and the line it names, then turn it back on.',
      playground: {
        inputs: [
          { name: 'score', type: 'number', initial: 42, min: 0, max: 100 },
          { name: 'useStr', type: 'boolean', initial: true },
        ],
        source:
          'if useStr:\n    label = "Score: " + str(score)\nelse:\n    label = "Score: " + score\nprint(label)',
        prompts: [
          'Turn useStr off. Which line does the message name, and what does it say to do?',
          'Why does the program not print anything after the error?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-overwrite',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-debug-overwrite'),
        kind: 'debugging',
        prompt: 'total should be 15, the sum of the prices. It is 5. Which line is wrong, and why?',
        concept: C.debugging,
        dimension: 'debugging',
        hints: ['Trace total after each pass: 4, then …?'],
        explanation:
          'total goes 4, 6, 5: each pass replaces it with the current price. Adding to the old total keeps what was already summed.',
        code: { source: 'prices = [4, 6, 5]\ntotal = 0\nfor p in prices:\n    total = p' },
        bugLine: 4,
        causes: [
          { id: 'start', label: 'total should start at the first price instead of 0' },
          { id: 'overwrite', label: 'Each pass replaces total instead of adding to it' },
          { id: 'loop', label: 'The loop only visits the last price' },
        ],
        correctCauseId: 'overwrite',
        misconceptions: {
          start:
            'The start value is fine for a sum; it is lost anyway because line 4 replaces total.',
          loop: 'The loop visits all three prices; the trace shows total taking each one in turn.',
        },
        fix: {
          source: 'prices = [4, 6, 5]\ntotal = 0\nfor p in prices:\n    total = total + p',
          variable: 'total',
          expected: '15',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-return',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-debug-return'),
        kind: 'debugging',
        prompt:
          'count_even should count the even numbers: result should be 3. It is 1. Which line is wrong, and why?',
        concept: C.debugging,
        dimension: 'debugging',
        hints: [
          'Look at the indentation of each line: which block is it part of?',
          'What does `return` do to the loop?',
        ],
        explanation:
          'The `return` is indented inside the loop, so the function ends after the first number. Moved out to the function level, it runs once the loop has finished.',
        code: {
          source:
            'function count_even(numbers):\n    count = 0\n    for n in numbers:\n        if n % 2 == 0:\n            count = count + 1\n        return count\nresult = count_even([2, 4, 5, 6])',
        },
        bugLine: 6,
        causes: [
          { id: 'test', label: '`n % 2 == 0` is the wrong test for even numbers' },
          { id: 'reset', label: 'count is reset to 0 on every pass' },
          {
            id: 'return',
            label: 'The return is inside the loop, so the function stops after one number',
          },
          { id: 'local', label: 'count is local, so result cannot see it' },
        ],
        correctCauseId: 'return',
        misconceptions: {
          test: 'An even number leaves remainder 0 when divided by 2, so the test is right.',
          reset: '`count = 0` is before the loop, so it runs only once.',
          local:
            'count is local, but `return` sends its value out; that is exactly how result gets it.',
        },
        fix: {
          source:
            'function count_even(numbers):\n    count = 0\n    for n in numbers:\n        if n % 2 == 0:\n            count = count + 1\n    return count\nresult = count_even([2, 4, 5, 6])',
          variable: 'result',
          expected: '3',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'trace-wrong-var',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-trace-wrong-variable'),
        kind: 'prediction',
        prompt:
          'The author meant count to count the items (3). Trace the program as it is: what is count at the end?',
        concept: C.debugging,
        dimension: 'application',
        hints: [
          'Make a trace table with columns x, total and count.',
          'Line 5 reads total, not count.',
        ],
        explanation:
          'Line 5 builds count from total instead of from count: after the last pass total is 9, so count is 10. Tracing the real values reveals the wrong variable.',
        code: {
          source:
            'count = 0\ntotal = 0\nfor x in [2, 3, 4]:\n    total = total + x\n    count = total + 1',
          highlight: [5],
        },
        target: { kind: 'variable', name: 'count' },
        expected: '10',
        commonMistakes: {
          '3': 'That is what the author meant. The question is what the program actually does: line 5 uses total.',
          '9': 'That is total. count is total + 1.',
          '4': 'count is not increased by 1 each time; it is replaced by total + 1.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-endless',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-debug-endless-loop'),
        kind: 'debugging',
        prompt:
          'The program should count steps of 2 from 10 down to 0 (steps should be 5). It stops with "Stopped after 5000 steps". Which line is wrong, and why?',
        concept: C.debugging,
        dimension: 'debugging',
        hints: [],
        explanation:
          'n starts at 10 and grows, so `n > 0` stays true forever. Each pass must move n towards the stop condition, which means subtracting.',
        code: { source: 'n = 10\nsteps = 0\nwhile n > 0:\n    steps = steps + 1\n    n = n + 2' },
        bugLine: 5,
        causes: [
          { id: 'condition', label: 'The condition should be n >= 0' },
          { id: 'away', label: 'n moves away from the stop condition, so it is never reached' },
          { id: 'steps', label: 'steps is never updated inside the loop' },
          { id: 'limit', label: '5000 steps is too few for this loop' },
        ],
        correctCauseId: 'away',
        misconceptions: {
          condition:
            'With n growing, `n >= 0` is just as true forever; it also would add an extra pass.',
          steps: 'steps does go up on line 4; the problem is what happens to n.',
          limit: 'No limit is enough: n grows without end, so the loop never finishes.',
        },
        fix: {
          source: 'n = 10\nsteps = 0\nwhile n > 0:\n    steps = steps + 1\n    n = n - 2',
          variable: 'steps',
          expected: '5',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-index',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-debug-last-index'),
        kind: 'debugging',
        prompt:
          'last should be the last name, "Cai". The program stops with "Index 3 is outside the list (valid: 0 to 2)". Which line is wrong, and why?',
        concept: C.debugging,
        dimension: 'debugging',
        hints: [],
        explanation:
          'A list of 3 items has indexes 0, 1 and 2, so the last one is `len(names) - 1`. Using the length itself goes one past the end.',
        code: { source: 'names = ["Ana", "Ben", "Cai"]\nlast = names[len(names)]' },
        bugLine: 2,
        causes: [
          { id: 'short', label: 'The list needs a fourth name' },
          { id: 'len', label: 'len() counts from 0, so it gives the wrong length' },
          { id: 'zero', label: 'Indexes start at 0, so the last index is the length minus 1' },
        ],
        correctCauseId: 'zero',
        misconceptions: {
          short:
            'Adding a name would hide the bug: the code would then return the new name, not "Cai".',
          len: 'len() is right: there are 3 names. It is the indexes that start at 0.',
        },
        fix: {
          source: 'names = ["Ana", "Ben", "Cai"]\nlast = names[len(names) - 1]',
          variable: 'last',
          expected: '"Cai"',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-families',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-match-families'),
        kind: 'matching',
        prompt: 'Match each symptom with the most likely bug family.',
        concept: C.debugging,
        dimension: 'understanding',
        hints: [],
        explanation:
          'Each symptom points to a family: an endless loop hits the step limit, overwriting keeps only the last item, a missing boundary loses one value, mixing text and numbers needs str(), and an unset variable cannot be read.',
        pairs: [
          {
            left: { id: 'limit', label: '"Stopped after 5000 steps"' },
            right: { id: 'endless', label: 'The loop variable never moves towards the stop' },
          },
          {
            left: { id: 'last', label: 'The total always equals the last item' },
            right: { id: 'overwrite', label: 'Overwrite instead of accumulate' },
          },
          {
            left: { id: 'sum', label: 'Adding 1 to 5 gives 10 instead of 15' },
            right: { id: 'offbyone', label: 'Off-by-one: the boundary is left out' },
          },
          {
            left: { id: 'type', label: '"Cannot add text and number"' },
            right: { id: 'str', label: 'Type mix: convert with str()' },
          },
          {
            left: { id: 'unset', label: '"count has no value yet"' },
            right: { id: 'init', label: 'Variable used before it is given a start value' },
          },
        ],
      },
    },
  ],
};
