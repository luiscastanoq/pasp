import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ROLES } from '../../../shared/constants/domain.constants';
import UsersTable from './UsersTable';

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe('UsersTable', () => {
  it('diferencia el estado de carga de una lista vacia', () => {
    // Son dos situaciones distintas: esperar una respuesta o confirmar que no hay registros.
    const { rerender } = render(
      <MemoryRouter>
        <UsersTable usuarios={[]} isLoading />
      </MemoryRouter>,
    );
    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <UsersTable usuarios={[]} isLoading={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No hay usuarios registrados')).toBeInTheDocument();
  });

  it('muestra los datos y navega a la edicion correcta del becario', async () => {
    // El enlace de accion debe usar el identificador del usuario, no el de otra entidad.
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersTable
          isLoading={false}
          usuarios={[{
            idUsuario: 14,
            nombre: 'Ana',
            apellidos: 'Lopez',
            email: 'ana@test.com',
            rol: ROLES.BECARIO,
            activo: true,
            primerAcceso: false,
            cliente: 'Cliente',
          }]}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByText('ana@test.com')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver detalles' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/editar-becario/14');
  });
});
