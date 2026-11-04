import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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

/** Message key part per query kind (questions and reasons). */
const KEY: Record<QueryKind, string> = {
  call: 'call',
  number: 'number',
  'first-assign': 'firstAssign',
  'last-assign': 'lastAssign',
  condition: 'condition',
};

export const CODE_SCAN_SPRINT_ID = gameIdOf('code-scan-sprint');

export const codeScanSprintGame: GameDefinition<CodeScanSprintChallenge, CodeScanSprintProfile> = {
  id: CODE_SCAN_SPRINT_ID,
  name: msg('speed:codeScanSprint.name'),
  tagline: msg('speed:codeScanSprint.tagline'),
  description: msg('speed:codeScanSprint.description'),
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
    scoringSummary: msg('speed:codeScanSprint.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:codeScanSprint.accessibilityNotes'),
  },
  instructions: [
    msg('speed:codeScanSprint.instructions.read'),
    msg('speed:codeScanSprint.instructions.syntax'),
    msg('speed:codeScanSprint.instructions.unique'),
    msg('speed:codeScanSprint.instructions.keyboard'),
  ],
  simpleInstructions: msg('speed:codeScanSprint.simpleInstructions'),
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
        prompt: msg(`speed:codeScanSprint.question.${KEY[kind]}`, { subject }),
        content: {
          kind,
          subject,
          lines: lines.map(({ indent, text: t }) => ({ indent, text: t })),
        },
        response: locateResponse(lines.length, line),
        explanation: msg('speed:codeScanSprint.explanation', {
          line: line + 1,
          text,
          reason: msg(`speed:codeScanSprint.reason.${KEY[kind]}`, { subject }),
        }),
        skills:
          kind === 'call' || kind === 'number'
            ? ['processing-speed', 'selective-attention']
            : ['processing-speed', 'attention', 'selective-attention'],
        timing: profile.timing,
      };
    });
  },
};
