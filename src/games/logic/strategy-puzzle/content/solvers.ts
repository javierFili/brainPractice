/** Game and search solvers. Every answer of Strategy Puzzle comes from one of these. */

// ── Take-away and piles: win/lose by exhaustive game search ─────────────────────────────────────

/** True when the player to move can force taking the last coin. */
export function takeAwayWins(
  pile: number,
  maxTake: number,
  memo = new Map<number, boolean>(),
): boolean {
  if (pile === 0) return false;
  const cached = memo.get(pile);
  if (cached !== undefined) return cached;
  let win = false;
  for (let t = 1; t <= Math.min(maxTake, pile) && !win; t++)
    win = !takeAwayWins(pile - t, maxTake, memo);
  memo.set(pile, win);
  return win;
}

export interface PileMove {
  readonly pile: number;
  readonly take: number;
}

export function pileMoves(piles: readonly number[]): PileMove[] {
  return piles.flatMap((size, pile) =>
    Array.from({ length: size }, (_, i) => ({ pile, take: i + 1 })),
  );
}

export const applyPileMove = (piles: readonly number[], m: PileMove) =>
  piles.map((size, i) => (i === m.pile ? size - m.take : size));

export function pilesWin(piles: readonly number[], memo = new Map<string, boolean>()): boolean {
  const key = [...piles].sort((a, b) => a - b).join(',');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const win = pileMoves(piles).some((m) => !pilesWin(applyPileMove(piles, m), memo));
  memo.set(key, win);
  return win;
}

// ── Jugs: breadth-first search over water levels ────────────────────────────────────────────────

export interface JugStep {
  readonly action: string;
  readonly state: readonly number[];
}

function jugNext(state: readonly number[], caps: readonly number[], tap: boolean): JugStep[] {
  const out: JugStep[] = [];
  const name = (i: number) => `the ${caps[i]}-litre jug`;
  state.forEach((v, i) => {
    if (tap && v < (caps[i] as number))
      out.push({
        action: `fill ${name(i)}`,
        state: state.map((x, k) => (k === i ? (caps[i] as number) : x)),
      });
    if (tap && v > 0)
      out.push({ action: `empty ${name(i)}`, state: state.map((x, k) => (k === i ? 0 : x)) });
    state.forEach((w, j) => {
      if (i === j || v === 0 || w === caps[j]) return;
      const amount = Math.min(v, (caps[j] as number) - w);
      out.push({
        action: `pour ${name(i)} into ${name(j)}`,
        state: state.map((x, k) => (k === i ? x - amount : k === j ? x + amount : x)),
      });
    });
  });
  return out;
}

/** Shortest list of moves until some jug holds exactly `target` litres; null if impossible. */
export function solveJugs(
  caps: readonly number[],
  start: readonly number[],
  tap: boolean,
  target: number,
): JugStep[] | null {
  const key = (s: readonly number[]) => s.join(',');
  const parent = new Map<string, { from: string; step: JugStep } | null>([[key(start), null]]);
  let frontier: (readonly number[])[] = [start];
  const done = (s: readonly number[]) => s.includes(target);
  let found: readonly number[] | null = done(start) ? start : null;
  while (frontier.length > 0 && !found) {
    const next: (readonly number[])[] = [];
    for (const s of frontier) {
      for (const step of jugNext(s, caps, tap)) {
        const k = key(step.state);
        if (parent.has(k)) continue;
        parent.set(k, { from: key(s), step });
        if (done(step.state)) {
          found = step.state;
          break;
        }
        next.push(step.state);
      }
      if (found) break;
    }
    frontier = next;
  }
  if (!found) return null;
  const path: JugStep[] = [];
  let k = key(found);
  for (let link = parent.get(k); link; link = parent.get(k)) {
    path.unshift(link.step);
    k = link.from;
  }
  return path;
}

// ── Sliding tiles: breadth-first search from the goal ───────────────────────────────────────────

export const slidingGoal = (rows: number, cols: number) =>
  Array.from({ length: rows * cols }, (_, i) => (i === rows * cols - 1 ? 0 : i + 1));

function slideNeighbours(
  board: readonly number[],
  rows: number,
  cols: number,
): { tile: number; board: number[] }[] {
  const gap = board.indexOf(0);
  const r = Math.floor(gap / cols);
  const c = gap % cols;
  const out: { tile: number; board: number[] }[] = [];
  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    const j = nr * cols + nc;
    const next = [...board];
    next[gap] = board[j] as number;
    next[j] = 0;
    out.push({ tile: board[j] as number, board: next });
  }
  return out;
}

const slidingCache = new Map<string, Map<string, number>>();

/** Distance (minimum moves) to the goal for every reachable board. */
export function slidingDistances(rows: number, cols: number): Map<string, number> {
  const id = `${rows}x${cols}`;
  const cached = slidingCache.get(id);
  if (cached) return cached;
  const goal = slidingGoal(rows, cols);
  const dist = new Map<string, number>([[goal.join(','), 0]]);
  let frontier = [goal];
  for (let d = 1; frontier.length > 0; d++) {
    const next: number[][] = [];
    for (const board of frontier)
      for (const { board: n } of slideNeighbours(board, rows, cols)) {
        const k = n.join(',');
        if (!dist.has(k)) {
          dist.set(k, d);
          next.push(n);
        }
      }
    frontier = next;
  }
  slidingCache.set(id, dist);
  return dist;
}

/** One shortest solution: the tiles to slide, in order. */
export function slidingPath(start: readonly number[], rows: number, cols: number): number[] {
  const dist = slidingDistances(rows, cols);
  const tiles: number[] = [];
  let board = [...start];
  let d = dist.get(board.join(',')) as number;
  while (d > 0) {
    const step = slideNeighbours(board, rows, cols).find(
      (n) => dist.get(n.board.join(',')) === d - 1,
    );
    if (!step) throw new Error('Broken distance table');
    tiles.push(step.tile);
    board = step.board;
    d--;
  }
  return tiles;
}
