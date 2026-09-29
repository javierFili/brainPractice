import { bugHunterModule } from './bug-hunter';
import { codeMemoryModule } from './code-memory';
import { codeScanModule } from './code-scan';
import { logicModule } from './algorithmic-logic';
import { patternArchitectModule } from './pattern-architect';
import type { GameModule } from './types';

/** The single place where games are enumerated. Order = display order. */
export const GAME_MODULES: readonly GameModule[] = [
  logicModule,
  codeMemoryModule,
  codeScanModule,
  bugHunterModule,
  patternArchitectModule,
];
