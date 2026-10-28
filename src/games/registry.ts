import { ATTENTION_GAMES } from './attention';
import { LOGIC_GAMES } from './logic';
import { MEMORY_GAMES } from './memory';
import { PATTERNS_GAMES } from './patterns';
import { PROGRAMMING_GAMES } from './programming';
import { SPEED_GAMES } from './speed';
import type { GameModule } from './types';

/** The single place where games are enumerated. Order = display order (category by category). */
export const GAME_MODULES: readonly GameModule[] = [
  ...MEMORY_GAMES,
  ...LOGIC_GAMES,
  ...SPEED_GAMES,
  ...ATTENTION_GAMES,
  ...PATTERNS_GAMES,
  ...PROGRAMMING_GAMES,
];
