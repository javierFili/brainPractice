import { COGNITIVE_AREAS } from '@/domain/shared';
import { ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';

export function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6 pt-6 sm:pt-12">
        <p className="font-mono text-sm text-sky-300">// cognitive training for programmers</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Train your programming mind.
        </h1>
        <p className="max-w-2xl text-lg text-slate-400">
          Short, demanding exercises for the thinking behind code: decomposition, abstraction,
          working memory, attention to detail and algorithmic reasoning. Ten levels per game, from
          fundamentals to expert.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/games">Start training</ButtonLink>
          <ButtonLink to="/assessment" variant="secondary">
            Take the assessment
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="areas-title">
        <h2
          id="areas-title"
          className="mb-4 text-sm font-semibold tracking-widest text-slate-400 uppercase"
        >
          Five cognitive areas
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COGNITIVE_AREAS.map((area) => {
            const meta = AREAS[area];
            return (
              <li key={area} className={`rounded-xl border ${meta.ring} ${meta.soft} p-4`}>
                <p className={`font-mono text-2xl ${meta.accent}`} aria-hidden="true">
                  {meta.glyph}
                </p>
                <h3 className="mt-2 font-semibold text-white">{meta.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{meta.summary}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
