export type TokenKind = 'keyword' | 'string' | 'number' | 'comment' | 'builtin' | 'plain';

const KEYWORDS = new Set([
  'if',
  'elif',
  'else',
  'while',
  'for',
  'in',
  'function',
  'return',
  'and',
  'or',
  'not',
  'true',
  'false',
  'none',
]);
const BUILTINS = new Set(['print', 'len', 'range', 'append', 'str', 'abs', 'max', 'min']);

/** Splits one line of pseudocode into coloured spans. Display only; never interpreted here. */
export function highlightLine(line: string): { kind: TokenKind; text: string }[] {
  const tokens: { kind: TokenKind; text: string }[] = [];
  const pattern = /("[^"]*"?)|(#.*$)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  for (const match of line.matchAll(pattern)) {
    const [text, string, comment, number, word] = match;
    const kind: TokenKind =
      string !== undefined
        ? 'string'
        : comment !== undefined
          ? 'comment'
          : number !== undefined
            ? 'number'
            : word !== undefined && KEYWORDS.has(word)
              ? 'keyword'
              : word !== undefined && BUILTINS.has(word)
                ? 'builtin'
                : 'plain';
    const last = tokens.at(-1);
    if (last && last.kind === kind && kind === 'plain') last.text += text;
    else tokens.push({ kind, text });
  }
  return tokens;
}
