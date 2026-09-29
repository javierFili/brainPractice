export const COGNITIVE_AREAS = ['logic', 'memory', 'speed', 'attention', 'patterns'] as const;

export type CognitiveArea = (typeof COGNITIVE_AREAS)[number];

export const isCognitiveArea = (value: unknown): value is CognitiveArea =>
  typeof value === 'string' && (COGNITIVE_AREAS as readonly string[]).includes(value);
