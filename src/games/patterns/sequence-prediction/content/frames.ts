import { figureLabel, parseFigure, type Figure } from '../../shared/content';
import type { Frame, Mark } from './types';

/** `blue arrow pointing right at row 2, column 3` */
export const markLabel = (m: Mark) =>
  `${figureLabel(m.figure, { withCount: false })} at row ${m.row + 1}, column ${m.col + 1}`;

/** Frame label used for options: `4×4: blue circle at row 1, column 2; …`. */
export const frameLabel = (frame: Frame, size: number) =>
  `${size}×${size}: ${frame.marks.map(markLabel).join('; ')}`;

/** The same frame in words, without the grid-size prefix. */
export const frameWords = (frame: Frame) => frame.marks.map(markLabel).join('; ');

const MARK = /^(.+) at row (\d+), column (\d+)$/;

export function parseFrame(label: string): { size: number; frame: Frame } | null {
  const head = /^(\d+)×\d+: (.+)$/.exec(label);
  if (!head) return null;
  const marks: Mark[] = [];
  for (const part of (head[2] ?? '').split('; ')) {
    const match = MARK.exec(part);
    const fig: Figure | null = match ? parseFigure(match[1] ?? '') : null;
    if (!match || fig === null) return null;
    marks.push({ figure: fig, row: Number(match[2]) - 1, col: Number(match[3]) - 1 });
  }
  return { size: Number(head[1]), frame: { marks } };
}

/** "1 square right and 2 squares down" */
export function stepWords(dr: number, dc: number): string {
  const part = (n: number, pos: string, neg: string) =>
    n === 0
      ? []
      : [`${Math.abs(n)} ${Math.abs(n) === 1 ? 'square' : 'squares'} ${n > 0 ? pos : neg}`];
  const parts = [...part(dc, 'right', 'left'), ...part(dr, 'down', 'up')];
  return parts.join(' and ');
}
