import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import { fixedChoice, orListText, textChoice, type Draft } from '@/games/logic/shared/content';
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
const key = (path: string) => `logic:strategyPuzzle.${path}`;
const takeLabel = (n: number) => msg(key('take'), { n });
export const pileMoveLabel = (m: PileMove): Text =>
  msg(key('takeFromPile'), { n: m.take, pile: PILE_NAMES[m.pile] as string });

/** "a, then b, then c". */
const thenList = (items: readonly Text[]): Text =>
  items.length <= 1
    ? joinText(items)
    : msg(key('then'), { head: thenList(items.slice(0, -1)), last: items.at(-1) as Text });

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
    prompt: msg(key('prompt.takeAway'), { count: pile }),
    content: { kind: 'take-away', pile, maxTake },
    response: fixedChoice(
      Array.from({ length: maxTake }, (_, i) => takeLabel(i + 1)),
      takeLabel(take),
    ),
    explanation: msg(key('explanation.takeAway'), {
      take,
      left,
      losing: orListText(losing.map(String)),
      max: maxTake,
      group: maxTake + 1,
    }),
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
  const equal = state.length === 2 && after[0] === after[1];
  return {
    prompt: msg(key('prompt.piles')),
    content: { kind: 'piles', piles: state },
    response: textChoice(random, pileMoveLabel(win), distractors.map(pileMoveLabel)),
    explanation: msg(key(`explanation.${equal ? 'pilesEqual' : 'piles'}`), {
      move: pileMoveLabel(win),
      after: joinText(after.map(String), ', '),
    }),
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
  const steps = path.map((s, i) =>
    msg(key('jug.step'), {
      n: i + 1,
      action: s.action,
      state: joinText(s.state.map(String), ' | '),
    }),
  );
  return {
    prompt: msg(key('prompt.jugs'), { count: target }),
    content: { kind: 'jugs', capacities: caps, start, tap, target },
    response: { ...numericResponse(path.length), question: { unit: msg(key('units.moves')) } },
    explanation: msg(key('explanation.jugs'), { count: path.length, steps: joinText(steps, '; ') }),
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
    prompt: msg(key('prompt.sliding')),
    content: { kind: 'sliding', rows, cols, start, goal: slidingGoal(rows, cols) },
    response: { ...numericResponse(path.length), question: { unit: msg(key('units.slides')) } },
    explanation: msg(key('explanation.sliding'), {
      count: path.length,
      tiles: thenList(path.map(String)),
    }),
    skills: ['planning', 'spatial-reasoning'],
  };
}

const GENERATORS = { 'take-away': takeAway, piles, jugs, sliding } as const;

export const strategyPuzzleGame: GameDefinition<StrategyChallenge, StrategyProfile> = {
  id: STRATEGY_PUZZLE_ID,
  name: msg('logic:strategyPuzzle.name'),
  tagline: msg('logic:strategyPuzzle.tagline'),
  description: msg('logic:strategyPuzzle.description'),
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
    scoringSummary: msg('logic:strategyPuzzle.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:strategyPuzzle.instructions.1'),
    msg('logic:strategyPuzzle.instructions.2'),
    msg('logic:strategyPuzzle.instructions.3'),
    msg('logic:strategyPuzzle.instructions.4'),
  ],
  simpleInstructions: msg('logic:strategyPuzzle.simpleInstructions'),
  levels: STRATEGY_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
