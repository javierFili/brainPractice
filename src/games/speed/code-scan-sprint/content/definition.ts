import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SPEED_SCORING } from '@/games/speed/shared/content';
import { CODE_SCAN_SPRINT_LEVELS } from './levels';
import { buildSnippet, type FactLine } from './snippet';
import type { CodeScanSprintChallenge, CodeScanSprintProfile, QueryKind } from './types';

interface Candidate {
  readonly subject: string;
  readonly line: number;
}

const indicesWhere = (lines: readonly FactLine[], test: (l: FactLine) => boolean) =>
  lines.flatMap((l, i) => (test(l) ? [i] : []));

/** Every query of `kind` with exactly one answering line in this listing. */
export function candidates(
  lines: readonly FactLine[],
  kind: QueryKind,
  minAssignments: number,
): Candidate[] {
  const unique = (subject: string, matches: number[]) =>
    matches.length === 1 ? [{ subject, line: matches[0] as number }] : [];
  const variables = [...new Set(lines.flatMap((l) => l.names))];
  switch (kind) {
    case 'call':
      return [...new Set(lines.flatMap((l) => (l.calls === null ? [] : [l.calls])))].flatMap((f) =>
        unique(
          f,
          indicesWhere(lines, (l) => l.calls === f),
        ),
      );
    case 'number':
      return [...new Set(lines.flatMap((l) => l.numbers))].flatMap((n) =>
        unique(
          String(n),
          indicesWhere(lines, (l) => l.numbers.includes(n)),
        ),
      );
    case 'first-assign':
    case 'last-assign':
      return variables.flatMap((x) => {
        const assigned = indicesWhere(lines, (l) => l.assigns === x);
        const needed = kind === 'last-assign' ? 2 : minAssignments;
        if (assigned.length < needed) return [];
        // Not trivial: the variable is also used on some other line.
        if (indicesWhere(lines, (l) => l.names.includes(x)).length <= 1) return [];
        return [
          { subject: x, line: (kind === 'first-assign' ? assigned[0] : assigned.at(-1)) as number },
        ];
      });
    case 'condition':
      return variables.flatMap((x) => {
        const checks = indicesWhere(lines, (l) => l.checks.includes(x));
        const uses = indicesWhere(lines, (l) => l.names.includes(x));
        return uses.length >= 2 ? unique(x, checks) : [];
      });
  }
}

const QUESTION: Record<QueryKind, (subject: string) => string> = {
  call: (f) => `Which line calls ${f}?`,
  number: (n) => `Which line uses the number ${n}?`,
  'first-assign': (x) => `Where is ${x} first given a value?`,
  'last-assign': (x) => `Where is ${x} given a value for the last time?`,
  condition: (x) => `Which line checks ${x} in a condition?`,
};

const REASON: Record<QueryKind, (subject: string) => string> = {
  call: (f) => `it is the only line that calls ${f}.`,
  number: (n) => `it is the only line with the number ${n}.`,
  'first-assign': (x) => `it is the first line of the form “${x} ← …”.`,
  'last-assign': (x) => `it is the last line of the form “${x} ← …”.`,
  condition: (x) => `it is the only if / while line whose condition mentions ${x}.`,
};

export const CODE_SCAN_SPRINT_ID = gameIdOf('code-scan-sprint');

export const codeScanSprintGame: GameDefinition<CodeScanSprintChallenge, CodeScanSprintProfile> = {
  id: CODE_SCAN_SPRINT_ID,
  name: 'Code Scan',
  tagline: 'Read a listing at a glance and point at the line.',
  description:
    'A short piece of pseudocode and one question: which line calls print, uses the number 7, or first gives total a value? Find that line as fast as you can. Early levels use a handful of plain lines; later ones nest blocks and repeat names to mislead a quick glance.',
  area: 'speed',
  skills: ['processing-speed', 'selective-attention', 'attention'],
  meta: {
    category: 'speed',
    audiences: ['teens', 'adults', 'programmers'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'A trial is correct when you press the one line that answers the question. Correct answers earn more points the faster they are; a wrong line costs points and running out of time scores nothing. Accuracy and average response time are reported separately; relaxed timing removes the limit.',
    feedback: 'brief',
    accessibilityNotes:
      'Each line is a button named with its number and text, so screen readers can scan the listing line by line. “←” means “gets the value”.',
  },
  instructions: [
    'Read the question, then press the line in the listing that answers it.',
    '“total ← 5” gives total a value; “print(total)” calls print; “if score > 3:” checks score.',
    'Exactly one line answers each question.',
    'Keyboard: Tab to the listing, move with the arrow keys, press Enter.',
  ],
  simpleInstructions: 'Read the question and press the line that matches it.',
  levels: CODE_SCAN_SPRINT_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return retryGeneration('a code scan listing', () => {
      const lines = buildSnippet(random, profile);
      const options = candidates(lines, kind, profile.minAssignments);
      if (options.length === 0) return null;
      // Pick the answer line first, uniformly among answerable lines, so position carries no clue.
      const line = pick(random, [...new Set(options.map((c) => c.line))]);
      const { subject } = pick(
        random,
        options.filter((c) => c.line === line),
      );
      const text = (lines[line] as FactLine).text;
      return {
        ...identity,
        prompt: QUESTION[kind](subject),
        content: {
          kind,
          subject,
          lines: lines.map(({ indent, text: t }) => ({ indent, text: t })),
        },
        response: locateResponse(lines.length, line),
        explanation: `Line ${line + 1} (“${text}”): ${REASON[kind](subject)}`,
        skills:
          kind === 'call' || kind === 'number'
            ? ['processing-speed', 'selective-attention']
            : ['processing-speed', 'attention', 'selective-attention'],
        timing: profile.timing,
      };
    });
  },
};
