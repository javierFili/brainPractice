import { courseId, moduleId, type Course } from '@/domain/learning';
import { CONCEPTS } from './concepts';
import { lesson as lesson01 } from './lessons/01-what-is-a-program';
import { lesson as lesson02 } from './lessons/02-instructions-and-sequences';
import { lesson as lesson03 } from './lessons/03-values-and-variables';
import { lesson as lesson04 } from './lessons/04-conditions';
import { lesson as lesson05 } from './lessons/05-logical-operators';
import { lesson as lesson06 } from './lessons/06-loops';
import { lesson as lesson07 } from './lessons/07-functions';
import { lesson as lesson08 } from './lessons/08-problem-decomposition';
import { lesson as lesson09 } from './lessons/09-algorithms';
import { lesson as lesson10 } from './lessons/10-debugging';

/** Programming Logic: thinking before syntax. Module 1 is the first, free part of the path. */
export const PROGRAMMING_LOGIC: Course = {
  id: courseId('programming-logic'),
  title: 'Programming Logic',
  summary:
    'Learn how programs think — values, decisions, repetition, functions and algorithms — in a language-neutral pseudocode, before any specific syntax.',
  concepts: CONCEPTS,
  modules: [
    {
      id: moduleId('how-programs-think'),
      title: 'How Programs Think',
      summary: 'From what a program is to designing and debugging your first algorithms.',
      lessons: [
        lesson01,
        lesson02,
        lesson03,
        lesson04,
        lesson05,
        lesson06,
        lesson07,
        lesson08,
        lesson09,
        lesson10,
      ],
    },
  ],
};
