import { conceptId, lessonsOf, validateCourse, validateLesson } from '@/domain/learning';
import { PROGRAMMING_LOGIC } from './course';

const conceptIds = new Set(PROGRAMMING_LOGIC.concepts.map((c) => c.id));

describe('Programming Logic curriculum', () => {
  it.each(lessonsOf(PROGRAMMING_LOGIC).map((lesson) => [lesson.id, lesson] as const))(
    'lesson %s meets every content invariant',
    (_, lesson) => {
      expect(validateLesson(lesson, conceptIds)).toEqual([]);
    },
  );

  it('is a valid course as a whole (unique ids, every concept taught)', () => {
    expect(validateCourse(PROGRAMMING_LOGIC)).toEqual([]);
  });

  it('has ten lessons that each introduce their own concept', () => {
    const lessons = lessonsOf(PROGRAMMING_LOGIC);
    expect(lessons).toHaveLength(10);
    expect(lessons.map((l) => l.concepts[0])).toEqual(
      [
        'programs',
        'sequence',
        'variables',
        'conditions',
        'boolean-logic',
        'loops',
        'functions',
        'decomposition',
        'algorithms',
        'debugging',
      ].map(conceptId),
    );
  });
});
