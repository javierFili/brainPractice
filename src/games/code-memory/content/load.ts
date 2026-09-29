import type { ChallengeTiming } from '@/domain/challenge';
import type { CodeMemoryProfile, MemoryContent, MemoryKind } from './types';

/**
 * Relative effort to memorise one unit of each kind: a field or a grid word is one glance, a call
 * has a method and a path, an assignment has to be computed as well as remembered.
 */
export const STUDY_WEIGHT: Readonly<Record<MemoryKind, number>> = {
  'record-recall': 1,
  'cross-reference': 1,
  'foreign-key-join': 1,
  'sequence-recall': 1.5,
  'variable-state': 3,
  'position-recall': 1,
};

const fieldCount = (records: readonly { readonly fields: readonly unknown[] }[]) =>
  records.reduce((sum, record) => sum + record.fields.length, 0);

/** Items the player has to hold: fields, calls, lines or filled cells. */
export function loadUnits(content: MemoryContent): number {
  switch (content.kind) {
    case 'record-recall':
    case 'cross-reference':
      return fieldCount(content.records);
    case 'foreign-key-join':
      return fieldCount(content.parents) + fieldCount(content.children);
    case 'sequence-recall':
      return content.calls.length;
    case 'variable-state':
      return content.lines.length;
    case 'position-recall':
      return content.cells.filter((cell) => cell !== null).length;
  }
}

const HALF_SECOND = 500;

/** Level timing with a study phase proportional to what this particular challenge shows. */
export function timingFor(content: MemoryContent, profile: CodeMemoryProfile): ChallengeTiming {
  const { perItemMs, minMs } = profile.study;
  const maxMs = profile.timing.studyMs ?? minMs;
  const raw = loadUnits(content) * STUDY_WEIGHT[content.kind] * perItemMs;
  const rounded = Math.round(raw / HALF_SECOND) * HALF_SECOND;
  return { ...profile.timing, studyMs: Math.min(maxMs, Math.max(minMs, rounded)) };
}
