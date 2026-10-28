import type { ChoiceOption } from '@/domain/challenge';
import { spokenString } from '../content/symbols';

/** Candidates in the same large monospace face as the reference. */
export const renderSymbolOption = (option: ChoiceOption) =>
  option.label === 'Same' || option.label === 'Different' ? undefined : (
    <span className="block font-mono text-2xl tracking-[0.25em] text-ink">{option.label}</span>
  );

export const describeSymbolOption = (label: string) =>
  label === 'Same' || label === 'Different' ? undefined : spokenString(label);
