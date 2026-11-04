import { joinText, msg, type Text } from '@/domain/shared';

/**
 * Short, distinct, easy-to-read first names (no two share a first letter). Names are proper
 * nouns: they stay the same in every language and are never translated.
 */
export const PEOPLE = [
  'Ana',
  'Ben',
  'Cai',
  'Dev',
  'Eva',
  'Finn',
  'Gia',
  'Hugo',
  'Iris',
  'Jon',
  'Kim',
  'Leo',
  'Maya',
  'Nico',
  'Omar',
  'Pia',
  'Rosa',
  'Sam',
  'Tess',
  'Uma',
] as const;

/** "a", "a and b", "a, b and c" in the reader's language. */
export const listText = (items: readonly Text[]): Text => joinText(items);

/** "a", "a or b", "a, b or c" in the reader's language. */
export const orListText = (items: readonly Text[]): Text =>
  items.length <= 1
    ? joinText(items)
    : msg('logic:shared.or', {
        head: joinText(items.slice(0, -1), ', '),
        last: items.at(-1) as Text,
      });

/** A clause shown as a sentence on its own: "{{text}}." (punctuation per language). */
export const sentenceText = (text: Text): Text => msg('logic:shared.sentence', { text });
