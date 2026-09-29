import { render, screen, within } from '@testing-library/react';
import { App } from './App';

describe('App shell', () => {
  it('presents the five cognitive areas', () => {
    render(<App />);
    const list = screen.getByRole('list', { name: /cognitive areas/i });
    const items = within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual(['Logic', 'Memory', 'Speed', 'Attention', 'Patterns']);
  });
});
