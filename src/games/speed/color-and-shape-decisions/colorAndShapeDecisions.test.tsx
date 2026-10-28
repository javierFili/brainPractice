import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '@/games/speed/shared/testing';
import { colorAndShapeGame } from './content/definition';
import { COLOR_SHAPE_LEVELS } from './content/levels';
import { colorAndShapeDecisionsModule } from './index';
import { ColorShapeView } from './ui/ColorShapeView';

describeGameContract(colorAndShapeDecisionsModule);

const MAPPING_RANK = { single: 0, separate: 1, shared: 2 } as const;

describe('Color and Shape Decisions content', () => {
  const all = sweep(colorAndShapeGame, 60);

  it('marks the option naming the cued feature, and only it (independent oracle)', () => {
    for (const { challenge: c } of all) {
      if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
      const { glyph, kind } = c.content;
      const value = kind === 'colour' ? glyph.color : glyph.shape;
      const matching = c.response.question.options.filter((o) =>
        o.label.split(' / ').includes(value),
      );
      expect(matching).toHaveLength(1);
      expect(matching[0]?.id).toBe(c.response.solution.optionId);
    }
  });

  it('labels congruence correctly and uses only the level’s values', () => {
    for (const { level, challenge: c } of all) {
      const { pairs, mapping } = COLOR_SHAPE_LEVELS[level];
      const { glyph, congruent, kind } = c.content;
      if (mapping === 'single') {
        // Single-rule levels: only the judged feature comes from the level's values.
        const values = pairs.map((p) => (kind === 'colour' ? p.color : p.shape));
        expect(values).toContain(kind === 'colour' ? glyph.color : glyph.shape);
        expect(glyph.color).not.toBe('green');
        continue;
      }
      const ci = pairs.findIndex((p) => p.color === glyph.color);
      const si = pairs.findIndex((p) => p.shape === glyph.shape);
      expect(ci).toBeGreaterThanOrEqual(0);
      expect(si).toBeGreaterThanOrEqual(0);
      expect(congruent).toBe(ci === si);
    }
  });

  it('mixes both rules only from level 3, and keeps the keys fixed within a level', () => {
    for (const level of [1, 2] as const) {
      const rules = new Set(
        all.filter((e) => e.level === level).map((e) => e.challenge.content.kind),
      );
      expect(rules.size).toBe(1);
    }
    for (const level of [3, 6, 10] as const) {
      const entries = all.filter((e) => e.level === level);
      expect(new Set(entries.map((e) => e.challenge.content.kind)).size).toBe(2);
      const keySets = new Set(
        entries.map((e) =>
          e.challenge.response.format === 'single-choice'
            ? e.challenge.response.question.options.map((o) => o.label).join('|')
            : '',
        ),
      );
      expect(keySets.size).toBe(1);
    }
  });

  it('shows conflicting stimuli at roughly the planned share', () => {
    const share = (level: 5 | 10) => {
      const entries = all.filter((e) => e.level === level);
      return entries.filter((e) => !e.challenge.content.congruent).length / entries.length;
    };
    expect(share(10)).toBeGreaterThan(share(5));
  });

  it('progresses: mapping, conflict, values and limits', () => {
    expectDistinctLevels(COLOR_SHAPE_LEVELS);
    expectNonDecreasing(COLOR_SHAPE_LEVELS, (p) => MAPPING_RANK[p.mapping], 'mapping');
    expectNonDecreasing(COLOR_SHAPE_LEVELS, (p) => p.incongruentShare, 'incongruent share');
    expectNonDecreasing(COLOR_SHAPE_LEVELS, (p) => p.pairs.length, 'values');
    expectNonDecreasing(COLOR_SHAPE_LEVELS, (p) => -(p.timing.limitMs ?? 0), 'limit');
    for (const p of Object.values(COLOR_SHAPE_LEVELS)) {
      const colors = p.pairs.map((pair) => pair.color);
      expect(colors.includes('red') && colors.includes('green')).toBe(false);
    }
  });

  it('generates fast', () => {
    expect(meanGenerationMs(colorAndShapeGame)).toBeLessThan(5);
  });
});

describe('Color and Shape view', () => {
  it('writes the cue and names the shape with colour and shape', () => {
    const c = generateChallenge(colorAndShapeGame, { level: 6, seed: toSeed(5) });
    render(
      <ColorShapeView
        challenge={c}
        phase="respond"
        locate={null}
        respond={() => undefined}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByText(c.content.kind === 'colour' ? 'COLOUR' : 'SHAPE')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: `${c.content.glyph.color} ${c.content.glyph.shape}` }),
    ).toBeInTheDocument();
  });
});
