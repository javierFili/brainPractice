import { useTranslation } from 'react-i18next';
import type { Text } from '@/domain/shared';
import { useText } from '@/i18n';

/** The "?" placeholder for the part the player must find. */
export function Missing({
  label,
  className = 'h-12 w-12 sm:h-14 sm:w-14',
}: {
  /** Accessible name; defaults to "Missing (this is what you choose)". */
  readonly label?: Text;
  readonly className?: string;
}) {
  const { t } = useTranslation('patterns');
  const tx = useText();
  return (
    <span
      role="img"
      aria-label={label === undefined ? t('shared.missing') : tx(label)}
      className={`flex ${className} items-center justify-center rounded-lg border-2 border-dashed border-glow/70 bg-glow/10 text-2xl font-bold text-glow`}
    >
      <span aria-hidden="true">?</span>
    </span>
  );
}
