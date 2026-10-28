import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { fixedChoice, listJoin, type Draft } from '@/games/logic/shared/content';
import { STRATEGY_LEVELS } from './levels';
import {
  applyPileMove,
  pileMoves,
  pilesWin,
  slidingDistances,
  slidingGoal,
  slidingPath,
  solveJugs,
  takeAwayWins,
  type PileMove,
} from './solvers';
import type { StrategyChallenge, StrategyProfile } from './types';

export const STRATEGY_PUZZLE_ID = gameIdOf('strategy-puzzle');

type StrategyDraft = Draft<StrategyChallenge>;

export const PILE_NAMES = ['A', 'B', 'C', 'D'];
const takeLabel = (n: number) => `Take ${n}`;
export const pileMoveLabel = (m: PileMove) =>
  `Take ${m.take} from pile ${PILE_NAMES[m.pile] as string}`;

function takeAway(random: RandomGenerator, profile: StrategyProfile): StrategyDraft {
  const { maxTake, pile: range } = profile.takeAway;
  const pile = retryGeneration('take-away pile', () => {
    const n = randomInt(random, range[0], range[1]);
    return takeAwayWins(n, maxTake) ? n : null;
  });
  const memo = new Map<number, boolean>();
  const winning = Array.from({ length: maxTake }, (_, i) => i + 1).filter(
    (t) => t <= pile && !takeAwayWins(pile - t, maxTake, memo),
  );
  if (winning.length !== 1) throw new Error('Take-away must have one winning move');
  const take = winning[0] as number;
  const left = pile - take;
  const losing = Array.from(
    { length: Math.floor(pile / (maxTake + 1)) + 1 },
    (_, i) => i * (maxTake + 1),
  ).filter((n) => n <= left);
  return {
    prompt: `It is your turn. There are ${pile} coins. Which move makes sure you take the last coin?`,
    content: { kind: 'take-away', pile, maxTake },
    response: fixedChoice(
      Array.from({ length: maxTake }, (_, i) => takeLabel(i + 1)),
      takeLabel(take),
    ),
    explanation: `Take ${take}, leaving ${left}. Positions with ${listJoin(losing.map(String), 'or')} coins lose for the player whose turn it is: whatever your friend takes (1 to ${maxTake}), you take the rest of ${maxTake + 1} and reach the next one, until you take the last coin. Any other move leaves a number your friend can use the same way.`,
    skills: ['planning', 'logical-reasoning'],
  };
}

function piles(random: RandomGenerator, profile: StrategyProfile): StrategyDraft {
  const memo = new Map<string, boolean>();
  const { state, win, losing } = retryGeneration('piles position', () => {
    const state = Array.from({ length: profile.piles.count }, () =>
      randomInt(random, 1, profile.piles.max),
    );
    const moves = pileMoves(state);
    const wins = moves.filter((m) => !pilesWin(applyPileMove(state, m), memo));
    const lose = moves.filter((m) => !wins.includes(m));
    return wins.length === 1 && lose.length >= 3
      ? { state, win: wins[0] as PileMove, losing: lose }
      : null;
  });
  const after = applyPileMove(state, win);
  const distractors = sample(random, losing, 3);
  const equalHint =
    state.length === 2 && after[0] === after[1]
      ? ' With two equal piles, you can copy every move your friend makes on the other pile.'
      : '';
  return {
    prompt: 'It is your turn. Which move makes sure you take the last coin?',
    content: { kind: 'piles', piles: state },
    response: singleChoice(random, pileMoveLabel(win), distractors.map(pileMoveLabel)),
    explanation: `${pileMoveLabel(win)}, leaving piles of ${after.join(', ')}. Checking every possible game from there, each reply your friend makes leaves you a move that keeps you winning, until you take the last coin.${equalHint} Every other move gives your friend such a winning reply.`,
    skills: ['planning', 'logical-reasoning'],
  };
}

function jugs(random: RandomGenerator, profile: StrategyProfile): StrategyDraft {
  const [lo, hi] = profile.jugs.moves;
  const puzzle = retryGeneration('jug puzzle', () => {
    let caps: number[];
    let start: number[];
    const tap = profile.jugs.count === 2;
    if (tap) {
      caps = sample(random, [2, 3, 4, 5, 6, 7, 8, 9], 2).sort((a, b) => a - b);
      start = [0, 0];
    } else {
      const big = pick(random, [8, 10, 12]);
      caps = [
        big,
        ...sample(
          random,
          Array.from({ length: big - 2 }, (_, i) => i + 2),
          2,
        ).sort((a, b) => b - a),
      ];
      start = [big, 0, 0];
    }
    const target = randomInt(random, 1, Math.max(...caps) - 1);
    if (caps.includes(target) || start.includes(target)) return null;
    const path = solveJugs(caps, start, tap, target);
    if (!path || path.length < lo || path.length > hi) return null;
    return { caps, start, tap, target, path };
  });
  const { caps, start, tap, target, path } = puzzle;
  const steps = path.map((s, i) => `${i + 1}. ${s.action} (${s.state.join(' | ')})`);
  return {
    prompt: `What is the smallest number of moves to get exactly ${target} ${target === 1 ? 'litre' : 'litres'} in one jug?`,
    content: { kind: 'jugs', capacities: caps, start, tap, target },
    response: numericResponse(path.length, 'moves'),
    explanation: `A search through every possible sequence of moves finds no way shorter than ${path.length} moves. One shortest way: ${steps.join('; ')}.`,
    skills: ['planning', 'problem-solving'],
  };
}

function sliding(random: RandomGenerator, profile: StrategyProfile): StrategyDraft {
  const { rows, cols, moves } = profile.sliding;
  const dist = slidingDistances(rows, cols);
  const boards = [...dist.entries()]
    .filter(([, d]) => d >= moves[0] && d <= moves[1])
    .map(([k]) => k);
  const start = pick(random, boards).split(',').map(Number);
  const path = slidingPath(start, rows, cols);
  return {
    prompt: 'What is the smallest number of slides to reach the goal picture?',
    content: { kind: 'sliding', rows, cols, start, goal: slidingGoal(rows, cols) },
    response: numericResponse(path.length, 'slides'),
    explanation: `A search through every reachable board shows the goal is ${path.length} slides away and no fewer. One shortest way: slide tile ${path.join(', then ')}.`,
    skills: ['planning', 'spatial-reasoning'],
  };
}

const GENERATORS = { 'take-away': takeAway, piles, jugs, sliding } as const;

export const strategyPuzzleGame: GameDefinition<StrategyChallenge, StrategyProfile> = {
  id: STRATEGY_PUZZLE_ID,
  name: 'Strategy Puzzle',
  tagline: 'Plan ahead: find the best move or the shortest way.',
  description:
    'Coin games where you must find the move that guarantees a win, water jugs to measure an exact amount, and sliding tiles to put back in place. Every answer is checked by searching all possibilities, so the best move or the smallest number of moves is certain.',
  area: 'logic',
  skills: ['planning', 'problem-solving', 'logical-reasoning'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 6,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Answers are checked against an exhaustive search. Your result is the share of puzzles answered correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Coin games: you and a friend take turns. Whoever takes the last coin wins. Your friend always plays the best move.',
    'Water jugs: fill a jug from the tap, empty it, or pour one jug into another until it is full or the first is empty. Each counts as one move.',
    'Sliding tiles: slide a tile next to the gap into the gap. Each slide counts as one move.',
    'Plan in your head, then answer. Use paper if it helps.',
  ],
  simpleInstructions: 'Think a few moves ahead to find the best move or the fewest moves.',
  levels: STRATEGY_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
