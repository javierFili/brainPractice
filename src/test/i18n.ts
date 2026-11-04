import type { Resource, ResourceKey } from 'i18next';
import type { Text } from '@/domain/shared';
import { i18n, resolveText } from '@/i18n';

const files = import.meta.glob<{ default: ResourceKey }>('../i18n/locales/*/*.json', {
  eager: true,
});

/** Every locale file, loaded up front so tests render translations synchronously. */
export const ALL_RESOURCES: Resource = {};
for (const [path, module] of Object.entries(files)) {
  const match = /locales\/(\w+)\/(\w+)\.json$/.exec(path);
  if (!match) continue;
  const [, language = '', namespace = ''] = match;
  (ALL_RESOURCES[language] ??= {})[namespace] = module.default;
}

let english: typeof i18n | null = null;

/** A `Text` as an English reader sees it, for assertions on generated content. */
export const en = (text: Text): string => {
  // One English clone shares the loaded resources; cloning per call is slow in big loops.
  english ??= i18n.cloneInstance({ lng: 'en' });
  return resolveText(english, text);
};
