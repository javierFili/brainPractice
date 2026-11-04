import type { ChoiceOption } from '@/domain/challenge';
import { isSymbolString, spokenString } from '../content/symbols';

/** Candidates in the same large monospace face as the reference; Same / Different are words. */
export const renderSymbolOption = (option: ChoiceOption) =>
  typeof option.label === 'string' && isSymbolString(option.label) ? (
    <span className="block font-mono text-2xl tracking-[0.25em] text-ink">{option.label}</span>
  ) : undefined;

/** Receives the label as shown; only symbol strings are spelled out. */
export const describeSymbolOption = (label: string) =>
  isSymbolString(label) ? spokenString(label) : undefined;
