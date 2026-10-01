import type { CognitiveArea } from '@/domain/shared';

export interface AreaMeta {
  readonly label: string;
  readonly summary: string;
  /** Decorative glyph; the label always accompanies it. */
  readonly glyph: string;
  readonly accent: string;
  readonly ring: string;
  readonly soft: string;
  /** Hover border; a literal class so Tailwind can generate it. */
  readonly hoverRing: string;
}

export const AREAS: Readonly<Record<CognitiveArea, AreaMeta>> = {
  logic: {
    label: 'Logic',
    summary: 'Deduction, dependencies and algorithmic reasoning.',
    glyph: '⋀',
    accent: 'text-violet-300',
    ring: 'border-violet-400/40',
    hoverRing: 'hover:border-violet-400/40',
    soft: 'bg-violet-400/10',
  },
  memory: {
    label: 'Memory',
    summary: 'Hold and update working state under load.',
    glyph: '▦',
    accent: 'text-cyan-300',
    ring: 'border-cyan-400/40',
    hoverRing: 'hover:border-cyan-400/40',
    soft: 'bg-cyan-400/10',
  },
  speed: {
    label: 'Speed',
    summary: 'Fast, accurate comparison of code.',
    glyph: '»',
    accent: 'text-amber-300',
    ring: 'border-amber-400/40',
    hoverRing: 'hover:border-amber-400/40',
    soft: 'bg-amber-400/10',
  },
  attention: {
    label: 'Attention',
    summary: 'Find the one anomaly hidden in noise.',
    glyph: '◎',
    accent: 'text-rose-300',
    ring: 'border-rose-400/40',
    hoverRing: 'hover:border-rose-400/40',
    soft: 'bg-rose-400/10',
  },
  patterns: {
    label: 'Patterns',
    summary: 'Abstract rules from examples and structures.',
    glyph: '◆',
    accent: 'text-emerald-300',
    ring: 'border-emerald-400/40',
    hoverRing: 'hover:border-emerald-400/40',
    soft: 'bg-emerald-400/10',
  },
};
