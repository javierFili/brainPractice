import { Link } from 'react-router';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { isLevelCleared } from '@/domain/progress';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { AREAS } from '@/features/shared/areas';
import { useProgress } from '@/features/shared/useProgress';

export function CatalogPage() {
  const { modules, progress } = useServices();
  const { state } = useProgress(progress);

  return (
    <>
      <PageHeader
        eyebrow="Games"
        title="Choose what to train"
        description="One game per cognitive area. Every game has ten levels designed around a specific cognitive goal."
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {modules.map(({ definition }) => {
          const meta = AREAS[definition.area];
          const game = state.status === 'ready' ? state.progress.games[definition.id] : undefined;
          const cleared = DIFFICULTY_LEVELS.filter((level) => isLevelCleared(game?.[level])).length;
          return (
            <li key={definition.id}>
              <Link
                to={`/games/${definition.id}`}
                className={`group flex h-full flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:${meta.ring} hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-sky-400`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold tracking-widest uppercase ${meta.accent}`}
                  >
                    <span aria-hidden="true">{meta.glyph} </span>
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{cleared}/10 cleared</span>
                </div>
                <h2 className="text-xl font-semibold text-white">{definition.name}</h2>
                <p className="text-sm text-slate-400">{definition.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {definition.skills.map((skill) => (
                    <Badge key={skill}>{skill.replace('-', ' ')}</Badge>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
