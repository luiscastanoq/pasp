import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../auth/context/useAuth';
import usuariosService from '../services/usuariosService';
import { NuevoUsuarioPage } from './NuevoUsuarioPage';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/usuariosService', () => ({
  default: {
    crearAdministrador: vi.fn(),
  },
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera de administrador</header>,
}));

describe('NuevoUsuarioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { nombre: 'Admin', apellidos: 'Sistema' },
      logout: vi.fn(),
    } as never);
  });

  it('mantiene seleccionado el rol después de crear un usuario', async () => {
    vi.mocked(usuariosService.crearAdministrador).mockResolvedValue({
      success: true,
      message: 'Usuario creado',
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NuevoUsuarioPage />
      </MemoryRouter>
    );

    const roleButton = screen.getByRole('button', { name: /Administrador/ });
    await user.click(roleButton);
    await user.type(screen.getByLabelText(/^Nombre/), 'Ana');
    await user.type(screen.getByLabelText(/^Apellidos/), 'López');
    await user.type(screen.getByLabelText(/^Email interno/), 'ana@pasp.com');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByText(/creado correctamente/)).toBeInTheDocument();
    expect(roleButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Crear Administrador' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('');
  });
});
