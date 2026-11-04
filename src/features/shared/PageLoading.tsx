import { useTranslation } from 'react-i18next';

export function PageLoading() {
  const { t } = useTranslation();
  return (
    <p role="status" className="p-8 text-sm text-slate-400">
      {t('common:loading')}
    </p>
  );
}
