/** Breadth-first search on a square maze with 4-way moves. Pure helpers shared by generator and view. */

export interface Maze {
  readonly size: number;
  readonly walls: ReadonlySet<number>;
}

export const rowOf = (cell: number, size: number) => Math.floor(cell / size);
export const colOf = (cell: number, size: number) => cell % size;

export function neighbours({ size, walls }: Maze, cell: number): number[] {
  const r = rowOf(cell, size);
  const c = colOf(cell, size);
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (c < size - 1) out.push(cell + 1);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  return out.filter((n) => !walls.has(n));
}

/** Steps from `from` to every cell (Infinity when unreachable) and a BFS parent for routes. */
export function distances(maze: Maze, from: number) {
  const dist = new Array<number>(maze.size * maze.size).fill(Number.POSITIVE_INFINITY);
  const parent = new Array<number>(maze.size * maze.size).fill(-1);
  dist[from] = 0;
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head] as number;
    for (const next of neighbours(maze, cell)) {
      if (dist[next] !== Number.POSITIVE_INFINITY) continue;
      dist[next] = (dist[cell] as number) + 1;
      parent[next] = cell;
      queue.push(next);
    }
  }
  return { dist, parent };
}

export const manhattan = (a: number, b: number, size: number) =>
  Math.abs(rowOf(a, size) - rowOf(b, size)) + Math.abs(colOf(a, size) - colOf(b, size));

/** A shortest route from the BFS source to `to`, written as runs: "right 2, down 3". */
export function routeWords(parent: readonly number[], to: number): string {
  const cells = [to];
  while ((parent[cells[0] as number] ?? -1) !== -1)
    cells.unshift(parent[cells[0] as number] as number);
  const moves = cells.slice(1).map((cell, i) => {
    const prev = cells[i] as number;
    if (cell === prev + 1) return 'right';
    if (cell === prev - 1) return 'left';
    return cell > prev ? 'down' : 'up';
  });
  const runs: { move: string; n: number }[] = [];
  for (const move of moves) {
    const last = runs.at(-1);
    if (last?.move === move) last.n++;
    else runs.push({ move, n: 1 });
  }
  return runs.map((r) => `${r.move} ${r.n}`).join(', ');
}

export const cellName = (cell: number, size: number) =>
  `row ${rowOf(cell, size) + 1}, column ${colOf(cell, size) + 1}`;

export const exitLabel = (i: number) => `Exit ${String.fromCharCode(65 + i)}`;
export const markLabel = (i: number) => `Cell ${i + 1}`;
