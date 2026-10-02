import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../shared/api/api';
import { ROLES } from '../../../shared/constants/domain.constants';
import { useAuth } from '../../auth/context/useAuth';
import { usuariosService } from '../services/usuariosService';
import { EditarAdminPage } from './EditarAdminPage';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/usuariosService', () => ({
  usuariosService: {
    getUsuarioById: vi.fn(),
    updateAdministrador: vi.fn(),
    toggleEstadoUsuario: vi.fn(),
    deleteUsuario: vi.fn(),
  },
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera de administrador</header>,
}));

const usuarioAdmin = {
  idUsuario: 7,
  nombre: 'Ana',
  apellidos: 'Lopez',
  email: 'ana@test.com',
  rol: ROLES.ADMIN,
  activo: true,
  primerAcceso: false,
  esSuperAdmin: false,
  practica: null,
  cliente: null,
};

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderPage(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/admin/usuario/${id}/editar`]}>
      <Routes>
        <Route path="/admin/usuario/:id/editar" element={<EditarAdminPage />} />
        <Route path="/admin" element={<p>Panel administrador</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('EditarAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() } as never);
  });

  it('muestra carga mientras consulta el usuario', () => {
    // Una promesa pendiente reproduce el instante anterior a recibir los datos.
    vi.mocked(usuariosService.getUsuarioById).mockReturnValue(new Promise(() => undefined));

    renderPage();

    const loadingMessage = screen.getByText('Cargando datos del usuario...');
    const loadingMain = loadingMessage.closest('main');

    expect(loadingMessage).toBeInTheDocument();
    expect(loadingMain).toHaveAttribute('class');
    expect(loadingMain?.parentElement).toHaveAttribute('class');
  });

  it('muestra el error cuando el ID de la URL no es valido', async () => {
    // Una URL incorrecta debe abandonar la carga y explicar el problema al usuario.
    renderPage('abc');

    expect(await screen.findByText(/ID de usuario no v.lido/)).toBeInTheDocument();
    expect(usuariosService.getUsuarioById).not.toHaveBeenCalled();
  });

  it('valida y guarda los datos editados', async () => {
    // El servicio debe recibir valores limpios y la pantalla debe volver al panel al terminar.
    vi.mocked(usuariosService.getUsuarioById).mockResolvedValue(usuarioAdmin);
    vi.mocked(usuariosService.updateAdministrador).mockResolvedValue(usuarioAdmin);
    const user = userEvent.setup();
    renderPage();

    const email = await screen.findByLabelText(/Email interno/);
    await user.clear(email);
    await user.type(email, ' nuevo@test.com ');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(usuariosService.updateAdministrador).toHaveBeenCalledWith(7, {
      nombre: 'Ana',
      apellidos: 'Lopez',
      email: 'nuevo@test.com',
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/admin');
  });

  it('explica que el nuevo email ya esta ocupado', async () => {
    // El error 409 necesita un mensaje util, no un aviso tecnico generico.
    vi.mocked(usuariosService.getUsuarioById).mockResolvedValue(usuarioAdmin);
    vi.mocked(usuariosService.updateAdministrador).mockRejectedValue(
      new ApiError(409, 'EMAIL_DUPLICADO'),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText(/Email interno/);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/email introducido ya existe/);
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/usuario/7/editar');
  });
});
