import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { formatAssignment } from '../content/format';
import { trace } from '../content/solvers/state';
import type { Assignment, ContentOf, MemoryChallenge } from '../content/types';
import { KeywordGrid } from './KeywordGrid';
import { RecordList, RecordTable } from './RecordViews';

const HEADING = 'mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase';

/** Shown while answering: the material is gone and has to come from memory. */
function HiddenMaterial() {
  const { t } = useTranslation('programming');
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-400/40 p-6 text-center">
      <span aria-hidden="true" className="font-mono text-2xl text-cyan-300">
        {'{ … }'}
      </span>
      <p className="text-sm text-slate-300">{t('codeMemory.view.hidden')}</p>
    </div>
  );
}

function CallSequence({
  content,
  reviewing,
}: {
  content: ContentOf<'sequence-recall'>;
  reviewing: boolean;
}) {
  const { t } = useTranslation('programming');
  const { ask, calls } = content;
  const answerIndex =
    ask.type === 'position' ? ask.index : ask.type === 'successor' ? ask.index + 1 : null;
  const clueIndex = ask.type === 'successor' ? ask.index : null;
  return (
    <div>
      <h3 className={HEADING}>{t('codeMemory.view.callsHeading')}</h3>
      <ol className="flex flex-col gap-1.5" aria-label={t('codeMemory.view.calls')}>
        {calls.map((call, i) => {
          const isAnswer = reviewing && i === answerIndex;
          const isClue = reviewing && i === clueIndex;
          return (
            <li
              key={call}
              className={`flex items-center gap-3 rounded-md border px-3 py-1.5 text-sm ${isAnswer ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-100'}`}
            >
              <span className="w-6 font-mono text-xs text-slate-500">#{i + 1}</span>
              <span className="flex-1 font-mono">{call}</span>
              {isAnswer && (
                <span className="text-xs text-cyan-300">{t('codeMemory.view.answerMark')}</span>
              )}
              {isClue && (
                <span className="text-xs text-slate-400">{t('codeMemory.view.givenCall')}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AssignmentList({
  content,
  reviewing,
}: {
  content: ContentOf<'variable-state'>;
  reviewing: boolean;
}) {
  const { t } = useTranslation('programming');
  const { lines, ask } = content;
  const states = trace(lines);
  const askedLine = ask.afterLine ?? lines.length;
  return (
    <div>
      <h3 className={HEADING}>{t('codeMemory.view.assignmentsHeading')}</h3>
      <ol className="flex flex-col gap-1 text-sm" aria-label={t('codeMemory.view.assignments')}>
        {lines.map((line: Assignment, i) => {
          const isAskedLine = reviewing && i + 1 === askedLine;
          return (
            <li
              key={`${i}-${formatAssignment(line)}`}
              className={`flex items-center gap-3 rounded-md px-2 py-1 ${isAskedLine ? 'bg-cyan-400/10 ring-1 ring-cyan-400/40' : ''}`}
            >
              <span className="w-5 text-right font-mono text-xs text-slate-500">{i + 1}</span>
              <span className="font-mono text-slate-100">
                <span className={line.target === ask.variable && reviewing ? 'text-cyan-300' : ''}>
                  {line.target}
                </span>
                {formatAssignment(line).slice(line.target.length)}
              </span>
              {reviewing && (
                <span className="ml-auto text-xs text-slate-400">
                  <span className="font-mono">
                    → {line.target} = {states[i]?.[line.target]}
                  </span>
                  {isAskedLine && (
                    <span className="ml-2 text-cyan-300">{t('codeMemory.view.askedHere')}</span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function CodeMemoryContentView({
  challenge,
  phase,
  locate,
}: ContentViewProps<MemoryChallenge>) {
  const { t } = useTranslation('programming');
  const { content } = challenge;
  const reviewing = phase === 'review';

  if (content.kind === 'position-recall') {
    return (
      <KeywordGrid
        rows={content.rows}
        cols={content.cols}
        cells={content.cells}
        phase={phase}
        locate={locate}
        answerIndex={reviewing ? content.cells.indexOf(content.target) : null}
      />
    );
  }
  if (phase === 'respond') return <HiddenMaterial />;

  switch (content.kind) {
    case 'record-recall':
      return (
        <RecordList records={content.records} {...(reviewing ? { asked: content.ask } : {})} />
      );
    case 'cross-reference': {
      const { ask, records } = content;
      const marks = [
        { row: ask.recordIndex, field: ask.keyField, label: t('codeMemory.view.mark.key') },
        {
          row: ask.recordIndex,
          field: ask.targetField,
          label: t('codeMemory.view.mark.answer'),
        },
      ];
      return (
        <RecordTable
          records={records}
          caption={t('codeMemory.view.records', { type: records[0]?.type ?? '' })}
          marks={reviewing ? marks : []}
        />
      );
    }
    case 'foreign-key-join': {
      const { ask, parents, children, foreignKey } = content;
      return (
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex-1">
            <RecordTable
              records={parents}
              caption={t('codeMemory.view.table', { type: parents[0]?.type ?? '' })}
              marks={
                reviewing
                  ? [
                      {
                        row: ask.parentIndex,
                        field: ask.keyField,
                        label: t('codeMemory.view.mark.key'),
                      },
                      {
                        row: ask.parentIndex,
                        field: 'id',
                        label: t('codeMemory.view.mark.linkedId'),
                      },
                    ]
                  : []
              }
            />
          </div>
          <div className="flex-1">
            <RecordTable
              records={children}
              caption={t('codeMemory.view.childTable', {
                type: children[0]?.type ?? '',
                link: `${foreignKey} → id`,
              })}
              marks={
                reviewing
                  ? [
                      {
                        row: ask.childIndex,
                        field: foreignKey,
                        label: t('codeMemory.view.mark.link'),
                      },
                      {
                        row: ask.childIndex,
                        field: ask.targetField,
                        label: t('codeMemory.view.mark.answer'),
                      },
                    ]
                  : []
              }
            />
          </div>
        </div>
      );
    }
    case 'sequence-recall':
      return <CallSequence content={content} reviewing={reviewing} />;
    case 'variable-state':
      return <AssignmentList content={content} reviewing={reviewing} />;
  }
}
