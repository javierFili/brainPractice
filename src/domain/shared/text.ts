/**
 * Translatable text. The domain never knows the reader's language: anything a person reads is a
 * `Message` (a translation key plus the values to interpolate) that the UI resolves when it
 * renders. Because resolution happens at render time, switching language re-renders the same
 * challenge, options and explanation together, without regenerating or resetting anything.
 *
 * A plain `string` is literal content that must never be translated (code, numbers, symbols).
 */
export interface Message {
  /** `namespace:path.to.key`, e.g. `memory:sequenceRecall.prompt.forward`. */
  readonly key: string;
  readonly values?: Readonly<Record<string, TextValue>>;
}

/**
 * Several texts shown as one: joined with `separator` (`a → b → c`), or, without one, as a natural
 * list in the reader's language ("a, b and c", "a, b y c", "a, b und c").
 */
export interface TextList {
  readonly list: readonly Text[];
  readonly separator?: string;
}

export type Text = string | Message | TextList;

/** Interpolated values: numbers stay numbers so plurals and number formats work per language. */
export type TextValue = number | Text;

export const msg = (key: string, values?: Readonly<Record<string, TextValue>>): Message =>
  values === undefined ? { key } : { key, values };

export const joinText = (list: readonly Text[], separator?: string): TextList =>
  separator === undefined ? { list } : { list, separator };

export const isTextList = (text: unknown): text is TextList =>
  typeof text === 'object' && text !== null && Array.isArray((text as { list?: unknown }).list);

export const isMessage = (text: unknown): text is Message =>
  typeof text === 'object' &&
  text !== null &&
  !Array.isArray(text) &&
  typeof (text as { key?: unknown }).key === 'string';

/** Stable identity for comparisons (duplicates, React keys); never shown to people. */
export const textId = (text: Text): string =>
  typeof text === 'string' ? text : JSON.stringify(text);

/** True for empty literals; a message is never empty (its translations are checked by tests). */
export const isBlankText = (text: Text): boolean =>
  typeof text === 'string'
    ? text.trim() === ''
    : 'list' in text
      ? text.list.every(isBlankText)
      : text.key.trim() === '';
