import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeClock } from '@/test/fakes/FakeClock';
import { choiceLabels, seedWhereFirst, sessionChallenge } from '@/test/challenges';
import { renderApp } from '@/test/renderApp';
import { i18n } from './i18n';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Language } from './languages';
import {
  browserLanguageStorage,
  detectLanguage,
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
} from './preference';
import { resolveText } from './text';

/** The navbar selector (the first one; Settings has another). */
const selector = () => screen.getAllByRole('combobox', { name: i18n.t('nav:language.label') })[0];

const choose = async (user: ReturnType<typeof userEvent.setup>, language: Language) => {
  await user.selectOptions(selector() as HTMLElement, LANGUAGE_NAMES[language]);
  await waitFor(() => {
    expect(i18n.language).toBe(language);
  });
};

const HOME_LINK: Record<Language, string> = {
  es: 'Inicio',
  en: 'Home',
  it: 'Home',
  fr: 'Accueil',
  de: 'Start',
};

describe('language selector', () => {
  it('sits in the navbar, names every language in itself and marks the current one', async () => {
    renderApp('/');
    const banner = await screen.findByRole('banner');
    const select = within(banner).getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    const options = within(select).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'Español',
      'English',
      'Italiano',
      'Français',
      'Deutsch',
    ]);
    expect(options.map((o) => o.getAttribute('lang'))).toEqual([...SUPPORTED_LANGUAGES]);
  });

  it.each(SUPPORTED_LANGUAGES)('switches the whole interface to %s in place', async (language) => {
    const user = userEvent.setup();
    const { router } = renderApp('/progress');
    await screen.findByRole('navigation', { name: 'Main' });
    await choose(user, language);
    const nav = screen.getByRole('navigation', { name: i18n.t('nav:landmarks.main') });
    expect(within(nav).getByRole('link', { name: HOME_LINK[language] })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(language);
    expect(document.title).toBe(i18n.t('nav:app.title'));
    expect(selector()).toHaveValue(language);
    // Same screen, no navigation.
    expect(router.state.location.pathname).toBe('/progress');
  });

  it('remembers the choice across navigation and reloads, over the browser language', async () => {
    const user = userEvent.setup();
    const first = renderApp('/');
    await screen.findByRole('navigation', { name: 'Main' });
    await choose(user, 'it');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('it');

    await user.click(
      within(screen.getByRole('navigation', { name: 'Principale' })).getByRole('link', {
        name: 'Tutte le attività',
      }),
    );
    await waitFor(() => {
      expect(first.router.state.location.pathname).toBe('/games');
    });
    expect(selector()).toHaveValue('it');
    first.unmount();

    // A reload runs detection again: the stored choice wins over a German browser.
    expect(detectLanguage(readStoredLanguage(browserLanguageStorage()), ['de-DE'])).toBe('it');
    await act(async () => {
      await i18n.changeLanguage(
        detectLanguage(readStoredLanguage(browserLanguageStorage()), ['de-DE']),
      );
    });
    renderApp('/games');
    const nav = await screen.findByRole('navigation', { name: 'Principale' });
    expect(within(nav).getByRole('link', { name: 'Tutte le attività' })).toBeInTheDocument();
    expect(selector()).toHaveValue('it');
  });

  it('is part of the mobile menu drawer too', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    const select = within(drawer).getByRole('combobox', { name: 'Language' });
    await user.selectOptions(select, 'Français');
    await waitFor(() => {
      expect(i18n.language).toBe('fr');
    });
    // The drawer stays open and is now in French.
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
  });
});

describe('switching language during a game', () => {
  const PATH = '/games/algorithmic-logic/play';
  const seed = seedWhereFirst(1, 'single-choice');

  beforeAll(async () => {
    await import('@/features/play/PlayPage');
  });

  it('keeps the challenge, score and progress, and changes question, options and explanation together', async () => {
    const user = userEvent.setup();
    const clock = new FakeClock();
    const { router } = renderApp(`${PATH}/1?seed=${seed}`, { clock });
    const challenge = sessionChallenge(1, seed);
    const heading = await screen.findByRole('heading', {
      name: resolveText(i18n, challenge.prompt),
    });
    await waitFor(() => {
      expect(screen.getAllByRole('button').find((b) => b.textContent.includes('1'))).toBeEnabled();
    });
    const progressText = screen.getByText('1 / 6');

    await choose(user, 'de');
    // Same heading element (not remounted), now in German; options are German too.
    expect(heading).toHaveTextContent(resolveText(i18n, challenge.prompt));
    expect(heading).toBeInTheDocument();
    const { response } = challenge;
    if (response.format !== 'single-choice') throw new Error('single-choice expected');
    for (const option of response.question.options) {
      expect(
        screen.getByRole('button', { name: resolveText(i18n, option.label) }),
      ).toBeInTheDocument();
    }
    expect(progressText).toHaveTextContent('1 / 6');
    expect(router.state.location.pathname).toBe(`${PATH}/1`);

    // The answer still counts: the session was not restarted.
    clock.advance(3000);
    const correct = response.question.options.find((o) => o.id === response.solution.optionId);
    if (!correct) throw new Error('no solution');
    await user.click(screen.getByRole('button', { name: resolveText(i18n, correct.label) }));
    expect(await screen.findByText(resolveText(i18n, challenge.explanation))).toBeInTheDocument();

    // Switching again during the feedback keeps the reviewed answer and its explanation.
    await choose(user, 'es');
    expect(screen.getByText(resolveText(i18n, challenge.explanation))).toBeInTheDocument();
    expect(progressText).toHaveTextContent('1 / 6');
    expect(choiceLabels(challenge).correct).toBeTruthy();
  });
});
