import type { GameCategory, GameDefinition } from '@/domain/game';
import { msg, type Skill, type Text } from '@/domain/shared';
import type { IconName } from '@/components/ui/Icon';
import { CATEGORIES } from '@/features/shared/categories';

/**
 * A browsable set of games: a catalog category, or a cross-category view by skill (spatial
 * reasoning and concentration span several categories).
 */
export interface Collection {
  readonly id: string;
  readonly title: Text;
  readonly description: Text;
  readonly icon: IconName;
  readonly category: GameCategory | null;
  readonly includes: (game: GameDefinition) => boolean;
}

const bySkills =
  (skills: readonly Skill[]) =>
  (game: GameDefinition): boolean =>
    game.skills.some((skill) => skills.includes(skill));

const categoryCollection = (category: GameCategory): Collection => ({
  id: category,
  title: CATEGORIES[category].label,
  description: CATEGORIES[category].summary,
  icon: CATEGORIES[category].icon,
  category,
  includes: (game) => game.meta.category === category,
});

export const COLLECTIONS: readonly Collection[] = [
  categoryCollection('memory'),
  categoryCollection('logic'),
  categoryCollection('speed'),
  categoryCollection('attention'),
  categoryCollection('patterns'),
  {
    id: 'spatial',
    title: msg('catalog:collections.spatial.title'),
    description: msg('catalog:collections.spatial.description'),
    icon: 'spatial',
    category: null,
    includes: (game) =>
      game.meta.category !== 'programming' &&
      bySkills(['spatial-reasoning', 'visual-orientation'])(game),
  },
  {
    id: 'concentration',
    title: msg('catalog:collections.concentration.title'),
    description: msg('catalog:collections.concentration.description'),
    icon: 'focus',
    category: null,
    includes: (game) =>
      game.meta.category !== 'programming' &&
      bySkills(['concentration', 'sustained-attention'])(game),
  },
  categoryCollection('programming'),
];

export const collectionById = (id: string | undefined) => COLLECTIONS.find((c) => c.id === id);
