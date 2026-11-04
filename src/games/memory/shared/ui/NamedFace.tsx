import type { ReactNode } from 'react';
import type { ChoiceOption } from '@/domain/challenge';
import { useText } from '@/i18n';

/** A picture next to the option's label, resolved in the reader's language. */
export function NamedFace({ option, picture }: { option: ChoiceOption; picture: ReactNode }) {
  const tx = useText();
  return (
    <span className="inline-flex items-center gap-2">
      {picture}
      <span aria-hidden="true">{tx(option.label)}</span>
    </span>
  );
}
