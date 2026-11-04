import type { ChoiceOption } from '@/domain/challenge';
import { useText } from '@/i18n';

/** Large tabular numerals on the answer buttons. */
export function NumberFace({ option }: { readonly option: ChoiceOption }) {
  const tx = useText();
  return (
    <span className="block py-1 text-center font-mono text-2xl font-semibold text-ink tabular-nums">
      {tx(option.label)}
    </span>
  );
}
