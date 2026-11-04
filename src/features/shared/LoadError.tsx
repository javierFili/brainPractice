import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function LoadError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation('home');
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger/10 p-5 text-sm text-ink-soft"
    >
      <p className="font-semibold text-danger">{t('errors.load.title')}</p>
      <p className="mt-1">{t('errors.load.body')}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          {t('common:actions.retry')}
        </Button>
      )}
    </div>
  );
}
