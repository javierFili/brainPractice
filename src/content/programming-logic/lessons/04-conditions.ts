import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { C } from '../concepts';

const code = (...lines: string[]) => lines.join('\n');

export const lesson: Lesson = {
  id: lessonId('conditions'),
  title: 'Conditions',
  objective:
    'You will be able to predict which branch of an if / elif / else runs for a given value, including values right on the boundary.',
  summary:
    'Programs make decisions by asking true/false questions. if / else picks exactly one path, elif chains are checked from top to bottom, and boundaries (>= vs >) decide the edge cases.',
  minutes: 11,
  concepts: [C.conditions],
  keyPoints: [
    'A condition is a question whose answer is true or false, such as `age >= 18`.',
    'if / else runs exactly one of its branches, never both and never neither.',
    'In an elif chain the conditions are checked top to bottom and the first true one wins, so order matters.',
    'Check the boundary value: `>` leaves it out, `>=` includes it.',
  ],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: 'A program that decides',
      blocks: [
        {
          kind: 'paragraph',
          text: 'So far every line ran, top to bottom. A condition lets a program ask a question and choose what to do next. The answer to that question is always `true` or `false`.',
        },
        {
          kind: 'flow',
          caption: 'One question, two possible paths. Only one of them is taken.',
          nodes: [
            { id: 'start', kind: 'start', label: 'START' },
            { id: 'get', kind: 'action', label: 'GET AGE' },
            { id: 'ask', kind: 'decision', label: 'AGE >= 18?', yes: 'adult', no: 'minor' },
            { id: 'adult', kind: 'action', label: 'status = "adult"' },
            { id: 'minor', kind: 'action', label: 'status = "minor"' },
            { id: 'end', kind: 'end', label: 'END' },
          ],
        },
        {
          kind: 'code',
          caption: 'The same decision as code. The indented lines belong to their branch.',
          source: code(
            'age = 20',
            'if age >= 18:',
            '    status = "adult"',
            'else:',
            '    status = "minor"',
          ),
        },
        {
          kind: 'list',
          items: [
            '`==` equal to (one `=` stores a value, two `==` ask a question)',
            '`!=` not equal to',
            '`<` less than, `<=` less than or equal to',
            '`>` greater than, `>=` greater than or equal to',
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-age',
      title: 'Try the decision',
      intro:
        'Change the age and watch which branch runs. Exactly one of the two lines inside runs.',
      playground: {
        inputs: [{ name: 'age', type: 'number', initial: 20, min: 0, max: 99 }],
        source: code(
          'if age >= 18:',
          '    status = "adult"',
          'else:',
          '    status = "minor"',
          'print(status)',
        ),
        watch: ['age', 'status'],
        prompts: [
          'Set age to 18 exactly. Which branch runs, and why?',
          'Set age to 17. What changed in the answer to the question `age >= 18`?',
          'Is there any age that makes both branches run?',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'question-line',
      phase: 'guided',
      exercise: {
        id: exerciseId('l04-which-is-a-question'),
        kind: 'multiple-choice',
        prompt: 'Which line asks a true/false question?',
        concept: C.conditions,
        dimension: 'understanding',
        hints: ['A question can be answered with true or false. Which line has such an answer?'],
        explanation:
          '`score == 50` compares two values and gives true or false. The other lines store, change or show a value without asking anything.',
        options: [
          { id: 'assign', label: '`score = 50`' },
          { id: 'compare', label: '`score == 50`' },
          { id: 'print', label: '`print(score)`' },
          { id: 'update', label: '`score = score + 1`' },
        ],
        correctOptionId: 'compare',
        misconceptions: {
          assign:
            'A single `=` stores 50 in score. It is an instruction, not a question; asking needs `==`.',
          print: 'print shows the value of score, but it does not compare it with anything.',
          update:
            'This changes score by adding 1. Nothing is compared, so there is no true/false answer.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-jacket',
      phase: 'guided',
      exercise: {
        id: exerciseId('l04-predict-outfit'),
        kind: 'prediction',
        prompt: 'What is the value of outfit after this program runs?',
        concept: C.conditions,
        dimension: 'application',
        hints: ['Replace temperature by 12 and answer the question: is 12 > 20?'],
        explanation:
          'temperature is 12, so `temperature > 20` is false. The if branch is skipped and the else branch sets outfit to "jacket".',
        code: {
          source: code(
            'temperature = 12',
            'if temperature > 20:',
            '    outfit = "t-shirt"',
            'else:',
            '    outfit = "jacket"',
          ),
          highlight: [2],
        },
        target: { kind: 'variable', name: 'outfit' },
        expected: '"jacket"',
        commonMistakes: {
          '"t-shirt"':
            'The if branch only runs when its condition is true. 12 > 20 is false, so the program jumps to else.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-operators',
      phase: 'guided',
      exercise: {
        id: exerciseId('l04-match-operators'),
        kind: 'matching',
        prompt: 'Match each comparison with its meaning.',
        concept: C.conditions,
        dimension: 'understanding',
        hints: ['The `=` in `>=` and `<=` means the value itself is included.'],
        explanation:
          '`==` asks "the same?", `!=` asks "different?". With `>=` and `<=` the boundary counts; with `>` it does not.',
        pairs: [
          {
            left: { id: 'eq', label: '`a == b`' },
            right: { id: 'same', label: 'a is equal to b' },
          },
          {
            left: { id: 'ne', label: '`a != b`' },
            right: { id: 'differ', label: 'a is different from b' },
          },
          {
            left: { id: 'ge', label: '`a >= b`' },
            right: { id: 'least', label: 'a is b or more' },
          },
          {
            left: { id: 'gt', label: '`a > b`' },
            right: { id: 'more', label: 'a is more than b, b itself not included' },
          },
          { left: { id: 'le', label: '`a <= b`' }, right: { id: 'most', label: 'a is b or less' } },
        ],
      },
    },
    {
      kind: 'explain',
      id: 'chains',
      title: 'More than two paths: elif',
      blocks: [
        {
          kind: 'paragraph',
          text: 'When there are more than two cases, add `elif` ("else if"). The program checks the conditions from top to bottom and runs only the first one that is true. The rest are skipped, even if they would also be true.',
        },
        {
          kind: 'code',
          caption: 'With score = 95 every condition is true, but only "A" is given.',
          source: code(
            'if score >= 90:',
            '    grade = "A"',
            'elif score >= 70:',
            '    grade = "B"',
            'elif score >= 50:',
            '    grade = "C"',
            'else:',
            '    grade = "D"',
          ),
        },
        {
          kind: 'callout',
          tone: 'key',
          text: 'Order matters: put the strictest condition first. If `score >= 50` came first, a score of 95 would get "C".',
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: 'The most common bug is the boundary. Always test the value right on the edge: does 90 get "A" or "B"?',
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-grade',
      title: 'Walk down the chain',
      intro: 'Change the score and see which line of the chain is the first true one.',
      playground: {
        inputs: [{ name: 'score', type: 'number', initial: 75, min: 0, max: 100 }],
        source: code(
          'if score >= 90:',
          '    grade = "A"',
          'elif score >= 70:',
          '    grade = "B"',
          'elif score >= 50:',
          '    grade = "C"',
          'else:',
          '    grade = "D"',
          'print(grade)',
        ),
        watch: ['score', 'grade'],
        prompts: [
          'Set score to 90 exactly, then to 89. Which grade does each get?',
          'Set score to 95. `score >= 70` is also true, so why is the grade not "B"?',
          'Find the highest score that still gets "D".',
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'predict-chain',
      phase: 'guided',
      exercise: {
        id: exerciseId('l04-predict-chain'),
        kind: 'prediction',
        prompt: 'What is the value of grade?',
        concept: C.conditions,
        dimension: 'application',
        hints: [
          'Check the conditions one by one from the top. Stop at the first one that is true.',
        ],
        explanation:
          '70 >= 90 is false, then 70 >= 70 is true, so grade becomes "B" and the rest of the chain is skipped.',
        code: {
          source: code(
            'score = 70',
            'if score >= 90:',
            '    grade = "A"',
            'elif score >= 70:',
            '    grade = "B"',
            'elif score >= 50:',
            '    grade = "C"',
            'else:',
            '    grade = "D"',
          ),
        },
        target: { kind: 'variable', name: 'grade' },
        expected: '"B"',
        commonMistakes: {
          '"C"':
            '`>=` includes the boundary: 70 >= 70 is true, so the chain stops at "B" before reaching "C".',
          '"A"': '70 >= 90 is false, so the first branch is skipped.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'order-trap',
      phase: 'practice',
      exercise: {
        id: exerciseId('l04-order-trap'),
        kind: 'prediction',
        prompt: 'The conditions here are in a different order. What is the value of label?',
        concept: C.conditions,
        dimension: 'application',
        hints: ['Which condition is checked first, and is it true for 95?'],
        explanation:
          'The first condition, 95 >= 50, is already true, so label becomes "pass" and the elif is never checked. The stricter test must come first.',
        code: {
          source: code(
            'score = 95',
            'if score >= 50:',
            '    label = "pass"',
            'elif score >= 90:',
            '    label = "excellent"',
            'else:',
            '    label = "fail"',
          ),
          highlight: [2, 4],
        },
        target: { kind: 'variable', name: 'label' },
        expected: '"pass"',
        commonMistakes: {
          '"excellent"':
            '95 >= 90 is true, but the chain never gets there: the first true condition wins, and 95 >= 50 is checked first.',
          '"fail"':
            'else only runs when every condition above it is false. Here the first one is true.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'complete-senior',
      phase: 'practice',
      exercise: {
        id: exerciseId('l04-complete-senior'),
        kind: 'code-completion',
        prompt: 'People aged 65 or older pay 5; everyone else pays 10. Complete the condition.',
        concept: C.conditions,
        dimension: 'application',
        hints: ['"65 or older" must include 65 itself. Which operator includes the boundary?'],
        explanation:
          '"65 or older" means 65 counts, so the test is `age >= 65`. For age 65 it is true and price becomes 5.',
        template: code('age = 65', 'if age [[op]] 65:', '    price = 5', 'else:', '    price = 10'),
        blanks: [{ id: 'op', options: ['>', '>=', '<', '!='], correct: '>=' }],
        check: { variable: 'price', expected: '5' },
        misconceptions: {
          'op:>': '`>` leaves out 65 itself, so a 65-year-old would pay 10.',
          'op:<': '`<` asks "younger than 65", the opposite of the rule.',
          'op:!=':
            '`!=` is true for every age except 65, which is the opposite of what we want here.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-shipping',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l04-debug-shipping'),
        kind: 'debugging',
        prompt:
          'Shipping should be free (0) for orders of 50 or more. An order of exactly 50 is charged 5. Which line is wrong, and why?',
        concept: C.conditions,
        dimension: 'debugging',
        hints: ['Test the boundary: what is 50 > 50?'],
        explanation:
          'Line 2 uses `>`, so 50 > 50 is false and the order of 50 falls into else. `total >= 50` includes the boundary.',
        code: {
          source: code(
            'total = 50',
            'if total > 50:',
            '    shipping = 0',
            'else:',
            '    shipping = 5',
          ),
        },
        bugLine: 2,
        causes: [
          { id: 'else', label: 'The else branch should not be there' },
          { id: 'boundary', label: 'The comparison leaves out the boundary value 50' },
          { id: 'equal', label: 'It should be `total == 50`' },
          { id: 'swapped', label: 'The values 0 and 5 are swapped' },
        ],
        correctCauseId: 'boundary',
        misconceptions: {
          else: 'Without else, orders under 50 would get no shipping value at all. The else is fine.',
          equal: '`==` would make only orders of exactly 50 free; an order of 80 would pay.',
          swapped:
            'Swapping them would charge big orders and make small ones free. The values are right; the question is wrong.',
        },
        fix: {
          source: code(
            'total = 50',
            'if total >= 50:',
            '    shipping = 0',
            'else:',
            '    shipping = 5',
          ),
          variable: 'shipping',
          expected: '0',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-weather',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l04-predict-weather'),
        kind: 'prediction',
        prompt: 'What does this program print?',
        concept: C.conditions,
        dimension: 'application',
        hints: [],
        explanation:
          '30 < 10 and 30 < 25 are both false, so else prints "hot". The last line is not indented, so it runs after the decision whatever the branch.',
        code: {
          source: code(
            't = 30',
            'if t < 10:',
            '    print("cold")',
            'elif t < 25:',
            '    print("mild")',
            'else:',
            '    print("hot")',
            'print("done")',
          ),
        },
        target: { kind: 'output' },
        expected: 'hot\ndone',
        commonMistakes: {
          hot: 'The last line is not indented, so it is not part of any branch: it always runs.',
          'mild\ndone': '30 < 25 is false, so the elif branch is skipped.',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'separate-ifs',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l04-separate-ifs'),
        kind: 'multiple-choice',
        prompt:
          'These are two separate if statements, not an elif chain. How many lines are printed?',
        concept: C.conditions,
        dimension: 'understanding',
        hints: [],
        explanation:
          'Each if is its own question. 15 > 10 is true and 15 > 5 is true, so both print. Only elif makes later checks depend on earlier ones.',
        code: {
          source: code(
            'n = 15',
            'if n > 10:',
            '    print("big")',
            'if n > 5:',
            '    print("medium")',
          ),
        },
        options: [
          { id: 'zero', label: 'None' },
          { id: 'one', label: 'One: "big"' },
          { id: 'two', label: 'Two: "big" and "medium"' },
          { id: 'error', label: 'An error: two ifs cannot follow each other' },
        ],
        correctOptionId: 'two',
        misconceptions: {
          zero: 'Both conditions are true for 15, so at least one line is printed.',
          one: 'That is how an elif chain behaves. Separate ifs are checked independently, so the second one is checked too.',
          error:
            'A program can have as many if statements in a row as it needs; each is a new decision.',
        },
      },
    },
  ],
};
