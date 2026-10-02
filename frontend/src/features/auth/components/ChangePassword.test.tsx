import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChangePassword } from './ChangePassword';

describe('ChangePassword', () => {
  it('permite controlar por separado la visibilidad de sus tres contraseñas', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onSuccess={vi.fn()} />);

    const currentPassword = screen.getByLabelText(/^Contraseña Actual$/);
    const newPassword = screen.getByLabelText(/^Nueva Contraseña$/);
    const confirmPassword = screen.getByLabelText(/^Confirmar Nueva Contraseña$/);

    expect(
      screen.queryByRole('button', { name: 'Mostrar contraseña' })
    ).not.toBeInTheDocument();

    await user.type(currentPassword, 'a');
    await user.type(newPassword, 'a');
    await user.type(confirmPassword, 'a');

    const visibilityButtons = screen.getAllByRole('button', {
      name: 'Mostrar contraseña',
    });

    expect(visibilityButtons).toHaveLength(3);
    await user.click(visibilityButtons[1]);

    expect(currentPassword).toHaveAttribute('type', 'password');
    expect(newPassword).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'password');
  });
});
