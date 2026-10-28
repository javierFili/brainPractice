import type { ConstraintRule } from '../types';

export function satisfies(rule: ConstraintRule, arrangement: readonly string[]): boolean {
  const pos = (entity: string) => arrangement.indexOf(entity);
  switch (rule.type) {
    case 'before':
      return pos(rule.a) < pos(rule.b);
    case 'immediately-before':
      return pos(rule.a) + 1 === pos(rule.b);
    case 'not-adjacent':
      return Math.abs(pos(rule.a) - pos(rule.b)) !== 1;
    case 'at':
      return pos(rule.a) === rule.position - 1;
    case 'not-at':
      return pos(rule.a) !== rule.position - 1;
  }
}

export const satisfiesAll = (rules: readonly ConstraintRule[], arrangement: readonly string[]) =>
  rules.every((rule) => satisfies(rule, arrangement));

export const violationCount = (rules: readonly ConstraintRule[], arrangement: readonly string[]) =>
  rules.filter((rule) => !satisfies(rule, arrangement)).length;

/** Every permutation (Heap's algorithm). 7 entities → 5040 arrangements, fine for brute force. */
export function permutations<T>(items: readonly T[]): T[][] {
  const result: T[][] = [];
  const current = [...items];
  const c = new Array<number>(current.length).fill(0);
  result.push([...current]);
  let i = 0;
  while (i < current.length) {
    if ((c[i] as number) < i) {
      const j = i % 2 === 0 ? 0 : (c[i] as number);
      [current[i], current[j]] = [current[j] as T, current[i] as T];
      result.push([...current]);
      c[i] = (c[i] as number) + 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
  return result;
}

export function solutions(
  entities: readonly string[],
  rules: readonly ConstraintRule[],
): string[][] {
  return permutations(entities).filter((arrangement) => satisfiesAll(rules, arrangement));
}

export function describeRule(rule: ConstraintRule): string {
  switch (rule.type) {
    case 'before':
      return `${rule.a} is deployed before ${rule.b}`;
    case 'immediately-before':
      return `${rule.a} is deployed immediately before ${rule.b}`;
    case 'not-adjacent':
      return `${rule.a} and ${rule.b} are not deployed next to each other`;
    case 'at':
      return `${rule.a} is deployed in slot ${rule.position}`;
    case 'not-at':
      return `${rule.a} is not deployed in slot ${rule.position}`;
  }
}
