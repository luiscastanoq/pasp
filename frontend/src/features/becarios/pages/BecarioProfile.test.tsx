import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../auth/context/useAuth';
import { fichajeService } from '../../fichajes/services/fichajeService';
import { getToken } from '../../../shared/api/api';
import { becarioService } from '../services/becarioService';
import type { BecarioProfile as BecarioProfileData } from '../services/becarioService';
import { BecarioProfile } from './BecarioProfile';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../../shared/api/api', async importOriginal => {
  const original = await importOriginal<typeof import('../../../shared/api/api')>();
  return { ...original, getToken: vi.fn() };
});
vi.mock('../services/becarioService', () => ({
  becarioService: {
    getMyProfile: vi.fn(),
    getMyTareas: vi.fn(),
    updateMyProfile: vi.fn(),
    updateTareaEstado: vi.fn(),
  },
}));
vi.mock('../../fichajes/services/fichajeService', () => ({
  fichajeService: {
    getFichajeActivo: vi.fn(),
    getHistorialFichajes: vi.fn(),
  },
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: ({ nombre, apellidos }: { nombre: string; apellidos: string }) => (
    <header>Perfil de {nombre} {apellidos}</header>
  ),
}));
vi.mock('../components/sections/fichaje/FichajeModal', () => ({
  FichajeModal: () => null,
}));
vi.mock('../components/sections/fichaje/FichajeHistorial', () => ({
  FichajeHistorial: () => null,
}));
vi.mock('../../../shared/components/TareaDetailModal', () => ({
  TareaDetailModal: () => null,
}));

const perfil: BecarioProfileData = {
  idBecario: 3,
  idUsuario: 14,
  usuario: {
    idUsuario: 14,
    email: 'ana@empresa.com',
    nombre: 'Ana',
    apellidos: 'Lopez',
    rol: 'Becario',
    activo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  corporativo: {
    practica: 'Desarrollo',
    cliente: 'Cliente',
  },
  academico: {
    tipoFormacion: 'Universitaria',
    nombreGradoUniversitario: 'Informatica',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad',
  },
  contacto: {
    telefonoPersonal: '600123123',
    emailPersonal: 'ana@personal.com',
    linkedin: 'https://linkedin.com/in/ana',
  },
  practicas: {
    fechaInicioPracticas: '2026-01-01',
    fechaFinPracticas: '2026-06-01',
    horasContrato: 30,
    ayudaEconomica: null,
    equipoEnUso: null,
  },
  tutores: [],
};

describe('BecarioProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ logout: vi.fn() } as never);
    vi.mocked(getToken).mockReturnValue(null);
    vi.mocked(becarioService.getMyTareas).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(fichajeService.getFichajeActivo).mockResolvedValue({
      success: true,
      message: 'Sin fichaje',
      data: null,
    });
  });

  it('muestra carga mientras espera el perfil principal', () => {
    // Aunque tareas y fichaje respondan, la pantalla depende del perfil para poder dibujarse.
    vi.mocked(becarioService.getMyProfile).mockReturnValue(new Promise(() => undefined));

    render(<BecarioProfile />);

    expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
  });

  it('solicita suficientes fichajes para rellenar el panel de actividad', async () => {
    // Se muestran siempre los siete registros mas recientes en la tarjeta.
    vi.mocked(getToken).mockReturnValue('token');
    vi.mocked(becarioService.getMyProfile).mockResolvedValue({ success: true, data: perfil });
    vi.mocked(fichajeService.getHistorialFichajes).mockResolvedValue({
      success: true,
      data: {
        fichajes: [],
        pagination: { total: 0, page: 1, limit: 7, totalPages: 0 },
      },
    });

    render(<BecarioProfile />);

    await screen.findByText('Ana Lopez');
    expect(
      screen.getByRole('heading', { name: 'Tablón de Tareas' })
    ).toBeInTheDocument();
    expect(fichajeService.getHistorialFichajes).toHaveBeenCalledWith({
      page: 1,
      limit: 7,
    });
  });

  it('explica el error y permite reintentar la carga', async () => {
    // El boton de reintento debe realizar una nueva consulta sin recargar toda la aplicacion.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(becarioService.getMyProfile)
      .mockRejectedValueOnce(new Error('sin conexion'))
      .mockResolvedValueOnce({ success: true, data: perfil });
    const user = userEvent.setup();
    render(<BecarioProfile />);

    expect(await screen.findByText('Error al cargar el perfil.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument();
    expect(becarioService.getMyProfile).toHaveBeenCalledTimes(2);
  });

  it('valida y guarda los datos personales editables', async () => {
    // Protegemos la edicion visible: primero se rechaza un email roto y despues se guarda uno valido.
    vi.mocked(becarioService.getMyProfile).mockResolvedValue({ success: true, data: perfil });
    vi.mocked(becarioService.updateMyProfile).mockResolvedValue({
      success: true,
      message: 'actualizado',
      data: {
        ...perfil,
        contacto: { ...perfil.contacto, emailPersonal: 'nuevo@personal.com' },
      },
    });
    const user = userEvent.setup();
    render(<BecarioProfile />);

    await screen.findByText('Ana Lopez');
    await user.click(screen.getByRole('tab', { name: 'Personal' }));
    const editButton = screen.getByRole('button', { name: 'Editar' });
    expect(editButton.closest('[role="tablist"]')).toBeInTheDocument();
    expect(editButton.querySelector('svg')).toBeInTheDocument();
    await user.click(editButton);

    const email = screen.getByLabelText('Email personal');
    await user.clear(email);
    await user.type(email, 'correo-roto');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
    expect(becarioService.updateMyProfile).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, 'nuevo@personal.com');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(becarioService.updateMyProfile).toHaveBeenCalledWith({
      telefonoPersonal: '600123123',
      emailPersonal: 'nuevo@personal.com',
      linkedin: 'https://linkedin.com/in/ana',
    });
    expect(await screen.findByText('Perfil actualizado correctamente')).toBeInTheDocument();
  });
});
