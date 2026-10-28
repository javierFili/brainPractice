import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AssessmentDefinition } from '@/domain/assessment';
import { choiceLabels, sessionChallenge } from '@/test/challenges';
import { renderApp, renderWithServices } from '@/test/renderApp';
import { AssessmentFlow } from './AssessmentFlow';

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const option = (label: string) =>
  screen.getByRole('button', { name: new RegExp(`^${escape(label)}$`) });

const definition: AssessmentDefinition = {
  id: 'logic-only',
  name: 'Logic only',
  sections: [{ area: 'logic', gameId: 'algorithmic-logic', levels: [1, 2], challengesPerLevel: 1 }],
};

describe('AssessmentFlow', () => {
  const skipRound = () => screen.findByRole('button', { name: /Skip round/ });

  it('chains rounds and counts a fully skipped battery as unsolved, without saving it', async () => {
    const user = userEvent.setup();
    const { repository } = renderWithServices(
      <AssessmentFlow definition={definition} onRestart={vi.fn()} />,
    );

    expect(await screen.findByText('Round 1 of 2')).toBeInTheDocument();
    await user.click(await skipRound());
    expect(await screen.findByText('Round 2 of 2')).toBeInTheDocument();
    await user.click(await skipRound());

    expect(
      await screen.findByRole('heading', { name: /Performance index: 0/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Skipped — counts as 0')).toBeInTheDocument();
    expect(screen.getAllByText('Not measured')).toHaveLength(4);
    expect(screen.getByText(/0 of 2 challenges answered/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retake assessment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What this is — and is not' })).toBeInTheDocument();
    expect(repository.stored).toBeNull();
  });

  it('saves an answered battery to the history without touching level records', async () => {
    const user = userEvent.setup();
    const { repository } = renderWithServices(
      <AssessmentFlow definition={definition} onRestart={vi.fn()} />,
    );
    const first = sessionChallenge(1, 1);
    await waitFor(() => {
      expect(option(choiceLabels(first).correct)).toBeEnabled();
    });
    await user.click(option(choiceLabels(first).correct));
    await user.click(await screen.findByRole('button', { name: /See results/ }));
    expect(await screen.findByText('Round 2 of 2')).toBeInTheDocument();
    await user.click(await skipRound());

    expect(await screen.findByRole('heading', { name: /Performance index/ })).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 challenges answered/)).toBeInTheDocument();
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
      await screen.findByRole('heading', { name: 'Cognitive Assessment' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Programming/ }));
    expect(
      screen.getAllByRole('listitem').filter((li) => /levels 2, 5, 8/.test(li.textContent)),
    ).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /Programming/ })).toHaveTextContent('30 challenges');
    expect(screen.getByRole('heading', { name: 'What this is — and is not' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start programming assessment' }));
    expect(await screen.findByText('Round 1 of 15')).toBeInTheDocument();
  });
});
