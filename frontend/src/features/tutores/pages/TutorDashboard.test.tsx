import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BecarioSummary } from '../../../types/becario';
import { useAuth } from '../../auth/context/useAuth';
import {
  getMyBecarios,
  toggleEstadoBecario,
} from '../services/tutorService';
import { TutorDashboard } from './TutorDashboard';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/tutorService', () => ({
  getMyBecarios: vi.fn(),
  toggleEstadoBecario: vi.fn(),
  deleteBecario: vi.fn(),
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera del tutor</header>,
}));
vi.mock('../components/becario/BecarioDetailView', () => ({
  BecarioDetailView: ({ becario }: { becario: BecarioSummary }) => (
    <main>Detalle de {becario.nombre}</main>
  ),
}));
vi.mock('../components/evaluacion/EvaluacionView', () => ({
  EvaluacionView: () => <main>Vista de evaluacion</main>,
}));

const ana: BecarioSummary = {
  idBecario: 3,
  idUsuario: 14,
  nombre: 'Ana',
  apellidos: 'Lopez',
  email: 'ana@test.com',
  activo: true,
  practica: 'Desarrollo',
  cliente: 'Cliente',
  tipoTutor: 'Empresa_Principal',
  fechaInicioPracticas: '2026-01-01',
  fechaFinPracticas: '2026-06-01',
  horasContrato: 30,
  ayudaEconomica: null,
  equipoEnUso: null,
  tareasAsignadas: 2,
  ultimoFichaje: null,
  tipoFormacion: 'Universitaria',
  nombreGradoUniversitario: 'Informatica',
  nombreFormacionProfesional: null,
  centroEstudios: 'Universidad',
  telefonoPersonal: null,
  emailPersonal: null,
  linkedin: null,
};

const bruno: BecarioSummary = {
  ...ana,
  idBecario: 4,
  idUsuario: 15,
  nombre: 'Bruno',
  apellidos: 'Martin',
  email: 'bruno@test.com',
};

const logout = vi.fn();

function renderDashboard() {
  return render(
    <MemoryRouter>
      <TutorDashboard />
    </MemoryRouter>,
  );
}

describe('TutorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, logout } as never);
  });

  it('muestra carga y despues un error comprensible si falla la consulta', async () => {
    // El panel debe distinguir el tiempo de espera de un fallo definitivo del backend.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let rejectRequest: (reason: Error) => void = () => undefined;
    vi.mocked(getMyBecarios).mockReturnValue(
      new Promise((_, reject) => { rejectRequest = reject; }),
    );
    renderDashboard();
    expect(screen.getByText('Cargando becarios...')).toBeInTheDocument();

    rejectRequest(new Error('sin conexion'));
    expect(await screen.findByText(/Error al cargar los becarios asignados/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reiniciar sesión' })).toBeInTheDocument();
  });

  it('destaca el reinicio de sesión cuando el reintento también falla', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getMyBecarios).mockRejectedValue(new Error('sin conexion'));
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText(/Error al cargar los becarios asignados/);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si el error continúa, reinicia la sesión para volver a empezar.'
    );
    await user.click(screen.getByRole('button', { name: 'Reiniciar sesión' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('filtra por nombre y explica cuando no hay coincidencias', async () => {
    // La busqueda debe ocultar solo los registros que no coinciden, sin alterar los datos originales.
    vi.mocked(getMyBecarios).mockResolvedValue([ana, bruno]);
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Ana Lopez');
    await user.type(screen.getByLabelText(/Buscar becarios/), 'Bruno');
    expect(screen.getByText('Bruno Martin')).toBeInTheDocument();
    expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Buscar becarios/));
    await user.type(screen.getByLabelText(/Buscar becarios/), 'Nadie');
    expect(screen.getByText(/No se encontraron coincidencias/)).toBeInTheDocument();
  });

  it('actualiza visualmente el estado del becario', async () => {
    // Tras una respuesta correcta, la fila debe reflejar el nuevo estado sin recargar el panel.
    vi.mocked(getMyBecarios).mockResolvedValue([ana]);
    vi.mocked(toggleEstadoBecario).mockResolvedValue({ activo: false });
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Ana Lopez');
    expect(screen.getByText('Activo').children).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Deshabilitar usuario Ana Lopez' }));

    expect(toggleEstadoBecario).toHaveBeenCalledWith(3);
    expect((await screen.findByText('Deshabilitado')).children).toHaveLength(0);
  });

  it('abre el detalle al seleccionar la fila del becario', async () => {
    // La fila completa funciona como acceso al detalle, no solo sus botones pequeños.
    vi.mocked(getMyBecarios).mockResolvedValue([ana]);
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('row', { name: 'Ver detalles de Ana Lopez' }));

    expect(screen.getByText('Detalle de Ana')).toBeInTheDocument();
  });
  it('muestra los contadores reales por estado, incluso con tareas solo completadas o sin tareas', async () => {
    vi.mocked(getMyBecarios).mockResolvedValue([
      {
        ...ana,
        tareasAsignadas: 6,
        tareasEnProgreso: 1,
        tareasPendientes: 1,
        tareasCompletadas: 4,
      },
      {
        ...bruno,
        tareasAsignadas: 3,
        tareasEnProgreso: 0,
        tareasPendientes: 0,
        tareasCompletadas: 3,
      },
      {
        ...ana,
        idBecario: 5,
        nombre: 'Celia',
        tareasAsignadas: 0,
        tareasEnProgreso: 0,
        tareasPendientes: 0,
        tareasCompletadas: 0,
      },
    ]);
    renderDashboard();

    for (const [name, expected] of [
      ['Ana Lopez', ['1', '1', '4']],
      ['Bruno Martin', ['0', '0', '3']],
      ['Celia Lopez', ['0', '0', '0']],
    ] as const) {
      const row = await screen.findByRole('row', {
        name: `Ver detalles de ${name}`,
      });
      const cells = within(row).getAllByRole('cell');
      expect(cells.slice(-4, -1).map(cell => cell.textContent)).toEqual(
        expected
      );
    }
  });

  it('no inventa contadores cuando la API todavía no incluye el desglose', async () => {
    vi.mocked(getMyBecarios).mockResolvedValue([ana]);
    renderDashboard();
    const row = await screen.findByRole('row', {
      name: 'Ver detalles de Ana Lopez',
    });
    expect(
      within(row)
        .getAllByRole('cell')
        .slice(-4, -1)
        .map(cell => cell.textContent)
    ).toEqual(['—', '—', '—']);
  });

  it('actualiza los contadores al regresar del detalle mediante el historial', async () => {
    vi.mocked(getMyBecarios)
      .mockResolvedValueOnce([
        {
          ...ana,
          tareasPendientes: 1,
          tareasEnProgreso: 1,
          tareasCompletadas: 4,
        },
      ])
      .mockResolvedValue([
        {
          ...ana,
          tareasPendientes: 0,
          tareasEnProgreso: 1,
          tareasCompletadas: 5,
        },
      ]);
    const user = userEvent.setup();
    renderDashboard();
    await user.click(
      await screen.findByRole('row', { name: 'Ver detalles de Ana Lopez' })
    );
    expect(screen.getByText('Detalle de Ana')).toBeInTheDocument();

    act(() =>
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: { tutorView: 'dashboard' } })
      )
    );

    const row = await screen.findByRole('row', {
      name: 'Ver detalles de Ana Lopez',
    });
    expect(
      within(row)
        .getAllByRole('cell')
        .slice(-4, -1)
        .map(cell => cell.textContent)
    ).toEqual(['1', '0', '5']);
    expect(getMyBecarios).toHaveBeenCalledTimes(2);
  });
});
