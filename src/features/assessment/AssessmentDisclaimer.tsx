import { Trans, useTranslation } from 'react-i18next';

export function AssessmentDisclaimer() {
  const { t } = useTranslation('assessment');
  return (
    <aside
      aria-labelledby="disclaimer-title"
      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300"
    >
      <h2 id="disclaimer-title" className="mb-2 font-semibold text-white">
        {t('disclaimer.title')}
      </h2>
      <p>{t('disclaimer.what')}</p>
      <p className="mt-2">
        <Trans t={t} i18nKey="disclaimer.not" components={{ strong: <strong /> }} />
      </p>
    </aside>
  );
}
