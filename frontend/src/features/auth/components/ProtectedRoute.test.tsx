import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLES } from '../../../shared/constants/domain.constants';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/useAuth';

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

const usuario = {
  idUsuario: 4,
  email: 'ana@test.com',
  rol: ROLES.BECARIO,
  nombre: 'Ana',
  apellidos: 'Lopez',
  practica: null,
  cliente: null,
  primerAcceso: false,
  activo: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/becario" element={<p>Panel del becario</p>} />
        <Route
          path="/privada"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <p>Contenido privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia al login cuando no existe una sesion', () => {
    // Una URL protegida no debe mostrar ni un instante su contenido a una persona no autenticada.
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);
    renderRoute();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('muestra el contenido a un rol autorizado', () => {
    // Este es el camino correcto de una persona administradora que entra en su propia pantalla.
    vi.mocked(useAuth).mockReturnValue({
      user: { ...usuario, rol: ROLES.ADMIN },
    } as never);
    renderRoute();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });

  it('avisa del acceso denegado y permite volver al panel propio', async () => {
    // Conocer una URL de administrador no debe permitir a un becario ver su contenido.
    vi.mocked(useAuth).mockReturnValue({ user: usuario } as never);
    const user = userEvent.setup();
    renderRoute();

    expect(screen.getByText('Acceso no permitido')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ir a mi panel' }));
    expect(screen.getByText('Panel del becario')).toBeInTheDocument();
  });
});
