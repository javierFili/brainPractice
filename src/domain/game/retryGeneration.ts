import { DomainError } from '../shared/errors';

export class GenerationExhaustedError extends DomainError {
  constructor(what: string, attempts: number) {
    super('GENERATION_EXHAUSTED', `Could not generate ${what} in ${attempts} attempts`);
  }
}

/**
 * Runs `build` until it returns a candidate (non-null). Generators return null for candidates that
 * fail a quality check (ambiguous, trivial, out of range). Deterministic: every attempt consumes
 * the same seeded stream. Throws instead of ever returning a low-quality challenge.
 */
export function retryGeneration<T>(what: string, build: () => T | null, maxAttempts = 200): T {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = build();
    if (candidate !== null) return candidate;
  }
  throw new GenerationExhaustedError(what, maxAttempts);
}
