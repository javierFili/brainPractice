import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/ui/Button';

export function NotFound({ message }: { message?: string }) {
  const { t } = useTranslation('home');
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">{t('errors.notFound.title')}</h1>
      <p className="mt-2 text-slate-400">{message ?? t('errors.notFound.message')}</p>
      <ButtonLink to="/games" className="mt-6">
        {t('errors.notFound.browse')}
      </ButtonLink>
    </div>
  );
}
