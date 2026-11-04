import { act, render } from '@testing-library/react';
import { solutionAnswer, type Challenge } from '@/domain/challenge';
import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS, isMessage, type Text } from '@/domain/shared';
import { GAME_MODULES } from '@/games/registry';
import type { GameModule } from '@/games/types';
import { contractSeeds } from '@/test/gameContract';
import { i18n, missingKeys } from './i18n';
import { SUPPORTED_LANGUAGES } from './languages';
import { resolveText } from './text';

/**
 * Translation coverage of every game: each text a game defines or generates must resolve in all
 * five languages, without missing keys, leftover placeholders or English left in other languages.
 */

/** Text that must come from the translation files (never a plain English string). */
function definitionTexts(module: GameModule): [string, Text][] {
  const { definition, kindLabels } = module;
  return [
    ['name', definition.name],
    ['tagline', definition.tagline],
    ['description', definition.description],
    ...definition.instructions.map((text, i): [string, Text] => [`instructions.${i}`, text]),
    ...(definition.simpleInstructions
      ? [['simpleInstructions', definition.simpleInstructions] as [string, Text]]
      : []),
    ['meta.scoringSummary', definition.meta.scoringSummary],
    ...(definition.meta.accessibilityNotes
      ? [['meta.accessibilityNotes', definition.meta.accessibilityNotes] as [string, Text]]
      : []),
    ...DIFFICULTY_LEVELS.map((level): [string, Text] => [
      `levels.${level}.objective`,
      definition.levels[level].objective,
    ]),
    ...Object.entries(kindLabels).map(([kind, label]): [string, Text] => [
      `kindLabels.${kind}`,
      label,
    ]),
  ];
}

function challengeTexts(challenge: Challenge): { translated: [string, Text][]; labels: Text[] } {
  const translated: [string, Text][] = [
    ['prompt', challenge.prompt],
    ['explanation', challenge.explanation],
  ];
  if (challenge.studyPrompt !== undefined) translated.push(['studyPrompt', challenge.studyPrompt]);
  const { response } = challenge;
  const labels =
    response.format === 'single-choice'
      ? response.question.options.map((o) => o.label)
      : response.format === 'ordering'
        ? response.question.items.map((o) => o.label)
        : response.format === 'sequence'
          ? response.question.symbols.map((o) => o.label)
          : [];
  if (response.format === 'numeric' && response.question.unit !== undefined) {
    labels.push(response.question.unit);
  }
  return { translated, labels };
}

const LEFTOVER = /\{\{|\$t\(|undefined|\[object Object\]/;

/** Three lower-case English words in a row: prose that should have been a message. */
const ENGLISH_PROSE =
  /\b(?:the|a|an|is|are|of|to|in|on|and|which|your|this)\s+[a-z]{2,}\s+[a-z]{2,}\b/;

function samples(module: GameModule) {
  const seeds = contractSeeds(3, 4242);
  return DIFFICULTY_LEVELS.flatMap((level) =>
    seeds.map((seed) => generateChallenge(module.definition, { level, seed })),
  );
}

describe.each(GAME_MODULES.map((module) => [module.definition.id, module] as const))(
  '%s · translations',
  (_id, module) => {
    let challenges: Challenge[] = [];
    const programming = module.definition.meta.category === 'programming';

    beforeAll(() => {
      challenges = samples(module);
    });

    afterAll(async () => {
      await i18n.changeLanguage('en');
    });

    it('defines every text as a translatable message', () => {
      for (const [path, text] of definitionTexts(module)) {
        expect(isMessage(text), `${path} is a plain string`).toBe(true);
      }
      for (const challenge of challenges) {
        for (const [path, text] of challengeTexts(challenge).translated) {
          expect(typeof text, `level ${challenge.level} ${path} is a plain string`).not.toBe(
            'string',
          );
        }
        if (programming) continue;
        for (const label of challengeTexts(challenge).labels) {
          if (typeof label !== 'string') continue;
          expect(
            label,
            `level ${challenge.level} option label looks like English prose`,
          ).not.toMatch(ENGLISH_PROSE);
        }
      }
    });

    it.each(SUPPORTED_LANGUAGES)('resolves completely in %s', async (language) => {
      await i18n.changeLanguage(language);
      missingKeys.clear();
      const all: [string, Text][] = [
        ...definitionTexts(module),
        ...challenges.flatMap((challenge) => {
          const { translated, labels } = challengeTexts(challenge);
          return [
            ...translated.map(([path, text]): [string, Text] => [
              `level ${challenge.level} ${path}`,
              text,
            ]),
            ...labels.map((text, i): [string, Text] => [
              `level ${challenge.level} label ${i}`,
              text,
            ]),
          ];
        }),
      ];
      for (const [path, text] of all) {
        const resolved = resolveText(i18n, text);
        expect(resolved.trim(), `${language} ${path}`).not.toBe('');
        expect(resolved, `${language} ${path}`).not.toMatch(LEFTOVER);
      }
      expect([...missingKeys], `${language}: missing keys`).toEqual([]);
    });

    it('shows option labels that stay distinct in every language', async () => {
      for (const language of SUPPORTED_LANGUAGES) {
        await i18n.changeLanguage(language);
        for (const challenge of challenges) {
          const { labels } = challengeTexts(challenge);
          if (challenge.response.format === 'numeric') continue;
          const resolved = labels.map((label) => resolveText(i18n, label));
          expect(
            new Set(resolved).size,
            `${language} level ${challenge.level}: ${resolved.join(' | ')}`,
          ).toBe(resolved.length);
        }
      }
    });

    it('renders its content without English outside code (German)', async () => {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
      missingKeys.clear();
      const { ContentView } = module;
      for (const challenge of challenges.filter((_, i) => i % 3 === 0)) {
        for (const phase of ['respond', 'review'] as const) {
          const view = render(
            <ContentView
              challenge={challenge}
              phase={phase}
              locate={null}
              respond={phase === 'respond' ? () => undefined : null}
              answer={phase === 'review' ? solutionAnswer(challenge.response) : null}
              assisted={false}
            />,
          );
          for (const node of view.container.querySelectorAll('code, pre, kbd, .font-mono')) {
            node.remove();
          }
          const spoken = [...view.container.querySelectorAll('[aria-label]')]
            .map((node) => node.getAttribute('aria-label') ?? '')
            .join(' ');
          const text = `${view.container.textContent} ${spoken}`;
          // Code is removed above, so what remains is prose and must be German here.
          expect(text, `level ${challenge.level} ${phase}`).not.toMatch(
            /\b(?:the|your|which|tap|select|choose|press|row|column|empty|correct|shown|answer)\b/i,
          );
          expect(text, `level ${challenge.level} ${phase}`).not.toMatch(LEFTOVER);
          view.unmount();
        }
      }
      expect([...missingKeys], 'missing keys while rendering').toEqual([]);
    });
  },
);
