import type { PathDefinition } from '@/domain/paths';

/**
 * Routes reuse the one catalog. Age groups describe who a route was designed with in mind; they
 * are never used to judge ability, and every game and level stays open to everyone.
 */
export const PATHS: readonly PathDefinition[] = [
  {
    id: 'kids',
    name: 'Kids',
    tagline: 'Short, playful puzzles with pictures.',
    intro:
      'Picture memory, simple logic and spotting games with short instructions and no rush. Start at level 1 and move up when it feels easy.',
    goals: [
      'Play with memory, patterns and logic',
      'Short rounds without time pressure',
      'Clear, friendly feedback after every answer',
    ],
    featured: [
      'memory-cards',
      'position-memory',
      'odd-one-out',
      'visual-pattern-completion',
      'grid-and-path-reasoning',
      'sequence-recall',
      'symbol-counting',
      'logical-deduction',
      'sequence-ordering',
      'rapid-classification',
    ],
    focus: ['memory', 'patterns', 'attention', 'logic'],
    suggestedMinutes: 5,
    notes: [
      'No names, emails or personal details are asked. Progress stays on this device.',
      'There are no public rankings or chats.',
      'If this site is ever offered to children publicly, parental consent and data rules apply first (see docs/privacy.md).',
    ],
  },
  {
    id: 'teens',
    name: 'Teens',
    tagline: 'Visual challenges, strategy and logic.',
    intro:
      'Harder visual puzzles, strategy problems and working-memory challenges. Beat your own records — there are no public leaderboards.',
    goals: [
      'Take on logic and strategy puzzles',
      'Push working memory and pattern finding',
      'Track personal bests level by level',
    ],
    featured: [
      'matrix-reasoning',
      'strategy-puzzle',
      'working-memory-grid',
      'truth-and-falsehood',
      'visual-search-sprint',
      'shape-rotation',
      'number-sequences',
      'multi-choice-processing',
      'dual-memory-challenge',
      'rule-discovery',
    ],
    focus: ['logic', 'patterns', 'memory', 'speed'],
    suggestedMinutes: 10,
    notes: ['Records are personal and stay on this device.'],
  },
  {
    id: 'adults',
    name: 'Adults',
    tagline: 'Everyday memory, focus and planning.',
    intro:
      'Practise remembering lists and numbers, staying focused, switching between tasks and planning ahead, in sessions of 3 to 15 minutes.',
    goals: [
      'Practise everyday memory (words, numbers, associations)',
      'Keep focus on demanding tasks',
      'Fit practice into short daily sessions',
    ],
    featured: [
      'word-recall',
      'number-recall',
      'association-memory',
      'distractor-filtering',
      'color-and-shape-decisions',
      'constraint-solver',
      'multi-step-logic',
      'mental-arithmetic-sprint',
      'sustained-attention-challenge',
      'spatial-transformation',
    ],
    focus: ['memory', 'attention', 'logic', 'speed', 'patterns'],
    suggestedMinutes: 10,
    notes: [
      'Results describe your performance in these activities only; they are not a medical or psychological evaluation.',
    ],
  },
  {
    id: 'seniors',
    name: 'Seniors',
    tagline: 'Clear, calm activities at your own pace.',
    intro:
      'Larger text, bigger buttons and no time limits by default. Instructions can be reopened at any moment during a game.',
    goals: [
      'Keep a regular routine of mental activity',
      'Practise memory and attention at a comfortable pace',
      'See your own results over time',
    ],
    featured: [
      'object-recall',
      'word-recall',
      'memory-cards',
      'association-memory',
      'odd-one-out',
      'visual-difference',
      'logical-deduction',
      'sequence-ordering',
      'number-comparison',
      'symmetry-recognition',
    ],
    focus: ['memory', 'attention', 'logic', 'patterns'],
    suggestedMinutes: 10,
    notes: [
      'Choosing this route turns on larger text, comfortable controls and relaxed timing. Change them any time in Settings.',
      'A slow or mistaken answer is simply part of practising; it says nothing about your health.',
    ],
  },
  {
    id: 'programmers',
    name: 'Programmers',
    tagline: 'Logic, code reading and working memory.',
    intro:
      'Trace algorithms, hunt bugs, track variables and reason about dependencies, plus general logic and memory games. Pair it with the programming logic course.',
    goals: [
      'Read and trace code accurately',
      'Hold program state in working memory',
      'Reason about conditions, loops and dependencies',
    ],
    featured: [
      'algorithmic-logic',
      'code-memory',
      'bug-hunter',
      'variable-tracking',
      'conditional-logic',
      'loop-prediction',
      'dependency-ordering',
      'algorithm-construction',
      'code-scan',
      'pattern-architect',
      'working-memory-grid',
      'logical-deduction',
    ],
    focus: ['programming', 'logic', 'memory'],
    suggestedMinutes: 10,
    notes: ['Choosing this route opens every level (free play). Turn it off in Settings.'],
  },
];

export const pathById = (id: string | null | undefined): PathDefinition | undefined =>
  PATHS.find((path) => path.id === id);
