import { chance, pick, type RandomGenerator } from '@/domain/random';
import type {
  CodeLine,
  CodeScanProfile,
  Mutation,
  MutationCategory,
  Snippet,
  Subtlety,
  Token,
} from '../types';
import { roleOf } from './snippets';

/** Operator replacements. Fine = one-character near miss; coarse = a different operator family. */
const OPERATOR_SWAPS: Readonly<Record<Subtlety, Readonly<Record<string, readonly string[]>>>> = {
  fine: {
    '<': ['<='],
    '<=': ['<'],
    '>': ['>='],
    '>=': ['>'],
    '+': ['-'],
    '-': ['+'],
    '=': ['≠'],
    '≠': ['='],
  },
  coarse: {
    '<': ['>'],
    '>': ['<'],
    '<=': ['>='],
    '>=': ['<='],
    '+': ['*'],
    '-': ['*'],
    '*': ['+', '-'],
    and: ['or'],
    or: ['and'],
  },
};

/** Replacing one of these by the other negates the comparison: ambiguous with a `not`. */
const COMPLEMENTS: ReadonlySet<string> = new Set(['= ≠', '≠ =', '< >=', '>= <', '> <=', '<= >']);
const KEYWORDS = [
  'if',
  'then',
  'else',
  'end',
  'for',
  'to',
  'do',
  'while',
  'return',
  'not',
  'and',
  'or',
];

/** Letter pairs that read as another letter in some fonts; typos must never create one. */
const LOOK_ALIKES = ['rn', 'cl', 'vv', 'ii', 'nn', 'll'];

/** A mutation plus where exactly it acts on the line. */
export interface PlannedMutation extends Mutation {
  /** Token replaced, or the position where `not` is inserted. */
  readonly tokenIndex: number;
}

function typos(word: string, taken: ReadonlySet<string>): { text: string; subtlety: Subtlety }[] {
  if (word.length < 4) return [];
  const found: { text: string; subtlety: Subtlety }[] = [];
  // Keep the first and last letters so the word stays recognisable; the change is inside it.
  for (let k = 1; k < word.length - 2; k++) {
    if (word[k] !== word[k + 1])
      found.push({
        text: word.slice(0, k) + word.charAt(k + 1) + word.charAt(k) + word.slice(k + 2),
        subtlety: 'fine',
      });
  }
  for (let k = 1; k < word.length - 1; k++)
    found.push({ text: word.slice(0, k) + word.slice(k + 1), subtlety: 'coarse' });
  return found.filter(
    ({ text }) =>
      text !== word &&
      !taken.has(text) &&
      !LOOK_ALIKES.some((pair) => text.includes(pair) && !word.includes(pair)),
  );
}

function numberSwaps(value: number): { text: string; subtlety: Subtlety }[] {
  const fine = [value + 1, value - 1].filter((v) => v >= 0);
  const coarse = [value + 4, value >= 5 ? value - 4 : value + 6];
  return [
    ...fine.map((v) => ({ text: String(v), subtlety: 'fine' as const })),
    ...coarse.map((v) => ({ text: String(v), subtlety: 'coarse' as const })),
  ];
}

/** Every single-token change the catalogue allows on one line of the snippet. */
export function mutationsAt(snippet: Snippet, lineIndex: number): PlannedMutation[] {
  const line = snippet[lineIndex];
  if (line === undefined) return [];
  const words = new Set([...KEYWORDS, ...snippet.flatMap((l) => l.tokens.map((t) => t.text))]);
  const names = new Set(
    snippet.flatMap((l) => l.tokens.filter((t) => t.type === 'name').map((t) => t.text)),
  );
  const found: PlannedMutation[] = [];
  const add = (
    category: MutationCategory,
    subtlety: Subtlety,
    tokenIndex: number,
    before: string | null,
    after: string,
  ) => {
    const complement = before !== null && COMPLEMENTS.has(`${before} ${after}`);
    found.push({ category, subtlety, line: lineIndex, tokenIndex, before, after, complement });
  };

  line.tokens.forEach((token, t) => {
    switch (token.type) {
      case 'operator':
        for (const subtlety of ['fine', 'coarse'] as const)
          for (const after of OPERATOR_SWAPS[subtlety][token.text] ?? [])
            add('operator', subtlety, t, token.text, after);
        break;
      case 'number':
        for (const swap of numberSwaps(Number(token.text)))
          add('number', swap.subtlety, t, token.text, swap.text);
        break;
      case 'name': {
        const role = roleOf(token.text);
        for (const other of names)
          if (other !== token.text && roleOf(other) === role)
            add('variable', role === 'index' ? 'fine' : 'coarse', t, token.text, other);
        for (const typo of typos(token.text, words))
          add('typo', typo.subtlety, t, token.text, typo.text);
        break;
      }
      case 'func':
        for (const typo of typos(token.text, words))
          add('typo', typo.subtlety, t, token.text, typo.text);
        break;
      case 'keyword':
      case 'punct':
        break;
    }
  });

  const [first, second] = line.tokens;
  if ((first?.text === 'if' || first?.text === 'while') && second?.text !== 'not')
    add('negation', 'coarse', 1, null, 'not');
  return found;
}

export function applyMutation(snippet: Snippet, mutation: PlannedMutation): Snippet {
  return snippet.map((line, i): CodeLine => {
    if (i !== mutation.line) return line;
    const tokens: Token[] = [...line.tokens];
    if (mutation.before === null) {
      tokens.splice(mutation.tokenIndex, 0, { type: 'operator', text: mutation.after });
    } else {
      const original = tokens[mutation.tokenIndex] as Token;
      tokens[mutation.tokenIndex] = { type: original.type, text: mutation.after };
    }
    return { indent: line.indent, tokens };
  });
}

export interface MutationOptions {
  /** Complement swaps (`=` ↔ `≠`) are fine to spot but ambiguous to classify. */
  readonly allowComplement: boolean;
}

/**
 * Chooses one change: the line (inside a run of look-alike lines with probability `visualNoise`),
 * then a category uniformly among those available, then a fine change with probability
 * `fineShare`. Returns null when nothing fits, so callers retry with a new snippet.
 */
export function pickMutation(
  random: RandomGenerator,
  snippet: Snippet,
  runLines: readonly number[],
  profile: CodeScanProfile,
  { allowComplement }: MutationOptions,
): PlannedMutation | null {
  const everyLine = snippet.map((_, i) => i);
  const lines = runLines.length > 0 && chance(random, profile.visualNoise) ? runLines : everyLine;
  const allowed = new Set(profile.distractors);
  const candidates = lines
    .flatMap((i) => mutationsAt(snippet, i))
    .filter((m) => allowed.has(m.category) && (allowComplement || !m.complement));
  const categories = [...new Set(candidates.map((m) => m.category))];
  if (categories.length === 0) return null;
  const category = pick(random, categories);
  const inCategory = candidates.filter((m) => m.category === category);
  const wanted: Subtlety = chance(random, profile.fineShare) ? 'fine' : 'coarse';
  const preferred = inCategory.filter((m) => m.subtlety === wanted);
  return pick(random, preferred.length > 0 ? preferred : inCategory);
}
