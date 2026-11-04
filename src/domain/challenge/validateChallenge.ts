import type { Challenge, ChallengeTiming } from './challenge';
import type { ChoiceOption, Response } from './responseFormats';
import { isBlankText, textId } from '../shared/text';

const isPositiveOrNull = (value: number | null) =>
  value === null || (Number.isFinite(value) && value > 0);

function optionIssues(options: readonly ChoiceOption[], label: string): string[] {
  const issues: string[] = [];
  if (options.length < 2) issues.push(`${label}: at least 2 entries required`);
  if (new Set(options.map((o) => o.id)).size !== options.length)
    issues.push(`${label}: duplicate ids`);
  if (new Set(options.map((o) => textId(o.label))).size !== options.length) {
    issues.push(`${label}: duplicate labels make the challenge ambiguous`);
  }
  if (options.some((o) => isBlankText(o.label))) issues.push(`${label}: empty label`);
  return issues;
}

export function validateResponse(response: Response): string[] {
  switch (response.format) {
    case 'single-choice': {
      const { options } = response.question;
      const issues = optionIssues(options, 'options');
      if (!options.some((o) => o.id === response.solution.optionId)) {
        issues.push('solution references an unknown option');
      }
      return issues;
    }
    case 'ordering': {
      const { items } = response.question;
      const issues = optionIssues(items, 'items');
      const ids = new Set(items.map((i) => i.id));
      const { order } = response.solution;
      if (
        order.length !== items.length ||
        new Set(order).size !== order.length ||
        !order.every((id) => ids.has(id))
      ) {
        issues.push('solution must be a permutation of the items');
      }
      return issues;
    }
    case 'locate': {
      const { itemCount } = response.question;
      const { index } = response.solution;
      if (!Number.isInteger(itemCount) || itemCount < 2)
        return ['itemCount must be an integer >= 2'];
      return Number.isInteger(index) && index >= 0 && index < itemCount
        ? []
        : ['solution index out of range'];
    }
    case 'numeric':
      return Number.isFinite(response.solution.value) ? [] : ['solution must be a finite number'];
    case 'sequence': {
      const { symbols, length } = response.question;
      const issues = optionIssues(symbols, 'symbols');
      const ids = new Set(symbols.map((s) => s.id));
      const { sequence } = response.solution;
      if (!Number.isInteger(length) || length < 1) issues.push('length must be a positive integer');
      if (sequence.length !== length) issues.push('solution length differs from length');
      if (!sequence.every((id) => ids.has(id))) issues.push('solution uses an unknown symbol');
      return issues;
    }
    case 'multi-select': {
      const { itemCount, exactCount, maxErrors } = response.question;
      const { indices } = response.solution;
      const issues: string[] = [];
      if (!Number.isInteger(itemCount) || itemCount < 2) issues.push('itemCount must be >= 2');
      if (indices.length === 0) issues.push('at least one target is required');
      if (new Set(indices).size !== indices.length) issues.push('duplicate targets');
      if (!indices.every((i) => Number.isInteger(i) && i >= 0 && i < itemCount))
        issues.push('target index out of range');
      if (exactCount !== null && exactCount !== indices.length)
        issues.push('exactCount must equal the number of targets');
      if (!Number.isInteger(maxErrors) || maxErrors < 0) issues.push('maxErrors must be >= 0');
      else if (maxErrors >= indices.length)
        issues.push('maxErrors must be smaller than the number of targets');
      return issues;
    }
    case 'pairs': {
      const { itemCount, maxMisses } = response.question;
      const flat = response.solution.pairs.flat();
      const issues: string[] = [];
      if (!Number.isInteger(itemCount) || itemCount < 4 || itemCount % 2 !== 0)
        issues.push('itemCount must be an even integer >= 4');
      if (flat.length !== itemCount || new Set(flat).size !== itemCount)
        issues.push('pairs must cover every card exactly once');
      if (!flat.every((i) => Number.isInteger(i) && i >= 0 && i < itemCount))
        issues.push('pair index out of range');
      if (!Number.isInteger(maxMisses) || maxMisses < 0) issues.push('maxMisses must be >= 0');
      return issues;
    }
    case 'tap': {
      const { signalDelayMs, windowMs } = response.question;
      const issues: string[] = [];
      if (!(Number.isFinite(signalDelayMs) && signalDelayMs >= 0))
        issues.push('signalDelayMs must be >= 0');
      if (!(Number.isFinite(windowMs) && windowMs > 0)) issues.push('windowMs must be positive');
      return issues;
    }
  }
}

export function validateTiming(timing: ChallengeTiming): string[] {
  const issues: string[] = [];
  if (!isPositiveOrNull(timing.studyMs)) issues.push('studyMs must be positive or null');
  if (!isPositiveOrNull(timing.limitMs)) issues.push('limitMs must be positive or null');
  if (!(Number.isFinite(timing.targetMs) && timing.targetMs > 0))
    issues.push('targetMs must be positive');
  if (timing.limitMs !== null && timing.limitMs > 0 && timing.targetMs > timing.limitMs)
    issues.push('targetMs exceeds limitMs');
  return issues;
}

/** Structural checks every generated challenge must pass. Returns human-readable issues; empty = valid. */
export function validateChallenge(challenge: Challenge): string[] {
  const issues = [...validateResponse(challenge.response), ...validateTiming(challenge.timing)];
  if (isBlankText(challenge.prompt)) issues.push('prompt is empty');
  if (isBlankText(challenge.explanation)) issues.push('explanation is empty');
  if (challenge.skills.length === 0) issues.push('at least one skill is required');
  if (challenge.content.kind.trim() === '') issues.push('content.kind is empty');
  return issues;
}
