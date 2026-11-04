import { joinText, msg, type Message, type Text } from '@/domain/shared';
import { booleanAssignments } from '@/games/logic/shared/content';
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

/**
 * A literal as an id for the translation files: `lamp.yes` / `lamp.no`. Each language words the
 * sentence in every form its templates need (plain, capitalised, as an "if" clause, inverted), so
 * premises are whole templates with no capitalising or word order done in code.
 */
export const literalId = (atoms: Atoms, lit: Literal) =>
  `${atoms[lit.atom] as string}.${lit.value ? 'yes' : 'no'}`;

const key = (path: string) => `logic:conditionalReasoning.${path}`;

/** The plain sentence: "the lamp is on". */
export const sentence = (atoms: Atoms, lit: Literal): Message =>
  msg(key('atom'), { a: literalId(atoms, lit) });

export function describePremise(atoms: Atoms, p: Premise): Message {
  const id = (lit: Literal) => literalId(atoms, lit);
  switch (p.type) {
    case 'fact':
      return msg(key('premise.fact'), { a: id(p.lit) });
    case 'if':
      return msg(key('premise.if'), { a: id(p.a), b: id(p.b) });
    case 'unless':
      return msg(key('premise.unless'), { a: id(p.main), b: id(p.cond) });
    case 'only-if':
      return msg(key('premise.onlyIf'), { a: id(p.a), b: id(p.b) });
    case 'or':
      return msg(key('premise.or'), { a: id(p.a), b: id(p.b) });
  }
}

export function describeWorld(atoms: Atoms, world: readonly boolean[]): Text {
  return joinText(
    world.map((value, atom) => sentence(atoms, { atom, value })),
    ', ',
  );
}
