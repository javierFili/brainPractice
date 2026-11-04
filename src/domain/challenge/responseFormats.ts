/**
 * How a challenge is answered, independently of what it shows. Every game reuses these formats,
 * so answer evaluation exists exactly once.
 *
 * `question` is what the player sees; `solution` is kept apart so a future server can evaluate
 * answers without ever sending the solution to the client.
 */
import type { Text } from '../shared/text';

export interface ChoiceOption {
  readonly id: string;
  readonly label: Text;
}

export interface ResponseFormats {
  /** Pick exactly one option. */
  'single-choice': {
    question: { readonly options: readonly ChoiceOption[] };
    solution: { readonly optionId: string };
    answer: { readonly optionId: string };
  };
  /** Arrange every item in the right order. */
  ordering: {
    question: { readonly items: readonly ChoiceOption[] };
    solution: { readonly order: readonly string[] };
    answer: { readonly order: readonly string[] };
  };
  /** Point at one element (line, record, cell) of the displayed content, by 0-based index. */
  locate: {
    question: { readonly itemCount: number };
    solution: { readonly index: number };
    answer: { readonly index: number };
  };
  /** Type an exact integer or decimal value. */
  numeric: {
    question: { readonly unit?: Text };
    solution: { readonly value: number };
    answer: { readonly value: number };
  };
  /**
   * Reproduce a sequence by picking symbols from a palette, in order. Symbols may repeat. The
   * answer must have exactly `length` entries.
   */
  sequence: {
    question: { readonly symbols: readonly ChoiceOption[]; readonly length: number };
    solution: { readonly sequence: readonly string[] };
    answer: { readonly sequence: readonly string[] };
  };
  /**
   * Mark a set of elements of the displayed content (cells, items, stream positions) by 0-based
   * index. Errors = missed targets + wrongly marked elements; the answer is correct when
   * errors ≤ `maxErrors`. `exactCount` (when set) is the number of marks the player must place,
   * which the UI announces; the answer must then have exactly that many marks.
   */
  'multi-select': {
    question: {
      readonly itemCount: number;
      readonly exactCount: number | null;
      readonly maxErrors: number;
    };
    solution: { readonly indices: readonly number[] };
    answer: { readonly indices: readonly number[] };
  };
  /**
   * Match hidden cards two at a time. `attempts` lists every pair of cards the player turned over,
   * in order. Correct when every pair was found with at most `maxMisses` mismatched attempts.
   */
  pairs: {
    question: { readonly itemCount: number; readonly maxMisses: number };
    solution: { readonly pairs: readonly (readonly [number, number])[] };
    answer: { readonly attempts: readonly (readonly [number, number])[] };
  };
  /**
   * React to a signal that appears `signalDelayMs` after the response window opens and stays for
   * `windowMs`. Go trials (`shouldTap`) need a tap while the signal is shown; no-go trials need
   * restraint. `reactionMs` is measured from signal onset; negative means a tap before the
   * signal (false start). Null when the player did not tap.
   */
  tap: {
    question: { readonly signalDelayMs: number; readonly windowMs: number };
    solution: { readonly shouldTap: boolean };
    answer: { readonly tapped: boolean; readonly reactionMs: number | null };
  };
}

export type ResponseFormat = keyof ResponseFormats;

export type ResponseOf<F extends ResponseFormat> = {
  readonly format: F;
  readonly question: ResponseFormats[F]['question'];
  readonly solution: ResponseFormats[F]['solution'];
};

export type Response = { [F in ResponseFormat]: ResponseOf<F> }[ResponseFormat];

export type AnswerOf<F extends ResponseFormat> = {
  readonly format: F;
} & ResponseFormats[F]['answer'];

export type Answer = { [F in ResponseFormat]: AnswerOf<F> }[ResponseFormat];
