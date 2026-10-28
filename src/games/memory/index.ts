import type { GameModule } from '../types';
import { associationMemoryModule } from './association-memory';
import { dualMemoryChallengeModule } from './dual-memory-challenge';
import { memoryCardsModule } from './memory-cards';
import { numberRecallModule } from './number-recall';
import { objectRecallModule } from './object-recall';
import { positionMemoryModule } from './position-memory';
import { sequenceRecallModule } from './sequence-recall';
import { visualChangesModule } from './visual-changes';
import { wordRecallModule } from './word-recall';
import { workingMemoryGridModule } from './working-memory-grid';

/** Memory category, in catalog order. */
export const MEMORY_GAMES: readonly GameModule[] = [
  memoryCardsModule,
  sequenceRecallModule,
  positionMemoryModule,
  objectRecallModule,
  numberRecallModule,
  wordRecallModule,
  visualChangesModule,
  associationMemoryModule,
  workingMemoryGridModule,
  dualMemoryChallengeModule,
];
