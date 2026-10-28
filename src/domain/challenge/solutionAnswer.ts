import type { Answer, Response } from './responseFormats';

/**
 * The answer that solves a response. Used by tests and by the assessment's sanity checks: every
 * generated challenge must accept its own solution.
 */
export function solutionAnswer(response: Response): Answer {
  switch (response.format) {
    case 'single-choice':
      return { format: 'single-choice', optionId: response.solution.optionId };
    case 'ordering':
      return { format: 'ordering', order: response.solution.order };
    case 'locate':
      return { format: 'locate', index: response.solution.index };
    case 'numeric':
      return { format: 'numeric', value: response.solution.value };
    case 'sequence':
      return { format: 'sequence', sequence: response.solution.sequence };
    case 'multi-select':
      return { format: 'multi-select', indices: response.solution.indices };
    case 'pairs':
      return { format: 'pairs', attempts: response.solution.pairs };
    case 'tap':
      return response.solution.shouldTap
        ? { format: 'tap', tapped: true, reactionMs: Math.min(250, response.question.windowMs) }
        : { format: 'tap', tapped: false, reactionMs: null };
  }
}
