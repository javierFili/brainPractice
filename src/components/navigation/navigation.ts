import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: IconName;
  /** Match the path exactly (only `/`), instead of any sub-path. */
  readonly end?: boolean;
}

export interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

/** Every entry leads to a working screen (checked by the navigation tests). */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'General',
    items: [
      { to: '/', label: 'Home', icon: 'home', end: true },
      { to: '/continue', label: 'Continue training', icon: 'play' },
      { to: '/daily', label: 'Daily challenge', icon: 'calendar' },
      { to: '/progress', label: 'My progress', icon: 'chart' },
    ],
  },
  {
    title: 'Training',
    items: [
      { to: '/games', label: 'All activities', icon: 'grid', end: true },
      { to: '/quick', label: 'Quick session', icon: 'timer' },
      { to: '/train/memory', label: 'Memory', icon: 'memory' },
      { to: '/train/logic', label: 'Logic', icon: 'logic' },
      { to: '/train/attention', label: 'Attention', icon: 'attention' },
      { to: '/train/speed', label: 'Mental speed', icon: 'speed' },
      { to: '/train/patterns', label: 'Patterns', icon: 'patterns' },
      { to: '/train/spatial', label: 'Spatial reasoning', icon: 'spatial' },
      { to: '/train/concentration', label: 'Concentration', icon: 'focus' },
    ],
  },
  {
    title: 'Routes',
    items: [
      { to: '/paths/kids', label: 'Kids', icon: 'kids' },
      { to: '/paths/teens', label: 'Teens', icon: 'teens' },
      { to: '/paths/adults', label: 'Adults', icon: 'adults' },
      { to: '/paths/seniors', label: 'Seniors', icon: 'seniors' },
      { to: '/paths/programmers', label: 'Programmers', icon: 'code' },
    ],
  },
  {
    title: 'Assessment',
    items: [
      { to: '/assessment', label: 'Cognitive assessment', icon: 'assessment', end: true },
      { to: '/assessment/history', label: 'Past results', icon: 'history' },
      { to: '/assessment/profile', label: 'My performance profile', icon: 'profile' },
    ],
  },
  {
    title: 'Learning',
    items: [
      { to: '/learn', label: 'Programming logic', icon: 'learn', end: true },
      { to: '/learn/thinking', label: 'Computational thinking', icon: 'flow' },
      { to: '/train/programming', label: 'Algorithm challenges', icon: 'code' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/settings', label: 'Preferences', icon: 'settings', end: true },
      { to: '/settings/accessibility', label: 'Accessibility', icon: 'accessibility' },
      { to: '/settings/data', label: 'Reset demo data', icon: 'reset' },
    ],
  },
];
