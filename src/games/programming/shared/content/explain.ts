import { literal, type RunResult, type TraceStep, type Value } from '@/domain/pseudocode';
import { joinText, msg, type Text } from '@/domain/shared';

export interface TraceChange {
  /** 1-based source line. */
  readonly line: number;
  readonly code: string;
  /** Variables whose value changed on this step, as `name = value`. */
  readonly changes: readonly string[];
}

const same = (a: Value | undefined, b: Value | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null) &&
  (a === undefined) === (b === undefined);

/**
 * The interpreter trace as a list of steps with what changed on each one. Steps of a function
 * call are compared within their own scope, so local variables read naturally.
 */
export function traceChanges(source: string, result: RunResult): TraceChange[] {
  const lines = source.split('\n');
  const previous = new Map<string | null, TraceStep['variables']>();
  return result.trace.map((step) => {
    const before = previous.get(step.scope) ?? {};
    previous.set(step.scope, step.variables);
    const changes = Object.entries(step.variables)
      .filter(([name, value]) => !same(before[name], value))
      .map(([name, value]) => `${name} = ${literal(value)}`);
    return { line: step.line, code: (lines[step.line - 1] ?? '').trim(), changes };
  });
}

/**
 * One-paragraph, step-by-step account of a run derived from the trace: "line 1: x = 4 · line 2:
 * y = 7 …". Long runs are cut after `limit` changing steps.
 */
export function narrate(source: string, result: RunResult, limit = 10): string {
  const steps = traceChanges(source, result).filter((step) => step.changes.length > 0);
  const shown = steps
    .slice(0, limit)
    .map((step) => `line ${step.line}: ${step.changes.join(', ')}`)
    .join(' · ');
  const rest = steps.length - limit;
  return rest > 0 ? `${shown} · … (${rest} more ${rest === 1 ? 'step' : 'steps'})` : shown;
}

/**
 * `narrate` as translatable text: the same steps ("line 1: x = 4 · line 2: y = 7 …") where only
 * the word around the code is a message; the changes themselves stay literal code.
 */
export function narrateText(source: string, result: RunResult, limit = 10): Text {
  const steps = traceChanges(source, result).filter((step) => step.changes.length > 0);
  const shown: Text[] = steps
    .slice(0, limit)
    .map((step) =>
      msg('programming:shared.narrate.step', { line: step.line, changes: step.changes.join(', ') }),
    );
  const rest = steps.length - limit;
  if (rest > 0) shown.push(msg('programming:shared.narrate.more', { count: rest }));
  return joinText(shown, ' · ');
}
