import { err, ok, type Result } from '../shared/result';
import type { Program } from './ast';
import { parseProgram, type ParseError } from './parse';
import { runProgram, type RunResult, type Variables } from './run';

/** Parses and runs in one go; content tests and playgrounds use this. */
export function execute(
  source: string,
  inputs: Variables = {},
): Result<RunResult & { readonly program: Program }, ParseError> {
  const parsed = parseProgram(source);
  if (!parsed.ok) return err(parsed.error);
  return ok({ ...runProgram(parsed.value, { inputs }), program: parsed.value });
}

/** Like `execute`, but for content known to be valid: a syntax error is a bug in the content. */
export function executeOrThrow(source: string, inputs: Variables = {}): RunResult {
  const result = execute(source, inputs);
  if (!result.ok)
    throw new Error(
      `Line ${result.error.line}: ${JSON.stringify(result.error.message)}\n${source}`,
    );
  return result.value;
}
