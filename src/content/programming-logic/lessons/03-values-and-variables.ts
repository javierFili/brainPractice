import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

export const lesson: Lesson = {
  id: lessonId('values-and-variables'),
  title: 'Values and Variables',
  objective:
    'You will be able to track the value of each variable through several assignments and tell numbers, text and true/false apart.',
  summary:
    'A variable is a name for a stored value. Assigning replaces the old value, and the kind of value (number, text, true/false) decides what you can do with it.',
  minutes: 12,
  concepts: [C.variables],
  keyPoints: [
    '`x = 5` stores the value 5 under the name x; a new assignment replaces the old value.',
    '`x = x + 1` first reads x, works out the right side, then stores the result back in x.',
    '5 is a number, "5" is text: `"5" + "5"` is "55". Use `str()` to join a number to text.',
    'Swapping two variables needs a temporary variable, or one value is lost.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'names-and-values',
      title: 'A name for a value',
      blocks: [
        {
          kind: 'paragraph',
          text: 'A variable is a name that holds a value. `score = 10` means "store 10 under the name score". It is an instruction, not a question about whether score equals 10.',
        },
        {
          kind: 'code',
          source: 'score = 10\nscore = 25\nscore = score + 5',
          caption: 'After line 1: 10. Line 2 replaces it: 25. Line 3 reads 25, adds 5, stores 30.',
        },
        {
          kind: 'list',
          items: [
            'A variable holds one value at a time. Assigning again throws the old value away.',
            'In `score = score + 5`, the right side is worked out first with the current value, then the result is stored.',
            'Reading a variable that was never set is an error: the computer has nothing to read.',
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-update',
      title: 'Watch a value change',
      intro: 'Change the starting score and watch how each line reads and replaces values.',
      playground: {
        inputs: [{ name: 'score', type: 'number', initial: 10, min: 0, max: 50 }],
        source: 'score = score + 5\nbonus = score * 2\nscore = 0\nprint(score, bonus)',
        watch: ['score', 'bonus'],
        prompts: [
          'Set score to 20. Predict bonus before running.',
          'Line 3 sets score to 0. Why does bonus keep its value?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-replace',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-mc-assignment-replaces'),
        kind: 'multiple-choice',
        prompt: 'After these two lines, what does x hold?',
        concept: C.variables,
        dimension: 'understanding',
        code: { source: 'x = 5\nx = 8' },
        hints: ['A variable holds one value at a time.'],
        explanation: 'The second assignment replaces the first: 5 is thrown away and x holds 8.',
        options: [
          { id: 'thirteen', label: '13' },
          { id: 'both', label: 'Both 5 and 8' },
          { id: 'eight', label: '8' },
          { id: 'five', label: '5' },
        ],
        correctOptionId: 'eight',
        misconceptions: {
          thirteen: 'Assigning does not add. To add you would write `x = x + 8`.',
          both: 'A variable is not a list. A new value replaces the old one.',
          five: 'The first value does not stay. The later line runs after it and overwrites it.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-read-then-write',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-predict-read-then-write'),
        kind: 'prediction',
        prompt: 'What is the value of points at the end?',
        concept: C.variables,
        dimension: 'application',
        hints: ['Work out the right side of line 2 first, using the value points has right now.'],
        explanation: 'Line 2 reads points (10), adds 5, and stores 15 back in points.',
        code: { source: 'points = 10\npoints = points + 5' },
        target: { kind: 'variable', name: 'points' },
        expected: '15',
        commonMistakes: {
          '10': 'Line 2 also runs: it stores a new value in points.',
          '5': 'The right side is `points + 5`, so the old value is used, not thrown away.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'kinds-of-values',
      title: 'Numbers, text and true/false',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Values come in kinds. `7` is a number, `"7"` is text (the quotes make it text), and `true` / `false` answer yes-or-no questions.',
        },
        {
          kind: 'code',
          source:
            'a = 5 + 5        # 10\nb = "5" + "5"    # "55": text is joined\nc = "Age: " + str(30)   # "Age: 30"',
          caption: '`+` adds numbers but joins text.',
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: '`"Age: " + 30` is an error: text and a number cannot be joined. Turn the number into text first with `str(30)`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: 'To swap a and b, keep a copy first: `temp = a`, then `a = b`, then `b = temp`. Without temp, the old a is lost when line `a = b` runs.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-kinds',
      title: 'Text and numbers together',
      intro: 'Change the name and age. Notice where `str()` is needed and where it is not.',
      playground: {
        inputs: [
          { name: 'name', type: 'text', initial: 'Ana', options: ['Ana', 'Sam', 'Lee'] },
          { name: 'age', type: 'number', initial: 30, min: 0, max: 99 },
        ],
        source:
          'next_year = age + 1\nmessage = name + " will be " + str(next_year)\nprint(message)',
        watch: ['name', 'age', 'next_year', 'message'],
        prompts: [
          'Set age to 17. What is next_year, and what is message?',
          'next_year is a number but message is text. Which part of line 2 turns the number into text?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-match-kinds',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-match-value-kinds'),
        kind: 'matching',
        prompt: 'Match each piece of code with what it is.',
        concept: C.variables,
        dimension: 'understanding',
        hints: ['Look for quotes: they make text. A word without quotes is a name.'],
        explanation:
          '`7` is a number, `"7"` is text because of the quotes, `true` is a true/false value, and `total` without quotes is the name of a variable.',
        pairs: [
          { left: { id: 'num', label: '7' }, right: { id: 'number', label: 'A number' } },
          { left: { id: 'txt', label: '"7"' }, right: { id: 'text', label: 'Text' } },
          {
            left: { id: 'bool', label: 'true' },
            right: { id: 'boolean', label: 'A true/false value' },
          },
          {
            left: { id: 'name', label: 'total' },
            right: { id: 'variable', label: 'The name of a variable' },
          },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-complete-lives',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-complete-lose-a-life'),
        kind: 'code-completion',
        prompt:
          'A player starts with 3 lives and loses one. Complete line 2 so that lives ends at 2.',
        concept: C.variables,
        dimension: 'application',
        hints: ['Read the current value, then take one away.'],
        explanation:
          '`lives - 1` reads the current value (3) and subtracts 1; the result 2 is stored back in lives.',
        template: 'lives = 3\nlives = [[read]] [[op]] 1',
        blanks: [
          { id: 'read', options: ['lives', '"lives"', 'life'], correct: 'lives' },
          { id: 'op', options: ['+', '-', '*'], correct: '-' },
        ],
        check: { variable: 'lives', expected: '2' },
        misconceptions: {
          'read:"lives"':
            'With quotes, "lives" is just the word, not the stored value, and text minus a number is an error.',
          'read:life':
            'There is no variable called life. Reading a name that was never set is an error.',
          'op:+': 'Adding 1 gives 4 lives: the player gains a life instead of losing one.',
          'op:*': 'lives * 1 is still 3: multiplying by 1 changes nothing.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-text-plus',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-predict-text-plus-text'),
        kind: 'prediction',
        prompt: 'What is the value of b?',
        concept: C.variables,
        dimension: 'application',
        hints: ['Look at the quotes. Is this a sum of numbers or text being joined?'],
        explanation:
          '"5" is text, not a number. `+` between two pieces of text joins them, so b is "55".',
        code: { source: 'a = 5 + 5\nb = "5" + "5"' },
        target: { kind: 'variable', name: 'b' },
        expected: '"55"',
        commonMistakes: {
          '10': 'That is a, where 5 and 5 are numbers. In b the quotes make them text, which is joined.',
          '"10"': 'Text is never added up. "5" + "5" glues the two characters together.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-str-rule',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-mc-text-plus-number'),
        kind: 'multiple-choice',
        prompt: 'What happens when this program runs?',
        concept: C.variables,
        dimension: 'debugging',
        code: { source: 'name = "Ana"\nage = 30\nline = name + " is " + age' },
        hints: ['What kind of value is age? What kind is " is "?'],
        explanation:
          'Line 3 tries to join text with the number 30, which is an error. Writing `str(age)` would turn it into the text "30" first.',
        options: [
          { id: 'works', label: 'line becomes "Ana is 30"' },
          { id: 'name', label: 'line becomes "Ana is age"' },
          { id: 'error', label: 'Error on line 3: text and a number cannot be joined' },
          { id: 'quotes', label: 'Error on line 2: 30 needs quotes' },
        ],
        correctOptionId: 'error',
        misconceptions: {
          works:
            'A person would read it that way, but the computer refuses to join text and a number without `str()`.',
          name: 'age has no quotes, so it means the variable. The problem is its kind of value (a number).',
          quotes:
            'Line 2 is fine: storing a number is allowed. The problem only appears when it is joined to text.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-debug-swap',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-debug-swap-without-temp'),
        kind: 'debugging',
        prompt:
          'This program should swap a and b, so that a ends as 2 and b ends as 1. But b ends as 2. Which line is wrong, and why?',
        concept: C.variables,
        dimension: 'debugging',
        code: { source: 'a = 1\nb = 2\ntemp = a\na = b\nb = a' },
        bugLine: 5,
        hints: [],
        explanation:
          'By line 5, a was already replaced by 2 on line 4. The old value of a only survives in temp, so the line must be `b = temp`.',
        causes: [
          { id: 'temp-unused', label: 'It copies the new a instead of the saved old value' },
          { id: 'no-temp', label: 'The temporary variable is not needed' },
          { id: 'order', label: 'Line 3 should come after line 4' },
        ],
        correctCauseId: 'temp-unused',
        misconceptions: {
          'no-temp':
            'Without temp, the original 1 would be lost when `a = b` runs. temp is the only copy of it.',
          order: 'temp must save a before line 4 replaces it, so line 3 is in the right place.',
        },
        fix: {
          source: 'a = 1\nb = 2\ntemp = a\na = b\nb = temp',
          variable: 'b',
          expected: '1',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-trace-memory',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-predict-trace-two-variables'),
        kind: 'prediction',
        prompt: 'Keep track of both variables. What is the value of x at the end?',
        concept: C.variables,
        dimension: 'application',
        hints: [],
        explanation:
          'x = 3, then y = 5, then x = 10, then y = 9. The last line adds the current values: 10 + 9 = 19.',
        code: { source: 'x = 3\ny = x + 2\nx = y * 2\ny = x - 1\nx = x + y' },
        target: { kind: 'variable', name: 'x' },
        expected: '19',
        commonMistakes: {
          '10': 'That is x after line 3. The last line adds y to it once more.',
          '8': 'That uses the first values (3 + 5). By the last line, x and y have both been replaced.',
          '15': 'That adds the current x (10) to an old y (5). Line 4 already changed y to 9.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-x-plus-one',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-mc-count-plus-one'),
        kind: 'multiple-choice',
        prompt: 'What does the line `count = count + 1` do?',
        concept: C.variables,
        dimension: 'understanding',
        hints: [],
        explanation:
          '`=` means "store". The right side is worked out first with the current count, and the result replaces the old value.',
        options: [
          { id: 'check', label: 'It checks whether count equals count + 1' },
          { id: 'second', label: 'It creates a second variable named count' },
          { id: 'never', label: 'Nothing, because a number can never equal itself plus 1' },
          { id: 'update', label: 'It reads count, adds 1 and stores the result in count' },
        ],
        correctOptionId: 'update',
        misconceptions: {
          check: 'In code, `=` is an instruction to store, not a question. Comparing uses `==`.',
          second:
            'There is only one count. The new value replaces the old one under the same name.',
          never:
            'That is true in maths, but here `=` means "store", so the line is a valid update.',
        },
      },
    },
  ],
};
