import { Link } from 'react-router';
import { useCourse } from '@/app/providers/useCourse';
import { lessonsOf } from '@/domain/learning';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';

/** The four ideas of computational thinking, each linked to the lessons and games that use it. */
const IDEAS = [
  {
    title: 'Decomposition',
    text: 'Split a big problem into small steps you can solve one at a time.',
    concepts: ['decomposition', 'functions'],
    games: [
      ['algorithm-construction', 'Algorithm Construction'],
      ['strategy-puzzle', 'Strategy Puzzle'],
    ],
  },
  {
    title: 'Pattern recognition',
    text: 'Notice what repeats, so one solution can serve many cases.',
    concepts: ['loops', 'lists'],
    games: [
      ['rule-discovery', 'Rule Discovery'],
      ['visual-pattern-completion', 'Visual Pattern Completion'],
    ],
  },
  {
    title: 'Abstraction',
    text: 'Keep what matters and leave out the details that do not change the answer.',
    concepts: ['variables', 'functions'],
    games: [
      ['matrix-reasoning', 'Matrix Reasoning'],
      ['abstract-pattern-challenge', 'Abstract Pattern Challenge'],
    ],
  },
  {
    title: 'Algorithms',
    text: 'Write exact, ordered instructions that always reach the result.',
    concepts: ['sequence', 'conditions', 'algorithms', 'debugging'],
    games: [
      ['algorithmic-reasoning', 'Algorithmic Reasoning'],
      ['sequence-ordering', 'Sequence Ordering'],
    ],
  },
] as const;

export function ThinkingPage() {
  const course = useCourse();
  const lessons = lessonsOf(course);
  return (
    <>
      <PageHeader
        eyebrow="Learning"
        title="Computational thinking"
        description="Four ways of thinking that programmers use — and that are useful without writing any code. Each links to lessons of the course and to games that use the same idea."
        actions={<ButtonLink to="/learn">Open the course</ButtonLink>}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {IDEAS.map((idea) => {
          const related = lessons.filter((l) =>
            l.concepts.some((c) => (idea.concepts as readonly string[]).includes(c)),
          );
          return (
            <li
              key={idea.title}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <h2 className="text-lg font-semibold text-ink">{idea.title}</h2>
              <p className="text-ink-soft">{idea.text}</p>
              {related.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Lessons
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {related.map((l) => (
                      <li key={l.id}>
                        <Link to={`/learn/${l.id}`} className="text-brand hover:underline">
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Practise without code
                </p>
                <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                  {idea.games.map(([id, name]) => (
                    <li key={id}>
                      <Link
                        to={`/games/${id}`}
                        className="rounded-lg border border-line bg-raised px-2 py-1 text-ink hover:border-brand"
                      >
                        {name}
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
