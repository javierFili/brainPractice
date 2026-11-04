import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { rapidSymbolMatchingGame, SAME_DIFFERENT } from './content/definition';
import { SYMBOL_MATCH_LEVELS } from './content/levels';
import { poolSymbols, spokenString, symbolsOf } from './content/symbols';
import { POOL_ORDER } from './content/types';
import { rapidSymbolMatchingModule } from './index';
import { SymbolMatchView } from './ui/SymbolMatchView';
import { en } from '@/test/i18n';

describeGameContract(rapidSymbolMatchingModule);

const all = sweep(rapidSymbolMatchingGame, 60);

describe('Rapid Symbol Matching content', () => {
  it('answers same/different by plain string equality, with a fixed key order', () => {
    for (const { challenge } of all) {
      const { content, response } = challenge;
      if (content.kind !== 'same-different') continue;
      if (response.format !== 'single-choice') throw new Error('choice expected');
      expect(response.question.options.map((o) => o.label)).toEqual([...SAME_DIFFERENT]);
      const picked = response.question.options.find((o) => o.id === response.solution.optionId);
      expect(en(picked?.label ?? '')).toBe(
        content.other === content.reference ? 'Same' : 'Different',
      );
    }
  });

  it('has exactly one exact copy among the candidates', () => {
    for (const { level, challenge } of all) {
      const { content, response } = challenge;
      if (content.kind !== 'find-match') continue;
      if (response.format !== 'single-choice') throw new Error('choice expected');
      const { options } = response.question;
      expect(options).toHaveLength(SYMBOL_MATCH_LEVELS[level].optionCount);
      const copies = options.filter((o) => o.label === content.reference);
      expect(copies).toHaveLength(1);
      expect(copies[0]?.id).toBe(response.solution.optionId);
      // Distractors are the same length and built from the same symbols.
      for (const o of options)
        expect(symbolsOf(en(o.label))).toHaveLength(symbolsOf(content.reference).length);
    }
  });

  it('uses only the level’s symbols, length and number of changes', () => {
    for (const { level, challenge } of all) {
      const p = SYMBOL_MATCH_LEVELS[level];
      const symbols = new Set(poolSymbols(p.pool));
      const { reference, other } = challenge.content;
      expect(symbolsOf(reference)).toHaveLength(p.length);
      expect(symbolsOf(reference).every((ch) => symbols.has(ch))).toBe(true);
      if (other !== null && other !== reference) {
        const diff = symbolsOf(other).filter((ch, i) => ch !== symbolsOf(reference)[i]).length;
        expect(diff).toBeGreaterThanOrEqual(Math.min(p.changes, 2));
      }
    }
  });

  it('has about half "same" trials', () => {
    const sd = all.filter(({ challenge }) => challenge.content.kind === 'same-different');
    const same = sd.filter(
      ({ challenge }) => challenge.content.other === challenge.content.reference,
    );
    expect(same.length / sd.length).toBeGreaterThan(0.4);
    expect(same.length / sd.length).toBeLessThan(0.6);
  });

  it('gets longer and subtler across levels', () => {
    expectDistinctLevels(SYMBOL_MATCH_LEVELS);
    expectNonDecreasing(SYMBOL_MATCH_LEVELS, (p) => p.length, 'length');
    expectNonDecreasing(SYMBOL_MATCH_LEVELS, (p) => p.optionCount, 'candidates');
    expectNonDecreasing(SYMBOL_MATCH_LEVELS, (p) => POOL_ORDER.indexOf(p.pool), 'look-alikes');
    expectNonDecreasing(SYMBOL_MATCH_LEVELS, (p) => -p.changes, 'subtlety');
    expectNonDecreasing(SYMBOL_MATCH_LEVELS, (p) => p.mutations.length, 'mutations');
  });

  it('spells strings out for screen readers', () => {
    expect(en(spokenString('bQ★'))).toBe('small b, capital Q, star');
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(rapidSymbolMatchingGame)).toBeLessThan(5);
  });
});

describe('Rapid Symbol Matching view', () => {
  it('shows both strings with spoken names in same/different trials', () => {
    const challenge = generateChallenge(rapidSymbolMatchingGame, { level: 2, seed: toSeed(4) });
    render(
      <SymbolMatchView
        challenge={challenge}
        phase="respond"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(
      screen.getAllByText(en(spokenString(challenge.content.reference))).length,
    ).toBeGreaterThan(0);
  });
});
