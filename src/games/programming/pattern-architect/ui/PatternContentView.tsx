import type { ContentViewProps } from '@/games/types';
import { cellLabel, describeCell } from '../content/format';
import { formatList, LIST_VOCABULARY } from '../content/solvers/listOps';
import { formatTree } from '../content/solvers/treeOps';
import type {
  GridCell,
  ListExample,
  PatternChallenge,
  TreeExample,
  TreeNode,
} from '../content/types';
import { StructureMatchView, TreeFigure } from './Structures';

const HEADING = 'mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase';
const UNKNOWN =
  'rounded-md border border-dashed border-emerald-400/60 px-2 py-1 font-mono font-semibold text-emerald-300';

function Unknown({ label }: { label: string }) {
  return (
    <span className={UNKNOWN}>
      <span aria-hidden="true">?</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function SequenceView({ terms }: { terms: readonly number[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Sequence">
      {terms.map((term, i) => (
        <li
          key={i}
          className="rounded-md border border-slate-700 px-3 py-1.5 font-mono text-lg text-slate-100"
        >
          {term}
        </li>
      ))}
      <li className="text-lg">
        <Unknown label="Next term (unknown)" />
      </li>
    </ol>
  );
}

function GridView({ cells }: { cells: readonly (readonly (GridCell | null)[])[] }) {
  const size = cells.length;
  return (
    <table className="mx-auto border-separate border-spacing-1.5">
      <caption className="sr-only">
        Symbol grid, {size} rows by {size} columns, with one missing cell
      </caption>
      <tbody>
        {cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td
                key={c}
                className={`h-14 w-16 rounded-md border text-center align-middle sm:h-16 sm:w-24 ${cell === null ? 'border-dashed border-emerald-400/60 bg-emerald-400/5' : 'border-slate-700'}`}
              >
                {cell === null ? (
                  <span className="font-mono text-xl font-semibold text-emerald-300">
                    <span aria-hidden="true">?</span>
                    <span className="sr-only">Missing cell</span>
                  </span>
                ) : (
                  <span className="text-base tracking-tight break-all text-slate-100 sm:text-lg">
                    <span aria-hidden="true">{cellLabel(cell)}</span>
                    <span className="sr-only">{describeCell(cell)}</span>
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TransformView({
  examples,
  question,
  maxSteps,
}: {
  examples: readonly ListExample[];
  question: readonly number[];
  maxSteps: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-left font-mono text-sm">
        <caption className={`${HEADING} text-left`}>
          Examples · hidden program of up to {maxSteps} {maxSteps === 1 ? 'step' : 'steps'}
        </caption>
        <thead>
          <tr className="text-xs text-slate-400">
            <th scope="col" className="py-1 pr-4 font-semibold">
              Input
            </th>
            <th scope="col" className="sr-only">
              becomes
            </th>
            <th scope="col" className="py-1 font-semibold">
              Output
            </th>
          </tr>
        </thead>
        <tbody>
          {examples.map(({ input, output }) => (
            <tr key={formatList(input)} className="border-t border-slate-800">
              <td className="py-1.5 pr-4 text-slate-100">{formatList(input)}</td>
              <td aria-hidden="true" className="pr-4 text-emerald-300">
                →
              </td>
              <td className="py-1.5 text-slate-100">{formatList(output)}</td>
            </tr>
          ))}
          <tr className="border-t border-emerald-400/40">
            <td className="py-2 pr-4 font-semibold text-emerald-200">{formatList(question)}</td>
            <td aria-hidden="true" className="pr-4 text-emerald-300">
              →
            </td>
            <td className="py-2">
              <Unknown label="Output for the new input (unknown)" />
            </td>
          </tr>
        </tbody>
      </table>
      <details className="rounded-lg border border-slate-800 p-3 text-sm text-slate-300">
        <summary className="cursor-pointer font-medium text-slate-200">Possible steps</summary>
        <ul className="mt-2 list-disc space-y-0.5 pl-5">
          {LIST_VOCABULARY.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="self-center text-lg text-emerald-300">
      →
    </span>
  );
}

function TreeAnalogyView({
  examples,
  question,
  maxSteps,
}: {
  examples: readonly TreeExample[];
  question: TreeNode;
  maxSteps: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className={HEADING}>
        Restructuring rule of up to {maxSteps} {maxSteps === 1 ? 'step' : 'steps'}
      </h3>
      <ol className="flex flex-col gap-3" aria-label="Examples">
        {examples.map(({ before, after }, i) => (
          <li
            key={formatTree(before)}
            className="grid grid-cols-[1fr_auto_1fr] gap-3 rounded-lg border border-slate-700 p-3"
          >
            <TreeFigure tree={before} label={`Example ${i + 1}, before`} />
            <Arrow />
            <TreeFigure tree={after} label={`Example ${i + 1}, after`} />
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 rounded-lg border border-emerald-400/40 bg-emerald-400/5 p-3">
        <TreeFigure tree={question} label="New tree" />
        <Arrow />
        <div className="self-center">
          <Unknown label="Restructured new tree (unknown)" />
        </div>
      </div>
    </div>
  );
}

export function PatternContentView({ challenge }: ContentViewProps<PatternChallenge>) {
  const { content } = challenge;
  switch (content.kind) {
    case 'number-sequence':
      return <SequenceView terms={content.terms} />;
    case 'symbol-grid':
      return <GridView cells={content.cells} />;
    case 'transform-inference':
      return (
        <TransformView
          examples={content.examples}
          question={content.question}
          maxSteps={content.maxSteps}
        />
      );
    case 'structure-match':
      return <StructureMatchView reference={content.reference} candidates={content.candidates} />;
    case 'tree-analogy':
      return (
        <TreeAnalogyView
          examples={content.examples}
          question={content.question}
          maxSteps={content.maxSteps}
        />
      );
  }
}
