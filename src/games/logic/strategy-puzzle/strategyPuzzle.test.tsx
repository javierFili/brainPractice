import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { pileMoveLabel, strategyPuzzleGame } from './content/definition';
import { STRATEGY_LEVELS } from './content/levels';
import { applyPileMove, pileMoves } from './content/solvers';
import { strategyPuzzleModule } from './index';

describeGameContract(strategyPuzzleModule);

/** Independent oracles: Nim theory (xor) and Bouton's subtraction-game rule. */
const nimWins = (piles: readonly number[]) => piles.reduce((x, p) => x ^ p, 0) !== 0;

/** Independent BFS written from scratch for jugs (min moves). */
function jugBfs(caps: readonly number[], start: readonly number[], tap: boolean, target: number) {
  const seen = new Set([start.join()]);
  let layer = [start];
  for (let d = 0; layer.length > 0; d++) {
    if (layer.some((s) => s.includes(target))) return d;
    const next: (readonly number[])[] = [];
    for (const s of layer) {
      const out: number[][] = [];
      for (let i = 0; i < s.length; i++) {
        if (tap) {
          out.push(s.map((x, k) => (k === i ? (caps[k] as number) : x)));
          out.push(s.map((x, k) => (k === i ? 0 : x)));
        }
        for (let j = 0; j < s.length; j++) {
          if (i === j) continue;
          const t = Math.min(s[i] as number, (caps[j] as number) - (s[j] as number));
          out.push(s.map((x, k) => (k === i ? x - t : k === j ? x + t : x)));
        }
      }
      for (const o of out)
        if (!seen.has(o.join())) {
          seen.add(o.join());
          next.push(o);
        }
    }
    layer = next;
  }
  return -1;
}

/** Inversion-parity-free check: BFS from the start until the goal. */
function slideBfs(start: readonly number[], goal: readonly number[], cols: number) {
  const rows = start.length / cols;
  const seen = new Set([start.join()]);
  let layer = [start];
  for (let d = 0; layer.length > 0; d++) {
    if (layer.some((b) => b.join() === goal.join())) return d;
    const next: number[][] = [];
    for (const b of layer) {
      const g = b.indexOf(0);
      for (const j of [
        g - cols,
        g + cols,
        g % cols > 0 ? g - 1 : -1,
        g % cols < cols - 1 ? g + 1 : -1,
      ]) {
        if (j < 0 || j >= rows * cols) continue;
        const n = [...b];
        n[g] = b[j] as number;
        n[j] = 0;
        if (!seen.has(n.join())) {
          seen.add(n.join());
          next.push(n);
        }
      }
    }
    layer = next;
  }
  return -1;
}

describe('Strategy Puzzle', () => {
  it('every answer matches an independent oracle', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(15, 23)) {
        const c = generateChallenge(strategyPuzzleGame, { level, seed });
        const { content, response } = c;
        const chosen =
          response.format === 'single-choice'
            ? response.question.options.find((o) => o.id === response.solution.optionId)?.label
            : undefined;
        const value = response.format === 'numeric' ? response.solution.value : undefined;
        switch (content.kind) {
          case 'take-away': {
            const k = content.maxTake + 1;
            expect(content.pile % k).not.toBe(0);
            expect(chosen).toBe(`Take ${content.pile % k}`);
            break;
          }
          case 'piles': {
            const winners = pileMoves(content.piles).filter(
              (m) => !nimWins(applyPileMove(content.piles, m)),
            );
            expect(winners).toHaveLength(1);
            expect(chosen).toBe(pileMoveLabel(winners[0] as never));
            if (response.format !== 'single-choice') throw new Error('choice expected');
            for (const o of response.question.options) {
              if (o.label === chosen) continue;
              const m = pileMoves(content.piles).find((x) => pileMoveLabel(x) === o.label);
              expect(m).toBeDefined();
              expect(nimWins(applyPileMove(content.piles, m as never))).toBe(true);
            }
            break;
          }
          case 'jugs':
            expect(value).toBe(
              jugBfs(content.capacities, content.start, content.tap, content.target),
            );
            break;
          case 'sliding':
            expect(value).toBe(slideBfs(content.start, content.goal, content.cols));
            expect(value).toBeGreaterThan(0);
            break;
        }
      }
    }
  });

  it('plans grow longer across levels', () => {
    expectNonDecreasing(STRATEGY_LEVELS, (p) => p.sliding.moves[1], 'sliding moves');
    expectNonDecreasing(STRATEGY_LEVELS, (p) => p.jugs.moves[1], 'jug moves');
    expectNonDecreasing(STRATEGY_LEVELS, (p) => p.takeAway.maxTake, 'max take');
  });
});
