import type { IconName } from '@/components/ui/Icon';
import { msg, type Text } from '@/domain/shared';

export interface NavItem {
  readonly to: string;
  readonly label: Text;
  readonly icon: IconName;
  /** Match the path exactly (only `/`), instead of any sub-path. */
  readonly end?: boolean;
}

export interface NavSection {
  /** Stable id (React key, tests); the heading is `title`. */
  readonly id: string;
  readonly title: Text;
  readonly items: readonly NavItem[];
}

/** Every entry leads to a working screen (checked by the navigation tests). */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'general',
    title: msg('nav:sections.general'),
    items: [
      { to: '/', label: msg('nav:items.home'), icon: 'home', end: true },
      { to: '/continue', label: msg('nav:items.continue'), icon: 'play' },
      { to: '/daily', label: msg('nav:items.daily'), icon: 'calendar' },
      { to: '/progress', label: msg('nav:items.progress'), icon: 'chart' },
    ],
  },
  {
    id: 'training',
    title: msg('nav:sections.training'),
    items: [
      { to: '/games', label: msg('nav:items.games'), icon: 'grid', end: true },
      { to: '/quick', label: msg('nav:items.quick'), icon: 'timer' },
      { to: '/train/memory', label: msg('nav:items.trainMemory'), icon: 'memory' },
      { to: '/train/logic', label: msg('nav:items.trainLogic'), icon: 'logic' },
      { to: '/train/attention', label: msg('nav:items.trainAttention'), icon: 'attention' },
      { to: '/train/speed', label: msg('nav:items.trainSpeed'), icon: 'speed' },
      { to: '/train/patterns', label: msg('nav:items.trainPatterns'), icon: 'patterns' },
      { to: '/train/spatial', label: msg('nav:items.trainSpatial'), icon: 'spatial' },
      { to: '/train/concentration', label: msg('nav:items.trainConcentration'), icon: 'focus' },
    ],
  },
  {
    id: 'routes',
    title: msg('nav:sections.routes'),
    items: [
      { to: '/paths/kids', label: msg('nav:items.pathsKids'), icon: 'kids' },
      { to: '/paths/teens', label: msg('nav:items.pathsTeens'), icon: 'teens' },
      { to: '/paths/adults', label: msg('nav:items.pathsAdults'), icon: 'adults' },
      { to: '/paths/seniors', label: msg('nav:items.pathsSeniors'), icon: 'seniors' },
      { to: '/paths/programmers', label: msg('nav:items.pathsProgrammers'), icon: 'code' },
    ],
  },
  {
    id: 'assessment',
    title: msg('nav:sections.assessment'),
    items: [
      { to: '/assessment', label: msg('nav:items.assessment'), icon: 'assessment', end: true },
      { to: '/assessment/history', label: msg('nav:items.assessmentHistory'), icon: 'history' },
      { to: '/assessment/profile', label: msg('nav:items.assessmentProfile'), icon: 'profile' },
    ],
  },
  {
    id: 'learning',
    title: msg('nav:sections.learning'),
    items: [
      { to: '/learn', label: msg('nav:items.learn'), icon: 'learn', end: true },
      { to: '/learn/thinking', label: msg('nav:items.learnThinking'), icon: 'flow' },
      { to: '/train/programming', label: msg('nav:items.trainProgramming'), icon: 'code' },
    ],
  },
  {
    id: 'settings',
    title: msg('nav:sections.settings'),
    items: [
      { to: '/settings', label: msg('nav:items.settings'), icon: 'settings', end: true },
      {
        to: '/settings/accessibility',
        label: msg('nav:items.settingsAccessibility'),
        icon: 'accessibility',
      },
      { to: '/settings/data', label: msg('nav:items.settingsData'), icon: 'reset' },
    ],
  },
];
