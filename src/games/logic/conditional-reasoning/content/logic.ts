import { booleanAssignments, capitalize } from '@/games/logic/shared/content';
import type { ConditionalContent, Literal, Premise, Verdict } from './types';

const holds = (lit: Literal, world: readonly boolean[]) => world[lit.atom] === lit.value;

export function premiseHolds(p: Premise, world: readonly boolean[]): boolean {
  switch (p.type) {
    case 'fact':
      return holds(p.lit, world);
    case 'if':
    case 'only-if':
      return !holds(p.a, world) || holds(p.b, world);
    case 'unless':
      return holds(p.cond, world) || holds(p.main, world);
    case 'or':
      return holds(p.a, world) || holds(p.b, world);
  }
}

/** Truth table: every world (true/false for each atom) in which all premises hold. */
export function models(atomCount: number, premises: readonly Premise[]): boolean[][] {
  return booleanAssignments(atomCount).filter((w) => premises.every((p) => premiseHolds(p, w)));
}

export function verdict(
  atomCount: number,
  premises: readonly Premise[],
  question: Literal,
): Verdict | null {
  const worlds = models(atomCount, premises);
  if (worlds.length === 0) return null;
  const values = new Set(worlds.map((w) => holds(question, w)));
  return values.size === 2 ? 'unknown' : values.has(true) ? 'true' : 'false';
}

type Atoms = ConditionalContent['atoms'];

export const sentence = (atoms: Atoms, lit: Literal) =>
  (atoms[lit.atom] as readonly [string, string])[lit.value ? 0 : 1];

export function describePremise(atoms: Atoms, p: Premise): string {
  const s = (lit: Literal) => sentence(atoms, lit);
  switch (p.type) {
    case 'fact':
      return `${capitalize(s(p.lit))}.`;
    case 'if':
      return `If ${s(p.a)}, then ${s(p.b)}.`;
    case 'unless':
      return `${capitalize(s(p.main))} unless ${s(p.cond)}.`;
    case 'only-if':
      return `${capitalize(s(p.a))} only if ${s(p.b)}.`;
    case 'or':
      return `Either ${s(p.a)} or ${s(p.b)}, or both.`;
  }
}

export function describeWorld(atoms: Atoms, world: readonly boolean[]): string {
  return world.map((value, atom) => sentence(atoms, { atom, value })).join(', ');
}
