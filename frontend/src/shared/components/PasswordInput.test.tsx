import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('no muestra el control hasta que se escribe el primer carácter', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Contraseña" />);

    expect(
      screen.queryByRole('button', { name: 'Mostrar contraseña' })
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Contraseña'), 'a');

    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' })
    ).toBeInTheDocument();
  });

  it('alterna la visibilidad manteniendo el valor del campo', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Contraseña" defaultValue="secreto" />);

    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('secreto');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
