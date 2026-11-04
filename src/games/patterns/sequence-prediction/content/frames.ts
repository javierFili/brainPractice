import { isMessage, isTextList, joinText, msg, type Message, type Text } from '@/domain/shared';
import {
  figureFromText,
  figureKey,
  figureLabel,
  parseFigure,
  type Figure,
} from '../../shared/content';
import type { Frame, Mark } from './types';

const T = 'patterns:sequencePrediction';

/** "blue arrow pointing right at row 2, column 3", in the reader's language. */
export const markLabel = (m: Mark): Message =>
  msg(`${T}.mark`, {
    figure: figureLabel(m.figure, { withCount: false }),
    row: m.row + 1,
    column: m.col + 1,
  });

/** The frame in words: every mark and its cell. */
export const frameWords = (frame: Frame): Text => joinText(frame.marks.map(markLabel), '; ');

/**
 * Option label: the frame in words. The grid size travels as a value (not shown) so the option
 * can be drawn again from the label.
 */
export const frameLabel = (frame: Frame, size: number): Message =>
  msg(`${T}.frame`, { size, marks: frameWords(frame) });

/** Stable code of a frame, `4×4: blue circle at row 1, column 2; …`; never shown. */
export const frameKey = (frame: Frame, size: number) =>
  `${size}×${size}: ${frame.marks
    .map(
      (m) =>
        `${figureKey(m.figure, { withCount: false })} at row ${m.row + 1}, column ${m.col + 1}`,
    )
    .join('; ')}`;

/** The frame a `frameLabel` message describes; null for any other text. */
export function frameFromText(text: Text): { size: number; frame: Frame } | null {
  if (!isMessage(text) || text.key !== `${T}.frame`) return null;
  const size = text.values?.['size'];
  const marks = text.values?.['marks'];
  if (typeof size !== 'number' || !isTextList(marks)) return null;
  const out: Mark[] = [];
  for (const mark of marks.list) {
    if (!isMessage(mark)) return null;
    const fig = mark.values?.['figure'];
    const row = mark.values?.['row'];
    const col = mark.values?.['column'];
    const figure = fig === undefined || typeof fig === 'number' ? null : figureFromText(fig);
    if (figure === null || typeof row !== 'number' || typeof col !== 'number') return null;
    out.push({ figure, row: row - 1, col: col - 1 });
  }
  return { size, frame: { marks: out } };
}

const MARK = /^(.+) at row (\d+), column (\d+)$/;

/** Reads a frame code or an English frame label (the size prefix is optional). */
export function parseFrame(label: string): { size: number | null; frame: Frame } | null {
  const head = /^(\d+)×\d+: (.+)$/.exec(label);
  const body = head ? (head[2] ?? '') : label;
  const marks: Mark[] = [];
  for (const part of body.split('; ')) {
    const match = MARK.exec(part);
    const fig: Figure | null = match ? parseFigure(match[1] ?? '') : null;
    if (!match || fig === null) return null;
    marks.push({ figure: fig, row: Number(match[2]) - 1, col: Number(match[3]) - 1 });
  }
  return { size: head ? Number(head[1]) : null, frame: { marks } };
}

/** "1 square right and 2 squares down" */
export function stepWords(dr: number, dc: number): Text {
  const part = (n: number, pos: string, neg: string) =>
    n === 0 ? [] : [msg(`${T}.step.${n > 0 ? pos : neg}`, { count: Math.abs(n) })];
  return joinText([...part(dc, 'right', 'left'), ...part(dr, 'down', 'up')]);
}
