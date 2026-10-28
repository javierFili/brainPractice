import type { GameCategory } from '@/domain/game';
import type { IconName } from '@/components/ui/Icon';

export interface CategoryMeta {
  readonly label: string;
  readonly summary: string;
  readonly icon: IconName;
  /** Literal classes so Tailwind can generate them. */
  readonly text: string;
  readonly soft: string;
  readonly ring: string;
}

export const CATEGORIES: Readonly<Record<GameCategory, CategoryMeta>> = {
  memory: {
    label: 'Memory',
    summary: 'Hold, recall and update pictures, words, numbers and positions.',
    icon: 'memory',
    text: 'text-cat-memory',
    soft: 'bg-cat-memory/10',
    ring: 'border-cat-memory/40',
  },
  logic: {
    label: 'Logic',
    summary: 'Deduce, plan and solve puzzles with one verifiable answer.',
    icon: 'logic',
    text: 'text-cat-logic',
    soft: 'bg-cat-logic/10',
    ring: 'border-cat-logic/40',
  },
  speed: {
    label: 'Mental speed',
    summary: 'Quick, accurate decisions: react, compare and classify.',
    icon: 'speed',
    text: 'text-cat-speed',
    soft: 'bg-cat-speed/10',
    ring: 'border-cat-speed/40',
  },
  attention: {
    label: 'Attention',
    summary: 'Find targets, ignore distractions and keep focus.',
    icon: 'attention',
    text: 'text-cat-attention',
    soft: 'bg-cat-attention/10',
    ring: 'border-cat-attention/40',
  },
  patterns: {
    label: 'Patterns & spatial',
    summary: 'Discover rules, complete patterns and turn shapes in your mind.',
    icon: 'patterns',
    text: 'text-cat-patterns',
    soft: 'bg-cat-patterns/10',
    ring: 'border-cat-patterns/40',
  },
  programming: {
    label: 'Programming',
    summary: 'Trace code, track variables and hunt bugs — for programmers.',
    icon: 'code',
    text: 'text-cat-programming',
    soft: 'bg-cat-programming/10',
    ring: 'border-cat-programming/40',
  },
};

/** General categories, without the programming specialisation. */
export const GENERAL_CATEGORIES: readonly GameCategory[] = [
  'memory',
  'logic',
  'speed',
  'attention',
  'patterns',
];
