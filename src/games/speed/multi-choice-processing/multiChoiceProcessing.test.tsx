import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { directionLabel, directionsOf, multiChoiceProcessingGame } from './content/definition';
import { FLANKER_LEVELS } from './content/levels';
import { multiChoiceProcessingModule } from './index';
import { FlankerView } from './ui/FlankerView';

describeGameContract(multiChoiceProcessingModule);

const all = sweep(multiChoiceProcessingGame, 60);

describe('Multi-Choice Processing content', () => {
  it('answers the centre arrow, or the outer arrows under the OUTER cue (independent oracle)', () => {
    for (const { level, challenge } of all) {
      const { row, rule } = challenge.content;
      const middle = (row.length - 1) / 2;
      const centre = row[middle];
      const outer = row.filter((_, i) => i !== middle);
      // Outer arrows always agree with each other.
      expect(new Set(outer).size).toBeLessThanOrEqual(1);
      const expected = rule === 'centre' ? centre : outer[0];
      if (expected === undefined || expected === 'none') throw new Error('no answer arrow');
      const { response } = challenge;
      if (response.format !== 'single-choice') throw new Error('choice expected');
      const { options } = response.question;
      expect(options.map((o) => o.label)).toEqual(
        directionsOf(FLANKER_LEVELS[level].directionCount).map(directionLabel),
      );
      expect(options.find((o) => o.id === response.solution.optionId)?.label).toEqual(
        directionLabel(expected),
      );
      expect(row).toHaveLength(FLANKER_LEVELS[level].rowLength);
      expect(challenge.content.start + row.length).toBeLessThanOrEqual(challenge.content.track);
      expect(challenge.content.track).toBeLessThanOrEqual(7);
    }
  });

  it('labels congruence from the row', () => {
    for (const { challenge } of all) {
      const { row, congruence, kind } = challenge.content;
      if (kind === 'single') continue;
      const middle = (row.length - 1) / 2;
      const flank = row[middle === 0 ? 1 : 0];
      const actual =
        flank === 'none' ? 'neutral' : flank === row[middle] ? 'congruent' : 'incongruent';
      expect(congruence).toBe(actual);
    }
  });

  it('raises conflict, directions, row length and rule mixing across levels', () => {
    expectDistinctLevels(FLANKER_LEVELS);
    expectNonDecreasing(FLANKER_LEVELS, (p) => p.incongruentShare, 'conflict');
    expectNonDecreasing(FLANKER_LEVELS, (p) => p.directionCount, 'directions');
    expectNonDecreasing(FLANKER_LEVELS, (p) => p.rowLength, 'row length');
    expectNonDecreasing(FLANKER_LEVELS, (p) => p.outerShare, 'outer rule');
    const conflict = (level: 4 | 10) =>
      all.filter((e) => e.level === level && e.challenge.content.congruence === 'incongruent')
        .length / 60;
    expect(conflict(10)).toBeGreaterThan(conflict(4));
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(multiChoiceProcessingGame)).toBeLessThan(5);
  });
});

describe('Multi-Choice Processing view', () => {
  it('writes the cue and reads the row as directions', () => {
    const challenge = generateChallenge(multiChoiceProcessingGame, { level: 9, seed: toSeed(8) });
    render(
      <FlankerView
        challenge={challenge}
        phase="respond"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(
      screen.getByText(challenge.content.rule === 'centre' ? 'CENTRE' : 'OUTER'),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Row of 7: /)).toBeInTheDocument();
  });
});
