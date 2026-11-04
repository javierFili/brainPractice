import { msg } from '@/domain/shared';
import { i18n } from '@/i18n';
import { en } from './i18n';

it('resolves in English whatever the current language', async () => {
  await i18n.changeLanguage('de');
  expect(en(msg('common:actions.next'))).toBe('Next');
  expect(i18n.language).toBe('de');
  await i18n.changeLanguage('en');
});
