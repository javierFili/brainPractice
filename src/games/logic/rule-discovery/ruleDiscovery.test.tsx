import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { ruleDiscoveryGame } from './content/definition';
import { RULE_DISCOVERY_LEVELS } from './content/levels';
import { glyphFits, glyphRules, numberFits, numberRules } from './content/rules';
import { ruleDiscoveryModule } from './index';
import { parseGlyph } from './content/parseGlyph';

describeGameContract(ruleDiscoveryModule);

describe('Rule Discovery', () => {
  it('exactly one option fits the hidden rule and every consistent considered rule', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const profile = RULE_DISCOVERY_LEVELS[level];
      for (const seed of contractSeeds(20, 31)) {
        const c = generateChallenge(ruleDiscoveryGame, { level, seed });
        if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
        const { options } = c.response.question;
        const answerId = c.response.solution.optionId;
        const { content } = c;
        if (content.kind === 'numbers') {
          const values = options.map((o) => Number(o.label));
          const rules = profile.number.considered.flatMap(numberRules);
          const consistent = rules.filter(
            (r) =>
              content.fits.every((n) => numberFits(r, n)) &&
              content.misses.every((n) => !numberFits(r, n)),
          );
          expect(consistent).toContainEqual(content.rule);
          for (const r of consistent) {
            const fitting = options.filter((_, i) => numberFits(r, values[i] as number));
            expect(fitting.map((o) => o.id)).toEqual([answerId]);
          }
        } else {
          const glyphs = options.map((o) => parseGlyph(o.label));
          expect(glyphs.every((g) => g !== null)).toBe(true);
          const rules = profile.glyph.considered.flatMap(glyphRules);
          const consistent = rules.filter(
            (r) =>
              content.fits.every((g) => glyphFits(r, g)) &&
              content.misses.every((g) => !glyphFits(r, g)),
          );
          expect(consistent).toContainEqual(content.rule);
          for (const r of consistent) {
            const fitting = options.filter((_, i) => glyphFits(r, glyphs[i] as never));
            expect(fitting.map((o) => o.id)).toEqual([answerId]);
          }
        }
      }
    }
  });

  it('considers more alternative rules as levels rise', () => {
    expectNonDecreasing(RULE_DISCOVERY_LEVELS, (p) => p.options, 'options');
    expectNonDecreasing(
      RULE_DISCOVERY_LEVELS,
      (p) => Math.max(p.glyph.considered.length, p.number.considered.length),
      'considered families',
    );
  });
});
