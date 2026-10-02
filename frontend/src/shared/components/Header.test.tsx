import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Header } from './Header';

describe('Header compartido', () => {
  it.each(['Administrador', 'Tutor de empresa', 'Tutor académico', 'Becario'])(
    'muestra el rol %s con el mismo componente',
    rolLabel => {
      render(
        <Header
          nombre="María"
          apellidos="López"
          rolLabel={rolLabel}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByText('María López')).toBeInTheDocument();
      expect(screen.getByText(rolLabel)).toBeInTheDocument();
    }
  );

  it('mantiene las acciones compartidas de inicio y cierre de sesión', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();
    const onLogout = vi.fn();

    render(
      <Header
        nombre="Manuel"
        apellidos="Morales"
        rolLabel="Tutor de empresa"
        onHome={onHome}
        onLogout={onLogout}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Volver al dashboard' }));
    expect(onHome).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
