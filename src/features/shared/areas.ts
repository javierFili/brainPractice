import { msg, type CognitiveArea, type Text } from '@/domain/shared';

export interface AreaMeta {
  readonly label: Text;
  readonly summary: Text;
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
    label: msg('common:areas.logic.label'),
    summary: msg('common:areas.logic.summary'),
    glyph: '⋀',
    accent: 'text-violet-300',
    ring: 'border-violet-400/40',
    hoverRing: 'hover:border-violet-400/40',
    soft: 'bg-violet-400/10',
  },
  memory: {
    label: msg('common:areas.memory.label'),
    summary: msg('common:areas.memory.summary'),
    glyph: '▦',
    accent: 'text-cyan-300',
    ring: 'border-cyan-400/40',
    hoverRing: 'hover:border-cyan-400/40',
    soft: 'bg-cyan-400/10',
  },
  speed: {
    label: msg('common:areas.speed.label'),
    summary: msg('common:areas.speed.summary'),
    glyph: '»',
    accent: 'text-amber-300',
    ring: 'border-amber-400/40',
    hoverRing: 'hover:border-amber-400/40',
    soft: 'bg-amber-400/10',
  },
  attention: {
    label: msg('common:areas.attention.label'),
    summary: msg('common:areas.attention.summary'),
    glyph: '◎',
    accent: 'text-rose-300',
    ring: 'border-rose-400/40',
    hoverRing: 'hover:border-rose-400/40',
    soft: 'bg-rose-400/10',
  },
  patterns: {
    label: msg('common:areas.patterns.label'),
    summary: msg('common:areas.patterns.summary'),
    glyph: '◆',
    accent: 'text-emerald-300',
    ring: 'border-emerald-400/40',
    hoverRing: 'hover:border-emerald-400/40',
    soft: 'bg-emerald-400/10',
  },
};
