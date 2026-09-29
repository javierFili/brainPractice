import { codeScanModule } from './code-scan';
import { logicModule } from './logic';
import type { GameModule } from './types';

/** The single place where games are enumerated. Order = display order. */
export const GAME_MODULES: readonly GameModule[] = [logicModule, codeScanModule];
