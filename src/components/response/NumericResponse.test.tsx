import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumericResponse } from './NumericResponse';

const response = { format: 'numeric', question: {}, solution: { value: -3 } } as const;

describe('NumericResponse', () => {
  it('lets keypads without a minus key enter negative numbers', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NumericResponse response={response} disabled={false} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Your answer/), '3');
    await user.click(screen.getByRole('button', { name: 'Toggle negative sign' }));
    expect(screen.getByLabelText(/Your answer/)).toHaveValue('-3');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith(-3);
  });

  it('accepts a typographic minus sign', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NumericResponse response={response} disabled={false} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Your answer/), '−3{Enter}');
    expect(onSubmit).toHaveBeenCalledWith(-3);
  });
});
