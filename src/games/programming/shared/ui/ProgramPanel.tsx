import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/code/CodeBlock';
import type { Variables } from '@/domain/pseudocode';
import type { ChallengePhase } from '@/games/types';
import { TraceTable } from './TraceTable';

interface Props {
  readonly source: string;
  readonly phase: ChallengePhase;
  readonly label?: string;
  readonly caption?: ReactNode;
  readonly highlight?: readonly number[];
  readonly inputs?: Variables;
  /** Show the interpreter trace in review (default true). */
  readonly trace?: boolean;
  /** Extra material under the code (question details). */
  readonly children?: ReactNode;
}

/** A program (scrolling inside its own box on narrow screens) plus its trace once answered. */
export function ProgramPanel({
  source,
  phase,
  label = 'Program',
  caption,
  highlight,
  inputs,
  trace = true,
  children,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <CodeBlock
        source={source}
        label={label}
        {...(caption === undefined ? {} : { caption })}
        {...(highlight === undefined ? {} : { highlight })}
      />
      {children}
      {phase === 'review' && trace && (
        <TraceTable source={source} {...(inputs ? { inputs } : {})} />
      )}
    </div>
  );
}
