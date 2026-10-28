import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface SortedList {
  readonly kind: 'sorted';
  /** Numbers in increasing order, or words in alphabetical order, with one item out of place. */
  readonly values: readonly (number | string)[];
}

export interface ReceiptLine {
  readonly item: string;
  readonly quantity: number;
  readonly priceCents: number;
  readonly totalCents: number;
}

export interface Receipt {
  readonly kind: 'receipt';
  readonly lines: readonly ReceiptLine[];
  /** Printed grand total (an extra last row); null when the receipt has none. */
  readonly totalCents: number | null;
}

export interface ScheduleEvent {
  readonly activity: string;
  /** Minutes after midnight. */
  readonly start: number;
  readonly end: number;
  /** The stated duration in minutes. */
  readonly minutes: number;
}

export interface Schedule {
  readonly kind: 'schedule';
  readonly events: readonly ScheduleEvent[];
}

export interface SpellingList {
  readonly kind: 'spelling';
  readonly words: readonly string[];
}

export interface CopyCheck {
  readonly kind: 'copy';
  readonly pairs: readonly { readonly original: string; readonly copy: string }[];
}

export type ErrorDetectionContent = SortedList | Receipt | Schedule | SpellingList | CopyCheck;
export type ErrorKind = ErrorDetectionContent['kind'];

export type ErrorDetectionChallenge = Challenge<'attention', ErrorDetectionContent>;

export interface ErrorDetectionProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<ErrorKind, number>>>;
  /** elementCount: rows in the list (a receipt total adds one). */
  readonly items: number;
  /** Small errors: 10 cents, 5 minutes, look-alike characters, neighbouring words. */
  readonly subtle: boolean;
  /** Receipts print a grand total that must also add up. */
  readonly withTotal: boolean;
}
