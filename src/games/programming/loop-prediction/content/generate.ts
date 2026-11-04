import { numericResponse } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, weightedPick, type RandomGenerator } from '@/domain/random';
import { msg } from '@/domain/shared';
import {
  compile,
  isInteger,
  narrateText,
  numberChoice,
  runTraced,
  type DraftOf,
} from '../../shared/content';
import { supports, TEMPLATES, type LoopProgram } from './templates';
import type { LoopChallenge, LoopKind, LoopProfile } from './types';

type Draft = DraftOf<LoopChallenge>;

const MAX_ANSWER = 400;
const MAX_TRACE = 600;

/** Times `line` ran, read from the interpreter trace. */
export const runsOf = (trace: readonly { line: number }[], line: number) =>
  trace.filter((step) => step.line === line).length;

function pickKind(
  random: RandomGenerator,
  profile: LoopProfile,
  program: LoopProgram,
): LoopKind | null {
  const kinds = Object.fromEntries(
    Object.entries(profile.kinds).filter(([kind]) => supports(program, kind as LoopKind)),
  ) as Partial<Record<LoopKind, number>>;
  return Object.keys(kinds).length === 0 ? null : weightedPick(random, kinds);
}

function candidate(random: RandomGenerator, profile: LoopProfile): Draft | null {
  const structure = weightedPick(random, profile.structures);
  const program = pick(random, TEMPLATES[structure])(random, profile.maxIterations);
  const kind = pickKind(random, profile, program);
  if (kind === null) return null;
  const source = program.lines.join('\n');
  const compiled = compile(source);
  if (compiled === null) return null;
  const result = runTraced(compiled);
  if (result.error !== null || result.trace.length >= MAX_TRACE) return null;

  const respond = (value: number) =>
    profile.answer === 'numeric' ? numericResponse(value) : numberChoice(random, value);
  const steps = narrateText(source, result, 14);
  const base = { structure, source };

  if (kind === 'iterations') {
    const runs = runsOf(result.trace, program.countLine);
    if (runs < 2 || runs > 40) return null;
    return {
      prompt: msg('programming:loopPrediction.prompt.iterations', { line: program.countLine }),
      content: { ...base, kind, line: program.countLine, ask: null },
      response: respond(runs),
      explanation: msg('programming:loopPrediction.explanation.iterations', {
        line: program.countLine,
        count: runs,
        steps,
      }),
      skills: ['algorithmic-thinking', 'pattern-recognition'],
    };
  }
  if (kind === 'final-value') {
    const ask = pick(random, program.vars);
    const value = result.variables[ask];
    if (!isInteger(value) || Math.abs(value) > MAX_ANSWER) return null;
    // A value equal to its starting literal would let the loop be skipped entirely.
    const start = program.lines.find((l) => l.startsWith(`${ask} = `))?.split(' = ')[1];
    if (start === String(value)) return null;
    return {
      prompt: msg('programming:loopPrediction.prompt.finalValue', { name: ask }),
      content: { ...base, kind, line: null, ask },
      response: respond(value),
      explanation: msg('programming:loopPrediction.explanation.finalValue', {
        name: ask,
        value,
        steps,
      }),
      skills: ['algorithmic-thinking', 'working-memory'],
    };
  }
  const output = result.output;
  const last = Number(output.at(-1));
  if (output.length < 2 || !Number.isInteger(last) || Math.abs(last) > MAX_ANSWER) return null;
  const shown = output.length > 12 ? `${output.slice(0, 11).join(', ')}, …` : output.join(', ');
  return {
    prompt: msg('programming:loopPrediction.prompt.lastOutput'),
    content: { ...base, kind, line: null, ask: null },
    response: respond(last),
    explanation: msg('programming:loopPrediction.explanation.lastOutput', {
      shown,
      count: output.length,
      last,
      steps,
    }),
    skills: ['algorithmic-thinking', 'sequential-thinking'],
  };
}

export const generateLoop = (random: RandomGenerator, profile: LoopProfile): Draft =>
  retryGeneration('loop-prediction', () => candidate(random, profile));
