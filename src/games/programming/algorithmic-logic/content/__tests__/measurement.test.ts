import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import {
  centroidRate,
  chanceRate,
  choiceItems,
  extremeShare,
  medianRate,
  orderDistance,
} from '@/test/guessability';
import { logicGame } from '../definition';
import { execute } from '../solvers/interpreter';
import type { LogicChallenge } from '../types';

/**
 * Measurement invariants: a player who ignores the graph or the program must not beat chance by
 * reading the shape of the options. Sample sizes are large enough for the thresholds to be stable.
 */
const SEEDS = Array.from({ length: 120 }, (_, i) => i * 104729 + 17);
const byLevel = new Map<DifficultyLevel, LogicChallenge[]>(
  DIFFICULTY_LEVELS.map((level) => [
    level,
    SEEDS.map((seed) => generateChallenge(logicGame, { level, seed })),
  ]),
);
const ofKind = (level: DifficultyLevel, kind: LogicChallenge['content']['kind']) =>
  (byLevel.get(level) ?? []).filter((c) => c.content.kind === kind);

describe('Algorithmic Logic — measurement invariants', () => {
  it('dependency-order: the valid order is not the one closest to the other options', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const items = choiceItems(ofKind(level, 'dependency-order'));
      if (items.length < 20) continue;
      expect
        .soft(centroidRate(items, orderDistance), `level ${level}`)
        .toBeLessThan(chanceRate(items) + 0.15);
    }
  });

  it('program-trace choices: the answer is not identifiable by its rank among the options', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const items = choiceItems(ofKind(level, 'program-trace'));
      if (items.length < 20) continue;
      const { observed, chance } = extremeShare(items);
      expect.soft(observed, `level ${level} extremes`).toBeGreaterThan(chance - 0.2);
      expect
        .soft(medianRate(items), `level ${level} median`)
        .toBeLessThan(chanceRate(items) + 0.15);
    }
  });

  it('program-trace: every branch the program takes changes the asked value when flipped', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const challenge of ofKind(level, 'program-trace')) {
        if (challenge.content.kind !== 'program-trace') continue;
        const { program, ask } = challenge.content;
        const { env, ifsEvaluated } = execute(program);
        if (ifsEvaluated === 0) continue;
        const matters = Array.from(
          { length: ifsEvaluated },
          (_, flipIf) => execute(program, { flipIf }).env[ask] !== env[ask],
        );
        expect
          .soft(matters.some(Boolean), `${challenge.id}: no condition affects ${ask}`)
          .toBe(true);
      }
    }
  });

  it('program-trace: the asked variable never ends at its initial value', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const challenge of ofKind(level, 'program-trace')) {
        if (challenge.content.kind !== 'program-trace') continue;
        const { program, ask } = challenge.content;
        const initial = program.find((s) => s.type === 'assign' && s.target === ask);
        const start = initial ? execute([initial]).env[ask] : undefined;
        expect.soft(execute(program).env[ask], challenge.id).not.toBe(start);
      }
    }
  });
});
