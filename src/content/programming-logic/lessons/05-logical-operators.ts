import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

const code = (...lines: string[]) => lines.join('\n');

export const lesson: Lesson = {
  id: lessonId('logical-operators'),
  title: 'Logical Operators',
  objective:
    'You will be able to combine true/false questions with and, or and not, and translate a rule written in words into a condition.',
  summary:
    'and needs both sides true, or needs at least one, not flips the answer. With them a single condition can express rules like "between 13 and 19" or "free if under 5 or over 65".',
  minutes: 11,
  concepts: [C.booleanLogic],
  keyPoints: [
    '`a and b` is true only when both are true; `a or b` is true when at least one is true.',
    '`not` flips true and false. `not x > 3` means `not (x > 3)`.',
    'A range like "13 to 19" is two comparisons joined with and: `age >= 13 and age <= 19`.',
    'Read the rule aloud: "either … or …" needs or, "both … and …" needs and.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: 'Combining questions',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Real rules often have more than one part: "a teenager is at least 13 and at most 19". Logical operators join several true/false answers into one.',
        },
        {
          kind: 'list',
          items: [
            '`a and b`: true only if both a and b are true',
            '`a or b`: true if at least one of them is true (also when both are)',
            '`not a`: the opposite of a',
          ],
        },
        {
          kind: 'code',
          caption: 'Each side is a full comparison; and joins the two answers.',
          source: code('age = 15', 'teen = age >= 13 and age <= 19'),
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'You cannot write `13 <= age <= 19`. Write both comparisons in full and join them: `age >= 13 and age <= 19`.',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-ages',
      title: 'Two rules, one age',
      intro: 'Change the age and the ticket, and watch each combined answer.',
      playground: {
        inputs: [
          { name: 'age', type: 'number', initial: 15, min: 0, max: 99 },
          { name: 'has_ticket', type: 'boolean', initial: true },
        ],
        source: code(
          'teen = age >= 13 and age <= 19',
          'free = age < 5 or age > 65',
          'can_enter = has_ticket or free',
          'print("teen:", teen)',
          'print("free:", free)',
          'print("can enter:", can_enter)',
        ),
        watch: ['age', 'has_ticket', 'teen', 'free', 'can_enter'],
        prompts: [
          'Try ages 12, 13, 19 and 20. For which ones is teen true?',
          'Find two different ages that make free true.',
          'Turn has_ticket off. Which ages can still enter, and why?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'when-and',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-when-is-and-true'),
        kind: 'multiple-choice',
        prompt: 'When is `a and b` true?',
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: ['"I need a ticket and an ID": when do you get in?'],
        explanation:
          'and is strict: one false side is enough to make the whole thing false. Only true and true gives true.',
        options: [
          { id: 'one', label: 'When at least one of them is true' },
          { id: 'exactly', label: 'When exactly one of them is true' },
          { id: 'both', label: 'Only when both are true' },
          { id: 'neither', label: 'When both are false' },
        ],
        correctOptionId: 'both',
        misconceptions: {
          one: 'That is or. With and, a single false side makes the whole condition false.',
          exactly: 'If only one side is true, the other is false, and and then gives false.',
          neither: 'false and false is false. and never turns false answers into true.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-or',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-predict-or'),
        kind: 'prediction',
        prompt: 'What is the value of outside?',
        concept: C.booleanLogic,
        dimension: 'application',
        hints: ['Answer each side separately: is 3 < 5? Is 3 > 10? Then join them with or.'],
        explanation:
          '3 < 5 is true and 3 > 10 is false. or needs only one true side, so outside is true.',
        code: { source: code('x = 3', 'outside = x < 5 or x > 10') },
        target: { kind: 'variable', name: 'outside' },
        expected: 'true',
        commonMistakes: {
          false:
            'One side (3 > 10) is false, but or is true as soon as one side is true, and 3 < 5 is true.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-not',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-predict-not'),
        kind: 'prediction',
        prompt: 'What is the value of small?',
        concept: C.booleanLogic,
        dimension: 'application',
        hints: ['`not` applies to the whole comparison: first work out 8 > 10, then flip it.'],
        explanation: '`not n > 10` means `not (n > 10)`. 8 > 10 is false, and not false is true.',
        code: { source: code('n = 8', 'small = not n > 10') },
        target: { kind: 'variable', name: 'small' },
        expected: 'true',
        commonMistakes: {
          false: '8 > 10 is false; not flips it, so the result is true.',
        },
      },
    },
    {
      kind: 'explain',
      id: 'translate',
      title: 'From words to conditions',
      blocks: [
        {
          kind: 'paragraph',
          text: 'To turn a rule into code, find the small questions first, then decide how they join. "Free if under 5 or over 65" has two questions: `age < 5` and `age > 65`.',
        },
        {
          kind: 'code',
          caption:
            'Nobody is both under 5 and over 65, so and here would make the rule never true.',
          source: code('free = age < 5 or age > 65'),
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: 'Check your condition with one example that should pass and one that should fail. If no value at all can make it true, you probably used and where or was meant.',
        },
        {
          kind: 'callout',
          tone: 'key',
          text: '`not (a and b)` means "not both": at least one is false, which is `not a or not b`. Flipping a combined question also flips and into or.',
        },
      ],
    },
    {
      kind: 'exercise',
      id: 'complete-comfort',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-complete-comfortable'),
        kind: 'code-completion',
        prompt:
          'A room is comfortable when the temperature is from 18 to 24, both included. Complete the condition (for temp = 30 it must be false).',
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [
          'The temperature must pass both tests at the same time: not too cold and not too hot.',
        ],
        explanation:
          '"From 18 to 24" means at least 18 and at most 24: `temp >= 18 and temp <= 24`. 30 fails the second test, so the result is false.',
        template: code('temp = 30', 'comfortable = temp >= 18 [[join]] temp [[upper]] 24'),
        blanks: [
          { id: 'join', options: ['and', 'or'], correct: 'and' },
          { id: 'upper', options: ['>=', '<='], correct: '<=' },
        ],
        check: { variable: 'comfortable', expected: 'false' },
        misconceptions: {
          'join:or':
            'With or, any temperature of 18 or more passes, so 30 would count as comfortable.',
          'upper:>=': 'The upper limit must keep values at most 24, so it needs `<=`.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'build-price',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-build-ticket-price'),
        kind: 'block-builder',
        prompt:
          'Build a program that sets price to 0 for children under 5 or seniors over 65, and to 8 for everyone else.',
        concept: C.booleanLogic,
        dimension: 'application',
        hints: ['Start with the question, then the yes branch, then else.'],
        explanation:
          'The rule is "under 5 or over 65", so the condition joins `age < 5` and `age > 65` with or. The else branch covers everyone else.',
        blocks: [
          { id: 'ask', label: 'if age < 5 or age > 65:' },
          { id: 'free', label: '    price = 0' },
          { id: 'else', label: 'else:' },
          { id: 'pay', label: '    price = 8' },
          { id: 'and', label: 'if age < 5 and age > 65:' },
          { id: 'flipped', label: 'if age > 5 or age < 65:' },
        ],
        solution: ['ask', 'free', 'else', 'pay'],
        misconceptions: {
          and: 'Nobody is under 5 and over 65 at the same time, so with and nobody would ever get in free.',
          flipped:
            'The comparisons point the wrong way: every age is either over 5 or under 65, so everyone would be free.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-rules',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-match-rules'),
        kind: 'matching',
        prompt: 'Match each rule with the condition that expresses it.',
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: ['"Between" needs both tests; "either" needs one of them.'],
        explanation:
          'A range is two tests joined by and; "either" joins with or; "not both" is not around an and.',
        pairs: [
          {
            left: { id: 'teen', label: 'Age is from 13 to 19' },
            right: { id: 'range', label: '`age >= 13 and age <= 19`' },
          },
          {
            left: { id: 'free', label: 'Under 5 or over 65' },
            right: { id: 'either', label: '`age < 5 or age > 65`' },
          },
          {
            left: { id: 'notboth', label: 'Not both raining and cold' },
            right: { id: 'notand', label: '`not (raining and cold)`' },
          },
          {
            left: { id: 'adultticket', label: 'An adult who has a ticket' },
            right: { id: 'both', label: '`age >= 18 and has_ticket`' },
          },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-weekend',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-debug-weekend'),
        kind: 'debugging',
        prompt:
          'The shop is closed on day 6 and day 7. For day 7 the program says "open". Which line is wrong, and why?',
        concept: C.booleanLogic,
        dimension: 'debugging',
        hints: [],
        explanation:
          'Line 2 asks whether day is 6 and 7 at the same time, which is never true. The rule is "day 6 or day 7", so it needs or.',
        code: {
          source: code(
            'day = 7',
            'if day == 6 and day == 7:',
            '    status = "closed"',
            'else:',
            '    status = "open"',
          ),
        },
        bugLine: 2,
        causes: [
          { id: 'boundary', label: 'It should use `>=` instead of `==`' },
          { id: 'never', label: 'and asks for both at once, which can never be true' },
          { id: 'else', label: 'The else branch catches day 7' },
        ],
        correctCauseId: 'never',
        misconceptions: {
          boundary:
            'The `==` tests are right: day 7 should match 7 exactly. The problem is how the two tests are joined.',
          else: 'else only runs because the condition is false. Fix the condition and else is right again.',
        },
        fix: {
          source: code(
            'day = 7',
            'if day == 6 or day == 7:',
            '    status = "closed"',
            'else:',
            '    status = "open"',
          ),
          variable: 'status',
          expected: '"closed"',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'de-morgan',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-not-both'),
        kind: 'multiple-choice',
        prompt: 'Which condition means the same as `not (hungry and tired)`?',
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: [],
        explanation:
          '"Not both hungry and tired" is true as soon as one of them is false: `not hungry or not tired`.',
        options: [
          { id: 'andnot', label: '`not hungry and not tired`' },
          { id: 'ornot', label: '`not hungry or not tired`' },
          { id: 'or', label: '`hungry or tired`' },
        ],
        correctOptionId: 'ornot',
        misconceptions: {
          andnot:
            'That means "neither hungry nor tired". Being hungry but not tired is also "not both", and this option says false for it.',
          or: 'This is true when you are hungry and tired, exactly the case `not (hungry and tired)` rules out.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-price',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-predict-price'),
        kind: 'prediction',
        prompt: 'What is the value of price?',
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [],
        explanation:
          '70 < 12 is false and member is false, so the first condition is false. 70 >= 65 is true and not member is true, so price is 7.',
        code: {
          source: code(
            'age = 70',
            'member = false',
            'if age < 12 or member:',
            '    price = 5',
            'elif age >= 65 and not member:',
            '    price = 7',
            'else:',
            '    price = 10',
          ),
        },
        target: { kind: 'variable', name: 'price' },
        expected: '7',
        commonMistakes: {
          '10': 'Both parts of the elif are true: 70 >= 65, and member is false so not member is true.',
          '5': 'or needs at least one true side, but 70 < 12 is false and member is false.',
        },
      },
    },
  ],
};
