import { toSeed } from '../random/seed';
import { isCognitiveArea } from './cognitiveArea';
import { challengeIdOf, gameIdOf, InvalidGameIdError } from './ids';

describe('ids', () => {
  it.each(['logic', 'code-memory', 'bug-hunter2'])('accepts kebab-case game id %s', (id) => {
    expect(gameIdOf(id)).toBe(id);
  });

  it.each(['', 'Logic', 'code_memory', '-logic', 'logic-', 'a--b', '2logic', 'with space'])(
    'rejects game id %j',
    (id) => {
      expect(() => gameIdOf(id)).toThrow(InvalidGameIdError);
    },
  );

  it('builds a challenge id that encodes how to regenerate it', () => {
    expect(challengeIdOf(gameIdOf('logic'), 7, toSeed(12345))).toBe('logic:7:12345');
  });

  it('recognises cognitive areas', () => {
    expect(isCognitiveArea('patterns')).toBe(true);
    expect(isCognitiveArea('math')).toBe(false);
    expect(isCognitiveArea(1)).toBe(false);
  });
});
