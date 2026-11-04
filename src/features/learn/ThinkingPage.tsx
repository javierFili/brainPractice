import { Link } from 'react-router';
import { useCourse } from '@/app/providers/useCourse';
import { lessonsOf } from '@/domain/learning';
import { useTranslation } from 'react-i18next';
import { useServices } from '@/app/providers/servicesContext';
import { useText } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';

/**
 * The four ideas of computational thinking, each linked to the lessons and games that use it.
 * Titles and texts: `learn:thinking.ideas.<key>.title|text`; game names come from the games.
 */
const IDEAS = [
  {
    key: 'decomposition',
    concepts: ['decomposition', 'functions'],
    games: ['algorithm-construction', 'strategy-puzzle'],
  },
  {
    key: 'patterns',
    concepts: ['loops', 'lists'],
    games: ['rule-discovery', 'visual-pattern-completion'],
  },
  {
    key: 'abstraction',
    concepts: ['variables', 'functions'],
    games: ['matrix-reasoning', 'abstract-pattern-challenge'],
  },
  {
    key: 'algorithms',
    concepts: ['sequence', 'conditions', 'algorithms', 'debugging'],
    games: ['algorithmic-reasoning', 'sequence-ordering'],
  },
] as const;

export function ThinkingPage() {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const { getModule } = useServices();
  const course = useCourse();
  const lessons = lessonsOf(course);
  return (
    <>
      <PageHeader
        eyebrow={t('thinking.eyebrow')}
        title={t('thinking.title')}
        description={t('thinking.description')}
        actions={<ButtonLink to="/learn">{t('thinking.openCourse')}</ButtonLink>}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {IDEAS.map((idea) => {
          const related = lessons.filter((l) =>
            l.concepts.some((c) => (idea.concepts as readonly string[]).includes(c)),
          );
          return (
            <li
              key={idea.key}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <h2 className="text-lg font-semibold text-ink">
                {t(`thinking.ideas.${idea.key}.title`)}
              </h2>
              <p className="text-ink-soft">{t(`thinking.ideas.${idea.key}.text`)}</p>
              {related.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t('thinking.lessons')}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {related.map((l) => (
                      <li key={l.id}>
                        <Link to={`/learn/${l.id}`} className="text-brand hover:underline">
                          {tx(l.title)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {t('thinking.practise')}
                </p>
                <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                  {idea.games.map((id) => (
                    <li key={id}>
                      <Link
                        to={`/games/${id}`}
                        className="rounded-lg border border-line bg-raised px-2 py-1 text-ink hover:border-brand"
                      >
                        {tx(getModule(id)?.definition.name ?? id)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
