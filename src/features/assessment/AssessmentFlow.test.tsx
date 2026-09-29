import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AssessmentDefinition } from '@/domain/assessment';
import { renderApp, renderWithServices } from '@/test/renderApp';
import { AssessmentFlow } from './AssessmentFlow';

const definition: AssessmentDefinition = {
  id: 'logic-only',
  name: 'Logic only',
  sections: [{ area: 'logic', gameId: 'algorithmic-logic', levels: [1, 2], challengesPerLevel: 1 }],
};

describe('AssessmentFlow', () => {
  it('chains rounds, builds the profile and saves it without touching level records', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    const { repository } = renderWithServices(
      <AssessmentFlow definition={definition} onRestart={onRestart} />,
    );

    expect(await screen.findByText('Round 1 of 2')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Skip rest of round' }));
    expect(await screen.findByText('Round 2 of 2')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Skip rest of round' }));

    expect(
      await screen.findByRole('heading', { name: /Programming Cognitive Index/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Not measured')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'What this is — and is not' })).toBeInTheDocument();
    await waitFor(() => {
      expect(repository.stored?.assessments).toHaveLength(1);
    });
    expect(repository.stored?.games).toEqual({});
    expect(repository.stored?.recentSessions).toEqual([]);
  });
});

describe('AssessmentPage', () => {
  it('describes the five-area battery with its disclaimer and starts the first round', async () => {
    const user = userEvent.setup();
    renderApp('/assessment');
    expect(
      await screen.findByRole('heading', { name: 'Programming Cognitive Assessment' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('listitem').filter((li) => /levels 2, 5, 8/.test(li.textContent)),
    ).toHaveLength(5);
    expect(screen.getByText(/30 challenges in total/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What this is — and is not' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start assessment' }));
    expect(await screen.findByText('Round 1 of 15')).toBeInTheDocument();
  });
});
