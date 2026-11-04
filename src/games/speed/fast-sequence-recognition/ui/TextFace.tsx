import type { Text } from '@/domain/shared';
import { useText } from '@/i18n';

/** A digit or letter candidate in spaced monospace. */
export function TextFace({ label }: { readonly label: Text }) {
  const tx = useText();
  return <span className="font-mono text-xl tracking-[0.3em] text-ink">{tx(label)}</span>;
}
