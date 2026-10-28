import type { CodeLine, Snippet, Token } from './types';

const NO_SPACE_BEFORE = new Set([',', ')', ']', '(', '[']);
const NO_SPACE_AFTER = new Set(['(', '[']);

/** Renders a line's tokens as text: `items[i]`, `send(order, qty)`, `total ← total + price`. */
export function lineText(line: CodeLine): string {
  let text = '';
  line.tokens.forEach((token, i) => {
    const previous = line.tokens[i - 1];
    const glued = previous === undefined || NO_SPACE_AFTER.has(previous.text);
    text += glued || NO_SPACE_BEFORE.has(token.text) ? token.text : ` ${token.text}`;
  });
  return text;
}

export const sameTokens = (a: readonly Token[], b: readonly Token[]) =>
  a.length === b.length && a.every((token, i) => token.text === b[i]?.text);

/** 0-based indices of the lines whose text differs (snippets always have the same length). */
export const changedLines = (original: Snippet, copy: Snippet): number[] =>
  original.flatMap((line, i) => {
    const other = copy[i];
    return other !== undefined && sameTokens(line.tokens, other.tokens) ? [] : [i];
  });
