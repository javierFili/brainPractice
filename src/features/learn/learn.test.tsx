import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { applyLessonResult, DAY_MS, emptyLearningProgress } from '@/domain/learning';
import { fixtureCourse, variablesLesson } from '@/test/fixtures/learningCourse';
import { FakeClock } from '@/test/fakes/FakeClock';
import { renderApp } from '@/test/renderApp';

const course = fixtureCourse;

async function next(user: UserEvent, name: RegExp = /^(Continue|Finish)/) {
  await user.click(await screen.findByRole('button', { name }));
}
async function check(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
}

/** Puts a reorderable list in the given order using its accessible move buttons. */
async function arrange(user: UserEvent, listName: string, wanted: readonly string[]) {
  for (let target = 0; target < wanted.length; target++) {
    const labels = () =>
      within(screen.getByRole('list', { name: listName }))
        .getAllByRole('listitem')
        .map((li) => li.textContent);
    let index = labels().findIndex((text) => text.includes(wanted[target] as string));
    while (index > target) {
      await user.click(screen.getByRole('button', { name: `Move ${wanted[target] as string} up` }));
      index--;
    }
  }
}

const passed = applyLessonResult(emptyLearningProgress(), variablesLesson, {
  lessonId: variablesLesson.id,
  outcomes: [],
  score: 1,
  passed: true,
  startedAt: 0,
  endedAt: 0,
});

describe('Learn — a whole lesson', () => {
  beforeAll(async () => {
    await import('./LessonPage');
    await import('./LearnPage');
    await import('./ReviewPage');
  });

  it('teaches, checks every exercise kind, updates mastery, unlocks the next lesson and saves', async () => {
    const user = userEvent.setup();
    const { learningRepository } = renderApp('/learn/fixture-variables', { course });

    expect(await screen.findByRole('heading', { name: 'Values with names' })).toBeInTheDocument();
    expect(screen.getByText('age = 25').tagName).toBe('CODE');
    await next(user);

    // Playground: changing the input reruns the program.
    expect(await screen.findByRole('heading', { name: 'Try it' })).toBeInTheDocument();
    expect(screen.getByText('30', { selector: 'pre' })).toBeInTheDocument();
    const age = screen.getByRole('spinbutton', { name: 'age =' });
    await user.clear(age);
    await user.type(age, '10');
    expect(await screen.findByText('15', { selector: 'pre' })).toBeInTheDocument();
    await next(user);

    // Multiple choice.
    await user.click(screen.getByRole('radio', { name: 'It stores a value under a name' }));
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user);

    // Prediction.
    await user.type(screen.getByLabelText('Value of total'), '30');
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user);

    // Code completion.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Blank 1' }), '+');
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user);

    // Ordering (shown shuffled).
    await arrange(user, 'Your order', ['n = 4', 'n = n * 2', 'print(n)']);
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user);

    // Debugging: line + reason. Checkpoint: one try, no hints.
    expect(screen.getByText(/One try, no hints/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show a hint' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Line 2:/ }));
    await user.click(
      screen.getByRole('radio', { name: 'It replaces the value instead of adding to it' }),
    );
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user);

    // Matching.
    await user.selectOptions(screen.getByRole('combobox', { name: '42' }), 'number');
    await user.selectOptions(screen.getByRole('combobox', { name: '"42"' }), 'text');
    await user.selectOptions(screen.getByRole('combobox', { name: 'true' }), 'true/false');
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    await next(user, /^Finish/);

    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument();
    expect(screen.getByText(/“Fixture conditions” is now open/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Next lesson: Fixture conditions/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Code Memory · level 2/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(learningRepository.stored?.lessons['fixture-variables']?.completedAt).not.toBeNull();
    });
    expect(learningRepository.stored?.mastery['fixture-variables']?.application).toBeGreaterThan(0);
    expect(learningRepository.stored?.reviews['fixture-variables']?.box).toBe(1);
  }, 40_000);

  it('explains a wrong answer, offers a hint and a retry, and counts the retry for less', async () => {
    const user = userEvent.setup();
    const { learningRepository } = renderApp('/learn/fixture-variables', { course });
    await next(user);
    await next(user);

    await user.click(screen.getByRole('radio', { name: 'It prints text' }));
    await check(user);
    expect(await screen.findByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByText('Printing shows a value; it does not keep one.')).toBeInTheDocument();
    expect(screen.getByText(/Think of a labelled box/)).toBeInTheDocument();
    // The answer is not given away while a retry is left.
    expect(screen.queryByText(/Correct answer:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Try again/ }));
    await user.click(screen.getByRole('radio', { name: 'It stores a value under a name' }));
    await check(user);
    expect(await screen.findByText('Correct.')).toBeInTheDocument();
    expect(learningRepository.stored).toBeNull();
  });

  it('shows the solution on request, with the reasoning', async () => {
    const user = userEvent.setup();
    renderApp('/learn/fixture-variables', { course });
    await next(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: 'It repeats code' }));
    await check(user);
    await user.click(await screen.findByRole('button', { name: 'Show solution' }));
    expect(await screen.findByText('Here is the solution.')).toBeInTheDocument();
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent('It stores a value under a name');
    expect(screen.getByText('✓ Correct answer')).toBeInTheDocument();
  });

  it('keeps later lessons locked until the previous one is passed', async () => {
    renderApp('/learn/fixture-conditions', { course });
    expect(await screen.findByRole('heading', { name: /is not open yet/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Fixture variables' })).toBeInTheDocument();
  });
});

describe('Learn — path and review', () => {
  it('lists lessons with their status and the next step', async () => {
    renderApp('/learn', { course, learning: passed });
    expect(await screen.findByRole('heading', { name: 'Fixture course' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '1. Fixture variables, completed, best 100%' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2. Fixture conditions, open' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue: Fixture conditions' })).toBeInTheDocument();
    expect(screen.getByText(/Next review tomorrow/)).toBeInTheDocument();
  });

  it('runs a due review and moves the concept to the next box', async () => {
    const user = userEvent.setup();
    const clock = new FakeClock(DAY_MS + 1);
    const { learningRepository } = renderApp('/learn/review', { course, learning: passed, clock });
    expect(await screen.findByText(/Review · Variables/)).toBeInTheDocument();
    // Answer whatever two exercises came up by revealing them (no credit), then finish.
    for (let i = 0; i < 2; i++) {
      const firstInput = screen.queryAllByRole('radio')[0];
      if (firstInput) await user.click(firstInput);
      const text = screen.queryByRole('textbox');
      if (text) await user.type(text, '0');
      for (const box of screen.queryAllByRole('combobox'))
        await user.selectOptions(box, within(box).getAllByRole('option')[1] as HTMLOptionElement);
      const line = screen.queryByRole('button', { name: /^Line 1:/ });
      if (line) await user.click(line);
      const add = screen.queryAllByRole('button', { name: /^Add / })[0];
      if (add) await user.click(add);
      await check(user);
      const reveal = screen.queryByRole('button', { name: 'Show solution' });
      if (reveal) await user.click(reveal);
      await next(user);
    }
    expect(await screen.findByRole('heading', { name: 'Review done' })).toBeInTheDocument();
    await waitFor(() => {
      expect(learningRepository.stored?.reviews['fixture-variables']?.lastReviewedAt).toBe(
        DAY_MS + 1,
      );
    });
  });

  it('says when nothing is due', async () => {
    renderApp('/learn/review', { course, learning: passed });
    expect(
      await screen.findByRole('heading', { name: 'Nothing to review right now' }),
    ).toBeInTheDocument();
  });
});
