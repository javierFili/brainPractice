import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { joinText, msg } from '@/domain/shared';
import {
  describeRule,
  permutations,
  satisfies,
  solutions,
  violationCount,
} from '../solvers/constraints';
import type { ConstraintRule, ConstraintRuleType, LogicProfile } from '../types';
import type { LogicDraft } from './draft';

const SERVICES = ['gateway', 'payments', 'catalog', 'orders', 'users', 'reports', 'alerts'];

/** A random rule of the given type that holds for `target`, or null if impossible. */
function ruleFor(
  random: RandomGenerator,
  type: ConstraintRuleType,
  target: readonly string[],
): ConstraintRule | null {
  const n = target.length;
  const at = (i: number) => target[i] as string;
  switch (type) {
    case 'before': {
      const [i, j] = sample(random, [...target.keys()], 2).sort((a, b) => a - b) as [
        number,
        number,
      ];
      return { type, a: at(i), b: at(j) };
    }
    case 'immediately-before': {
      const i = randomInt(random, 0, n - 2);
      return { type, a: at(i), b: at(i + 1) };
    }
    case 'not-adjacent': {
      const pairs = [...target.keys()].flatMap((i) =>
        [...target.keys()].filter((j) => j > i + 1).map((j) => [i, j] as const),
      );
      if (pairs.length === 0) return null;
      const [i, j] = pick(random, pairs);
      const [a, b] = shuffle(random, [at(i), at(j)]) as [string, string];
      return { type, a, b };
    }
    case 'at': {
      const i = randomInt(random, 0, n - 1);
      return { type, a: at(i), position: i + 1 };
    }
    case 'not-at': {
      const i = randomInt(random, 0, n - 1);
      const others = [...target.keys()].filter((k) => k !== i);
      return { type, a: at(i), position: pick(random, others) + 1 };
    }
  }
}

/**
 * Adds rules that hold for a hidden arrangement until it is the only solution, then removes every
 * rule that is not needed: the puzzle has exactly one answer and no redundant clue.
 */
function uniquePuzzle(
  random: RandomGenerator,
  entities: readonly string[],
  types: readonly ConstraintRuleType[],
) {
  return retryGeneration('constraint puzzle', () => {
    const target = shuffle(random, entities);
    let rules: ConstraintRule[] = [];
    let count = permutations(entities).length;
    for (let i = 0; i < 60 && count > 1; i++) {
      const rule = ruleFor(random, pick(random, types), target);
      if (!rule) continue;
      const next = solutions(entities, [...rules, rule]).length;
      if (next < count) {
        rules.push(rule);
        count = next;
      }
    }
    if (count !== 1) return null;
    for (const rule of shuffle(random, rules)) {
      const without = rules.filter((r) => r !== rule);
      if (solutions(entities, without).length === 1) rules = without;
    }
    return { target, rules: shuffle(random, rules) };
  });
}

export function constraintArrangement(random: RandomGenerator, profile: LogicProfile): LogicDraft {
  const { entityCount, ruleTypes, question } = profile.constraints;
  const entities = sample(random, SERVICES, entityCount).sort();
  const { target, rules } = uniquePuzzle(random, entities, ruleTypes);
  const arrangement = target.join(', ');
  const key = 'programming:algorithmicLogic.constraint';
  const skills = ['logical-reasoning', 'decomposition'] as const;

  if (question === 'arrangement') {
    // Near misses: arrangements that break as few rules as possible.
    const wrong = shuffle(
      random,
      permutations(entities).filter((p) => violationCount(rules, p) > 0),
    )
      .sort((a, b) => violationCount(rules, a) - violationCount(rules, b))
      .slice(0, 3);
    const why = wrong.map((p) =>
      msg(`${key}.breaks`, {
        arrangement: p.join(', '),
        rule: describeRule(rules.find((r) => !satisfies(r, p)) as ConstraintRule),
      }),
    );
    return {
      prompt: msg(`${key}.prompt.arrangement`),
      content: { kind: 'constraint-arrangement', entities, rules, askPosition: null },
      response: singleChoice(
        random,
        arrangement,
        wrong.map((p) => p.join(', ')),
      ),
      explanation: msg(`${key}.explanation.arrangement`, {
        arrangement,
        reasons: joinText(why, '; '),
      }),
      skills,
    };
  }

  // Ask a slot that no rule states directly, so it has to be deduced.
  const stated = new Set(
    rules.filter((r) => r.type === 'at').map((r) => (r as { position: number }).position),
  );
  const slots = [...target.keys()].map((i) => i + 1).filter((slot) => !stated.has(slot));
  const slot = pick(random, slots.length > 0 ? slots : [1]);
  const answer = target[slot - 1] as string;
  const others = sample(
    random,
    entities.filter((e) => e !== answer),
    Math.min(3, entities.length - 1),
  );
  return {
    prompt: msg(`${key}.prompt.position`, { slot }),
    content: { kind: 'constraint-arrangement', entities, rules, askPosition: slot },
    response: singleChoice(random, answer, others),
    explanation: msg(`${key}.explanation.position`, { arrangement, slot, answer }),
    skills,
  };
}
