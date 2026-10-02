import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../auth/context/useAuth';
import { getMyBecariosAcademicos } from '../services/tutorService';
import { TutorAcademicoDashboard } from './TutorAcademicoDashboard';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/tutorService', () => ({
  getMyBecariosAcademicos: vi.fn(),
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera académica</header>,
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <TutorAcademicoDashboard />
    </MemoryRouter>,
  );
}

describe('TutorAcademicoDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() } as never);
  });

  it('explica que no existen asignaciones en vez de mostrar una tabla rota', async () => {
    // Cero resultados es un estado normal, no un error de carga.
    vi.mocked(getMyBecariosAcademicos).mockResolvedValue([]);
    renderDashboard();

    expect(
      await screen.findByText('No tienes becarios académicos asignados actualmente.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 becarios')).toBeInTheDocument();
  });

  it('presenta fechas antiguas y valores ausentes de forma segura', async () => {
    // Los registros históricos pueden traer una fecha ISO completa y fecha final nula.
    vi.mocked(getMyBecariosAcademicos).mockResolvedValue([
      {
        idBecario: 3,
        idUsuario: 14,
        nombre: 'Ana',
        apellidos: 'López',
        email: 'ana@test.com',
        activo: false,
        practica: null,
        cliente: null,
        tipoTutor: 'Academico',
        fechaInicioPracticas: '2024-01-02T00:00:00.000Z',
        fechaFinPracticas: null,
        horasContrato: null,
        ayudaEconomica: null,
        equipoEnUso: null,
        tipoFormacion: null,
        nombreGradoUniversitario: null,
        nombreFormacionProfesional: null,
        centroEstudios: null,
        telefonoPersonal: null,
        emailPersonal: null,
        linkedin: null,
      },
    ] as never);
    renderDashboard();

    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('02/01/2024')).toBeInTheDocument();
    expect(screen.getByText('Deshabilitado')).toBeInTheDocument();
  });
});
