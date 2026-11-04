/// <reference types="node" />
import { createGameRegistry, generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { LOGIC_GAMES } from './index';

describe('Logic category', () => {
  it('registers ten untimed, explained logic games', () => {
    expect(LOGIC_GAMES).toHaveLength(10);
    expect(() => createGameRegistry(LOGIC_GAMES.map((m) => m.definition))).not.toThrow();
    for (const { definition } of LOGIC_GAMES) {
      expect(definition.meta.category).toBe('logic');
      expect(definition.area).toBe('logic');
      expect(definition.meta.feedback).toBe('explain');
      expect(definition.simpleInstructions).toBeTruthy();
      expect(definition.instructions.length).toBeGreaterThanOrEqual(3);
      expect(definition.instructions.length).toBeLessThanOrEqual(5);
      for (const level of DIFFICULTY_LEVELS) {
        const profile = definition.levels[level];
        expect(profile.timing.limitMs).toBeNull();
        expect(profile.challengeCount).toBeGreaterThanOrEqual(3);
        expect(profile.challengeCount).toBeLessThanOrEqual(8);
      }
    }
  });

  // Coverage instrumentation slows every line down; the budget is checked in normal runs.
  it.skipIf(process.env['COVERAGE'] === '1')(
    'generates challenges fast (under 5 ms on average per game)',
    () => {
      const seeds = contractSeeds(10, 555);
      for (const { definition } of LOGIC_GAMES) {
        // Warm caches (permutation tables, sliding distances) once, as a real session would.
        generateChallenge(definition, { level: 10, seed: seeds[0] as never });
        // Best of three runs, so a busy machine does not hide a real regression or fake one.
        const runs = [0, 1, 2].map(() => {
          // CPU time of this process, so other test workers competing for cores do not count.
          const start = process.cpuUsage();
          let count = 0;
          for (const level of DIFFICULTY_LEVELS)
            for (const seed of seeds) {
              generateChallenge(definition, { level, seed });
              count++;
            }
          const used = process.cpuUsage(start);
          return (used.user + used.system) / 1000 / count;
        });
        const average = Math.min(...runs);
        expect(average, `${definition.id}: ${average.toFixed(2)} ms`).toBeLessThan(5);
      }
    },
  );

  it('never mentions programming syntax in the copy', () => {
    for (const { definition } of LOGIC_GAMES) {
      const text = [definition.description, ...definition.instructions].map(en).join(' ');
      expect(text).not.toMatch(/[{}=←]|\bvar\b|\bfunction\b|\bwhile\b/);
    }
  });
});
