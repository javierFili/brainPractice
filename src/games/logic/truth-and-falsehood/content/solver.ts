import { msg, type Message, type Text } from '@/domain/shared';
import { booleanAssignments, listText } from '@/games/logic/shared/content';
import type { Claim } from './types';

export function claimValue(claim: Claim, world: readonly boolean[]): boolean {
  switch (claim.type) {
    case 'is':
      return world[claim.target] === claim.honest;
    case 'same':
      return world[claim.a] === world[claim.b];
    case 'different':
      return world[claim.a] !== world[claim.b];
    case 'count': {
      const n = world.filter((h) => h === claim.honest).length;
      return claim.op === 'exactly'
        ? n === claim.k
        : claim.op === 'at-least'
          ? n >= claim.k
          : n <= claim.k;
    }
    case 'either':
      return world[claim.a] === claim.honest || world[claim.b] === claim.honest;
  }
}

/** Worlds where every truth-teller's claim is true and every liar's claim is false. */
export const consistentWorlds = (claims: readonly Claim[]) =>
  booleanAssignments(claims.length).filter((world) =>
    claims.every((claim, i) => claimValue(claim, world) === world[i]),
  );

const key = (path: string) => `logic:truthAndFalsehood.${path}`;
const side = (honest: boolean) => (honest ? 'honest' : 'liar');

/**
 * What a character says, without the final full stop (the view and the explanation add their own
 * punctuation). Sentences that include the speaker ("Ben and I") are separate templates, because
 * the verb changes person in most languages.
 */
export function describeClaim(claim: Claim, speaker: number, names: readonly string[]): Message {
  const name = (i: number) => names[i] as string;
  switch (claim.type) {
    case 'is':
      return msg(key(`claim.is.${side(claim.honest)}`), { name: name(claim.target) });
    case 'same':
    case 'different':
    case 'either': {
      const type = claim.type === 'either' ? `either.${side(claim.honest)}` : claim.type;
      const other = claim.a === speaker ? claim.b : claim.b === speaker ? claim.a : -1;
      return other === -1
        ? msg(key(`claim.${type}.pair`), { a: name(claim.a), b: name(claim.b) })
        : msg(key(`claim.${type}.withMe`), { other: name(other) });
    }
    case 'count': {
      const op = { 'at-least': 'atLeast', exactly: 'exactly', 'at-most': 'atMost' }[claim.op];
      return msg(key(`claim.count.${op}.${side(claim.honest)}`), {
        count: claim.k,
        number: msg(key(`numbers.${claim.k}`)),
      });
    }
  }
}

/** "Nobody", "Everyone", "Only Ana", "Ana and Ben": who tells the truth, as an option label. */
export const describeGroup = (world: readonly boolean[], names: readonly string[]): Text => {
  const honest = names.filter((_, i) => world[i]);
  if (honest.length === 0) return msg(key('group.nobody'));
  if (honest.length === names.length) return msg(key('group.everyone'));
  return honest.length === 1
    ? msg(key('group.only'), { name: honest[0] as string })
    : listText(honest);
};
