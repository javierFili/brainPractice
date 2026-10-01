import { Link } from 'react-router';
import type { CognitiveLink } from '@/domain/learning';
import { useServices } from '@/app/providers/servicesContext';
import { AREAS } from '@/features/shared/areas';

/** TRAIN ↔ LEARN: optional cognitive practice related to what was just learned. */
export function TrainingLinks({
  links,
  title = 'Train the skills behind it',
}: {
  links: readonly CognitiveLink[];
  title?: string;
}) {
  const { getModule } = useServices();
  const unique = links
    .filter((link, i) => links.findIndex((l) => l.gameId === link.gameId) === i)
    .slice(0, 3);
  if (unique.length === 0) return null;
  return (
    <section aria-labelledby="training-title" className="flex flex-col gap-3">
      <h2 id="training-title" className="text-lg font-semibold text-white">
        {title}
      </h2>
      <p className="text-sm text-slate-400">
        Optional, a few minutes each. Practice, not a requirement.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {unique.map((link) => {
          const meta = AREAS[link.area];
          return (
            <li key={link.gameId}>
              <Link
                to={`/games/${link.gameId}/play/${link.level}`}
                className={`flex h-full flex-col gap-1 rounded-lg border ${meta.ring} ${meta.soft} p-3 text-sm transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-sky-400`}
              >
                <span className={`text-xs font-semibold tracking-widest uppercase ${meta.accent}`}>
                  <span aria-hidden="true">{meta.glyph} </span>
                  {meta.label}
                </span>
                <span className="font-medium text-white">
                  {getModule(link.gameId)?.definition.name ?? link.gameId} · level {link.level}
                </span>
                <span className="text-slate-300">{link.why}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
