import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

export const lesson: Lesson = {
  id: lessonId('algorithms'),
  title: 'Algorithms',
  objective:
    'You will be able to describe an algorithm as a precise recipe, trace the classic list algorithms (sum, count, largest, search) and estimate how much work they do.',
  summary:
    'An algorithm is a finite, precise recipe that solves every problem of one kind. You meet four classic shapes over lists and see how their work grows with the size of the list.',
  minutes: 13,
  concepts: [C.algorithms, C.lists],
  keyPoints: [
    'An algorithm is precise, finite and works for every input of its kind, not just one example.',
    'Most list algorithms share one shape: set a starting value, visit each item, update the value.',
    'To find the largest item, start from the first item, not from 0 — the list might be all negative.',
    'A linear search checks items one by one, so its work grows with the length of the list.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'recipe',
      title: 'A recipe for a whole class of problems',
      blocks: [
        {
          kind: 'paragraph',
          text: 'An algorithm is a precise, finite list of steps that solves a whole kind of problem. "Add up 4, 7 and 2" is one problem; "add up any list of numbers" is the kind an algorithm solves.',
        },
        {
          kind: 'code',
          source: 'total = 0\nfor n in numbers:\n    total = total + n',
          caption: 'Sum: works for any list, short or long.',
        },
        {
          kind: 'paragraph',
          text: 'Most list algorithms have the same shape: set a starting value, visit each item, update the value. Only the starting value and the update change.',
        },
        {
          kind: 'list',
          items: [
            'Sum: start at `0`, add each item.',
            'Count matching: start at `0`, add `1` when an item passes a test.',
            'Largest: start at the first item, replace it when an item is bigger.',
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-shapes',
      title: 'Three algorithms, one loop',
      intro:
        'The same loop runs three algorithms at once: sum, count above a limit, and largest. Change the numbers and watch each result.',
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
          'Make every number negative. Is largest still right? Why does it start at numbers[0]?',
          'Set limit to 20. Why does above become 0 while total does not change?',
          'Make b the same as d. Does largest change on the last item?',
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
        prompt: 'Which of these is an algorithm?',
        concept: C.algorithms,
        dimension: 'understanding',
        hints: ['An algorithm must work for every input of its kind and must finish.'],
        explanation:
          'Comparing each item with the best so far is precise, always finishes, and works for any list. The other options either solve only one case, are vague, or never end.',
        options: [
          { id: 'one', label: 'The answer for [3, 8, 5] is 8' },
          { id: 'vague', label: 'Look at the list and pick a big number' },
          {
            id: 'recipe',
            label: 'Keep the first number; compare each next one and keep the bigger',
          },
          { id: 'forever', label: 'Keep checking numbers until you feel sure' },
        ],
        correctOptionId: 'recipe',
        misconceptions: {
          one: 'That is one answer to one problem. It tells you nothing about the next list.',
          vague:
            '"A big number" is not precise: two people following it could give different answers.',
          forever: '"Until you feel sure" has no clear end, and an algorithm must finish.',
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
        prompt: 'This counts the matching items. What is adults at the end?',
        concept: C.algorithms,
        dimension: 'application',
        hints: [
          'Check each age against the test `a >= 18` and add 1 only when it passes.',
          'Is 18 itself included by `>=`?',
        ],
        explanation:
          '19, 30 and 18 pass `a >= 18`, so adults goes up three times. Counting adds 1 per match, not the item itself.',
        code: {
          source:
            'ages = [12, 19, 30, 17, 18]\nadults = 0\nfor a in ages:\n    if a >= 18:\n        adults = adults + 1',
          highlight: [5],
        },
        target: { kind: 'variable', name: 'adults' },
        expected: '3',
        commonMistakes: {
          '2': '`>=` includes 18 itself, so the last age counts too.',
          '67': 'That adds the ages. Counting adds 1 for each match, not the matching value.',
          '5': 'That is the length of the list. Only items that pass the test are counted.',
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
        prompt:
          'Algorithm Builder: arrange the blocks into an algorithm that finds the largest number in a list. Leave out blocks that do not belong.',
        concept: C.algorithms,
        dimension: 'application',
        hints: [
          'Before comparing anything, max needs a starting value taken from the list.',
          'Comparing and updating happen for each number, then the loop repeats.',
        ],
        explanation:
          'Start max at the first number, then for each next number compare and update when it is bigger, repeating until the list ends. Only then is max known, so it is returned last.',
        blocks: [
          { id: 'start', label: 'Start' },
          { id: 'set', label: 'Set max to the first number' },
          { id: 'read', label: 'Read the next number' },
          { id: 'compare', label: 'Compare it with max' },
          { id: 'update', label: 'If it is bigger, update max' },
          { id: 'repeat', label: 'Repeat until no numbers are left' },
          { id: 'return', label: 'Return max' },
          { id: 'zero', label: 'Set max to 0' },
          { id: 'last', label: 'Return the last number read' },
        ],
        solution: ['start', 'set', 'read', 'compare', 'update', 'repeat', 'return'],
        misconceptions: {
          zero: 'Starting at 0 fails when every number is negative: max would stay 0, which is not in the list.',
          last: 'The last number read is just the end of the list, not necessarily the largest.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'search-cost',
      title: 'Searching, and counting the work',
      blocks: [
        {
          kind: 'paragraph',
          text: 'A linear search asks "is this item the one?" for each item in turn. A `found` flag starts `false` and becomes `true` on a match.',
        },
        {
          kind: 'code',
          source: 'found = false\nfor item in items:\n    if item == target:\n        found = true',
          caption: 'Linear search with a found flag.',
        },
        {
          kind: 'paragraph',
          text: 'Each `==` is one comparison. If the target is missing, every item is checked: 10 items cost 10 comparisons, 1000 items cost 1000. The work grows with n, the length of the list.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: 'A search that stops at the first match is faster when the target is near the front, but in the worst case it still checks all n items.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-search',
      title: 'Count the comparisons',
      intro:
        'This search stops as soon as it finds the target and counts each comparison. Change the target.',
      playground: {
        inputs: [{ name: 'target', type: 'number', initial: 7, min: 0, max: 10 }],
        source:
          'items = [4, 9, 2, 7, 5, 1, 8, 3]\nfound = false\ni = 0\ncomparisons = 0\nwhile i < len(items) and not found:\n    comparisons = comparisons + 1\n    if items[i] == target:\n        found = true\n    else:\n        i = i + 1\nprint("found:", found, "at index", i)\nprint("comparisons:", comparisons)',
        watch: ['found', 'i', 'comparisons'],
        prompts: [
          'Set target to 4. Why is one comparison enough, and why is the index 0?',
          'Set target to 3, then to 6. Both need 8 comparisons. Why?',
          'Which target gives the most work, and what does that depend on?',
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
        prompt: 'This search remembers where it found the target. What is position at the end?',
        concept: C.lists,
        dimension: 'application',
        hints: [
          'Indexes start at 0: items[0] is 3.',
          'The loop does not stop at the first match. What happens at the second 8?',
        ],
        explanation:
          '8 sits at index 1 and at index 3. The loop keeps going after the first match, so position is overwritten with 3.',
        code: {
          source:
            'items = [3, 8, 5, 8]\ntarget = 8\nposition = -1\nfor i in range(len(items)):\n    if items[i] == target:\n        position = i',
          highlight: [6],
        },
        target: { kind: 'variable', name: 'position' },
        expected: '3',
        commonMistakes: {
          '1': 'That is the first match, but the loop does not stop there: the second 8 overwrites position.',
          '4': 'Indexes start at 0, so the fourth item is at index 3.',
          '2': 'Counting from 1, the first 8 is item 2, but indexes start at 0 and the loop keeps going.',
          '-1': '-1 only stays when nothing matches; 8 is in the list.',
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
        prompt:
          'A linear search looks for a name in a list of 1000 names. The name is not in the list. How many comparisons does it make?',
        concept: C.algorithms,
        dimension: 'understanding',
        hints: ['To be sure a name is missing, which items must have been checked?'],
        explanation:
          'A missing item can only be ruled out by checking every item, so the search makes 1000 comparisons. Its work grows with the length of the list.',
        options: [
          { id: 'one', label: '1' },
          { id: 'half', label: '500' },
          { id: 'all', label: '1000' },
          { id: 'ten', label: 'About 10' },
        ],
        correctOptionId: 'all',
        misconceptions: {
          one: 'One comparison only checks the first name; the missing name could still be further on.',
          half: 'About half is the typical cost when the name is present. When it is missing, every name is checked.',
          ten: 'A linear search cannot skip items: it has no way to jump over the ones it has not checked.',
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
        prompt:
          'Complete the count-matching algorithm so passed is the number of scores of 50 or more.',
        concept: C.algorithms,
        dimension: 'application',
        hints: [
          'Should a score of exactly 50 count?',
          'A counter grows by one per match, whatever the score is.',
        ],
        explanation:
          '`>=` includes 50 itself, and the counter grows by 1 per match: 72, 50 and 90 pass, so passed is 3.',
        template:
          'scores = [72, 45, 50, 90, 38]\npassed = 0\nfor s in scores:\n    if s [[cmp]] 50:\n        passed = [[update]]',
        blanks: [
          { id: 'cmp', options: ['>', '>=', '<'], correct: '>=' },
          { id: 'update', options: ['passed + s', '1', 'passed + 1'], correct: 'passed + 1' },
        ],
        check: { variable: 'passed', expected: '3' },
        misconceptions: {
          'cmp:>': '`>` leaves out a score of exactly 50, so passed would be 2.',
          'cmp:<': '`<` counts the scores below 50, the opposite of what is asked.',
          'update:passed + s': 'That adds the scores (a sum), not the number of them (a count).',
          'update:1': 'That sets passed to 1 on every match instead of adding to it.',
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
        prompt:
          'largest should be the warmest temperature, -2. The program gives 0. Which line is wrong, and why?',
        concept: C.algorithms,
        dimension: 'debugging',
        hints: ['Trace largest: does any temperature ever beat its starting value?'],
        explanation:
          'Every temperature is below 0, so none beats the starting value and largest stays 0, a number not even in the list. Starting from `temps[0]` makes the start a real candidate.',
        code: {
          source:
            'temps = [-4, -9, -2, -7]\nlargest = 0\nfor t in temps:\n    if t > largest:\n        largest = t',
        },
        bugLine: 2,
        causes: [
          {
            id: 'start',
            label: 'The starting value is not taken from the list, so it can beat every item',
          },
          { id: 'compare', label: 'The comparison should be < because the numbers are negative' },
          { id: 'skip', label: 'The loop skips the first temperature' },
          { id: 'update', label: 'largest should be updated with largest + t' },
        ],
        correctCauseId: 'start',
        misconceptions: {
          compare: '`<` would find the coldest temperature (-9), not the warmest.',
          skip: '`for t in temps` visits every item, including the first.',
          update: 'Adding would turn the largest-value algorithm into a sum.',
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
        prompt: 'What does this program print?',
        concept: C.lists,
        dimension: 'application',
        hints: [],
        explanation:
          '`range(1, 4)` gives the indexes 1, 2 and 3, so prices[0] is skipped: 3 + 8 + 4 = 15.',
        code: {
          source:
            'prices = [5, 3, 8, 4]\ntotal = 0\nfor i in range(1, len(prices)):\n    total = total + prices[i]\nprint(total)',
        },
        target: { kind: 'output' },
        expected: '15',
        commonMistakes: {
          '20': 'That adds every price, but the range starts at index 1, so prices[0] is skipped.',
          '16': 'That adds indexes 0 to 2. The range is 1, 2, 3: it starts at 1 and stops before 4.',
          '11': 'range(1, 4) includes index 3, so the last price counts.',
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
        prompt: 'Match each problem with the algorithm shape that solves it.',
        concept: C.algorithms,
        dimension: 'understanding',
        hints: [],
        explanation:
          'Adding values is a sum, counting items that pass a test is count matching, keeping the best so far finds the largest, and checking each item for one value is a search.',
        pairs: [
          {
            left: { id: 'spend', label: 'Total money spent this month' },
            right: { id: 'sum', label: 'Sum: start at 0, add each item' },
          },
          {
            left: { id: 'unread', label: 'How many emails are unread' },
            right: { id: 'count', label: 'Count: start at 0, add 1 per match' },
          },
          {
            left: { id: 'best', label: 'The highest score in a game' },
            right: { id: 'largest', label: 'Largest: start at the first item, keep the bigger' },
          },
          {
            left: { id: 'guest', label: 'Is "Ana" on the guest list?' },
            right: { id: 'search', label: 'Search: a found flag set on a match' },
          },
        ],
      },
    },
  ],
};
