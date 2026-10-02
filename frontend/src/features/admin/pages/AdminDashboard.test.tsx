import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLES } from '../../../shared/constants/domain.constants';
import { useAuth } from '../../auth/context/useAuth';
import { getUsersStats } from '../services/adminService';
import usuariosService from '../services/usuariosService';
import { AdminDashboard } from './AdminDashboard';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/adminService', () => ({ getUsersStats: vi.fn() }));
vi.mock('../services/usuariosService', () => ({
  default: {
    getAllUsuarios: vi.fn(),
    toggleEstadoUsuario: vi.fn(),
    deleteUsuario: vi.fn(),
  },
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera de administrador</header>,
}));

const ana = {
  idUsuario: 14,
  nombre: 'Ana',
  apellidos: 'Lopez',
  email: 'ana@test.com',
  rol: ROLES.BECARIO,
  activo: true,
  primerAcceso: false,
  cliente: 'Cliente',
};

const admin = {
  idUsuario: 1,
  nombre: 'Luis',
  apellidos: 'Garcia',
  email: 'luis@test.com',
  rol: ROLES.ADMIN,
  activo: true,
  primerAcceso: false,
  cliente: null,
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() } as never);
    vi.mocked(getUsersStats).mockResolvedValue({
      totalUsuarios: 2,
      usuariosActivos: 2,
      usuariosInactivos: 0,
      pendientesPrimerAcceso: 0,
    });
  });

  it('muestra las estadisticas y los usuarios recibidos', async () => {
    // Esta es la vista normal que permite comprobar de un vistazo el estado del sistema.
    vi.mocked(usuariosService.getAllUsuarios).mockResolvedValue([ana, admin]);
    renderDashboard();

    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument();
    expect(screen.getByText('Luis Garcia')).toBeInTheDocument();
    expect(screen.getByText('Total de usuarios').parentElement).toHaveTextContent('2');
  });

  it('muestra el error de listado sin ocultar completamente el panel', async () => {
    // Un fallo al cargar usuarios debe dejar visible el contexto y ofrecer una salida clara.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(usuariosService.getAllUsuarios).mockRejectedValue(new Error('Servidor no disponible'));
    renderDashboard();

    expect(await screen.findByText('Servidor no disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByText('Panel de Administrador')).toBeInTheDocument();
  });

  it('filtra usuarios por texto y permite limpiar la busqueda', async () => {
    // El filtro debe reaccionar mientras se escribe y recuperar la lista al limpiarlo.
    vi.mocked(usuariosService.getAllUsuarios).mockResolvedValue([ana, admin]);
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Ana Lopez');
    await user.type(screen.getByLabelText(/Buscar usuarios/), 'Luis');
    expect(screen.getByText('Luis Garcia')).toBeInTheDocument();
    expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument();
  });

  it('deshabilita un usuario y actualiza las estadisticas', async () => {
    // La fila y los KPIs deben refrescarse despues de cambiar el estado correctamente.
    vi.mocked(usuariosService.getAllUsuarios).mockResolvedValue([ana]);
    vi.mocked(usuariosService.toggleEstadoUsuario).mockResolvedValue({
      ...ana,
      activo: false,
    } as never);
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Ana Lopez');
    expect(screen.getByText('Activo').children).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Deshabilitar usuario Ana Lopez' }));

    expect(usuariosService.toggleEstadoUsuario).toHaveBeenCalledWith(14);
    expect((await screen.findByText('Deshabilitado')).children).toHaveLength(0);
    expect(getUsersStats).toHaveBeenCalledTimes(2);
  });
});
