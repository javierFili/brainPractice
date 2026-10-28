import { booleanAssignments, listJoin } from '@/games/logic/shared/content';
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

const kind = (honest: boolean) => (honest ? 'a truth-teller' : 'a liar');
const kinds = (honest: boolean, many: boolean) =>
  many ? (honest ? 'truth-tellers' : 'liars') : kind(honest);

export function describeClaim(claim: Claim, speaker: number, names: readonly string[]): string {
  const name = (i: number) => (i === speaker ? 'I' : (names[i] as string));
  const pairName = (a: number, b: number) =>
    a === speaker
      ? `${name(b)} and I`
      : b === speaker
        ? `${name(a)} and I`
        : `${name(a)} and ${name(b)}`;
  switch (claim.type) {
    case 'is':
      return `${name(claim.target)} is ${kind(claim.honest)}.`;
    case 'same':
      return `${pairName(claim.a, claim.b)} are the same: both truth-tellers or both liars.`;
    case 'different':
      return `${pairName(claim.a, claim.b)} are different: one truth-teller and one liar.`;
    case 'count': {
      const op = { 'at-least': 'At least', exactly: 'Exactly', 'at-most': 'At most' }[claim.op];
      const many = claim.k !== 1;
      const number = ['no', 'one', 'two', 'three', 'four'][claim.k] ?? String(claim.k);
      return `${op} ${number} of us ${many ? 'are' : 'is'} ${kinds(claim.honest, many)}.`;
    }
    case 'either':
      return `At least one of ${pairName(claim.a, claim.b).replace(' and I', ' and me')} is ${kind(claim.honest)}.`;
  }
}

export const describeGroup = (world: readonly boolean[], names: readonly string[]) => {
  const honest = names.filter((_, i) => world[i]);
  if (honest.length === 0) return 'Nobody';
  if (honest.length === names.length) return 'Everyone';
  return honest.length === 1 ? `Only ${honest[0] as string}` : listJoin(honest);
};
