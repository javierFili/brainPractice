import { mulberry32, toSeed } from '@/domain/random';
import { isAsymmetric } from '../shared/content';
import { pieceSignature, randomPiece, shapeClass, toGrid } from './content/polyomino';

describe('pieceSignature', () => {
  it('agrees with the grid-based shape class and asymmetry check', () => {
    const random = mulberry32(toSeed(5));
    const byFast = new Map<string, string>();
    for (let i = 0; i < 300; i++) {
      const cells = randomPiece(random, 4 + (i % 4));
      const grid = toGrid(cells);
      const fast = pieceSignature(cells);
      expect(fast.asymmetric).toBe(isAsymmetric(grid));
      const slow = shapeClass(grid);
      // Same piece class ⇔ same fast class.
      const seen = byFast.get(fast.kind);
      if (seen !== undefined) expect(seen).toBe(slow);
      byFast.set(fast.kind, slow);
    }
    expect(new Set(byFast.values()).size).toBe(byFast.size);
  });
});
