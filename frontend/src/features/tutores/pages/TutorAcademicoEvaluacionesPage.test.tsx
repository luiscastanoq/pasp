import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BecarioSummary } from '../../../types/becario';
import { useAuth } from '../../auth/context/useAuth';
import { getMyBecariosAcademicos } from '../services/tutorService';
import { TutorAcademicoEvaluacionesPage } from './TutorAcademicoEvaluacionesPage';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/tutorService', () => ({
  getMyBecariosAcademicos: vi.fn(),
  getEvaluacionesAcademicasByBecario: vi.fn(),
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera del tutor</header>,
}));
vi.mock('../components/evaluacion/EvaluacionView', () => ({
  EvaluacionView: ({ becario }: { becario: BecarioSummary }) => (
    <main>Evaluaciones de {becario.nombre}</main>
  ),
}));

const becario: BecarioSummary = {
  idBecario: 3,
  idUsuario: 14,
  nombre: 'Ana',
  apellidos: 'Lopez',
  email: 'ana@test.com',
  activo: true,
  practica: 'Desarrollo',
  cliente: 'Cliente',
  tipoTutor: 'Academico',
  fechaInicioPracticas: '2026-01-01',
  fechaFinPracticas: '2026-06-01',
  horasContrato: 30,
  ayudaEconomica: null,
  equipoEnUso: null,
  tipoFormacion: 'Universitaria',
  nombreGradoUniversitario: 'Informatica',
  nombreFormacionProfesional: null,
  centroEstudios: 'Universidad',
  telefonoPersonal: null,
  emailPersonal: null,
  linkedin: null,
};

function renderPage(id = '3') {
  return render(
    <MemoryRouter initialEntries={[`/tutor-academico/becario/${id}/evaluaciones`]}>
      <Routes>
        <Route
          path="/tutor-academico/becario/:id/evaluaciones"
          element={<TutorAcademicoEvaluacionesPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TutorAcademicoEvaluacionesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() } as never);
  });

  it('muestra un estado de carga mientras consulta las asignaciones', () => {
    // Una promesa pendiente permite comprobar lo que ve el tutor durante la espera real.
    vi.mocked(getMyBecariosAcademicos).mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByText('Cargando evaluaciones...')).toBeInTheDocument();
  });

  it('muestra un mensaje comprensible cuando falla la carga', async () => {
    // El error tecnico se transforma en una explicacion y una opcion para volver al panel.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(getMyBecariosAcademicos).mockRejectedValue(new Error('sin conexion'));

    renderPage();

    expect(await screen.findByText('Evaluaciones no disponibles')).toBeInTheDocument();
    expect(screen.getByText(/Error al cargar la informacion/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al panel' })).toBeInTheDocument();
  });

  it('muestra evaluaciones solo si el becario pertenece al tutor', async () => {
    // La pantalla debe encontrar el ID dentro de las asignaciones antes de mostrar sus datos.
    vi.mocked(getMyBecariosAcademicos).mockResolvedValue([becario]);
    const { unmount } = renderPage('3');
    expect(await screen.findByText('Evaluaciones de Ana')).toBeInTheDocument();

    unmount();
    vi.mocked(getMyBecariosAcademicos).mockResolvedValue([becario]);
    renderPage('99');
    expect(await screen.findByText(/No se ha encontrado este becario/)).toBeInTheDocument();
  });
});
