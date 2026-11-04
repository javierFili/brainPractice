import type { GameCategory } from '@/domain/game';
import { msg, type Text } from '@/domain/shared';
import type { IconName } from '@/components/ui/Icon';

export interface CategoryMeta {
  readonly label: Text;
  readonly summary: Text;
  readonly icon: IconName;
  /** Literal classes so Tailwind can generate them. */
  readonly text: string;
  readonly soft: string;
  readonly ring: string;
}

export const CATEGORIES: Readonly<Record<GameCategory, CategoryMeta>> = {
  memory: {
    label: msg('common:categories.memory.label'),
    summary: msg('common:categories.memory.summary'),
    icon: 'memory',
    text: 'text-cat-memory',
    soft: 'bg-cat-memory/10',
    ring: 'border-cat-memory/40',
  },
  logic: {
    label: msg('common:categories.logic.label'),
    summary: msg('common:categories.logic.summary'),
    icon: 'logic',
    text: 'text-cat-logic',
    soft: 'bg-cat-logic/10',
    ring: 'border-cat-logic/40',
  },
  speed: {
    label: msg('common:categories.speed.label'),
    summary: msg('common:categories.speed.summary'),
    icon: 'speed',
    text: 'text-cat-speed',
    soft: 'bg-cat-speed/10',
    ring: 'border-cat-speed/40',
  },
  attention: {
    label: msg('common:categories.attention.label'),
    summary: msg('common:categories.attention.summary'),
    icon: 'attention',
    text: 'text-cat-attention',
    soft: 'bg-cat-attention/10',
    ring: 'border-cat-attention/40',
  },
  patterns: {
    label: msg('common:categories.patterns.label'),
    summary: msg('common:categories.patterns.summary'),
    icon: 'patterns',
    text: 'text-cat-patterns',
    soft: 'bg-cat-patterns/10',
    ring: 'border-cat-patterns/40',
  },
  programming: {
    label: msg('common:categories.programming.label'),
    summary: msg('common:categories.programming.summary'),
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
