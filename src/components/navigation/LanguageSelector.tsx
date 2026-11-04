import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import {
  browserLanguageStorage,
  currentLanguage,
  isLanguage,
  LANGUAGE_NAMES,
  setLanguage,
  SUPPORTED_LANGUAGES,
} from '@/i18n';

/**
 * Interface language picker. A native select: one tap opens the system list on phones, arrow keys
 * and type-ahead work on desktop, and screen readers announce it as "Language, combo box, Español".
 * Languages are named in themselves (no flags: a flag is a country, not a language), and each
 * option carries its `lang` so it is pronounced correctly.
 */
export function LanguageSelector({ className = '' }: { readonly className?: string }) {
  const { t } = useTranslation('nav');
  const id = useId();
  const language = currentLanguage();
  return (
    <div
      className={`relative flex items-center rounded-lg border border-line bg-surface text-sm text-ink-soft focus-within:outline-2 focus-within:outline-brand hover:bg-raised ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        {t('language.label')}
      </label>
      <Icon name="globe" className="pointer-events-none absolute left-2.5 h-4 w-4 text-ink-muted" />
      <select
        id={id}
        value={language}
        lang={language}
        onChange={(event) => {
          const next = event.target.value;
          if (isLanguage(next)) void setLanguage(next, browserLanguageStorage());
        }}
        className="w-full cursor-pointer appearance-none rounded-lg bg-transparent py-2 pr-8 pl-8 text-ink outline-none"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code} lang={code} className="bg-surface text-ink">
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2.5 h-4 w-4 text-ink-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="m6 9.5 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
