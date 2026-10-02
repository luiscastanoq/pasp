import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { becarioService } from '../../features/becarios/services/becarioService';
import * as tutorService from '../../features/tutores/services/tutorService';
import type { Tarea } from '../../types/tarea';
import { ROLES } from '../constants/domain.constants';
import { TareaDetailModal } from './TareaDetailModal';

vi.mock('../../features/becarios/services/becarioService', () => ({
  becarioService: { getTareaHistorial: vi.fn() },
}));
vi.mock('../../features/tutores/services/tutorService', () => ({
  getTareaHistorial: vi.fn(),
}));

const tarea: Tarea = {
  idTarea: 10,
  nombreTarea: 'Preparar informe',
  descripcion: 'Resumen mensual',
  estado: 'En_Progreso',
  fechaInicio: '2026-07-01',
  fechaFinEstimada: null,
  fechaCompletada: null,
  tutorAsignador: {
    idUsuario: 7,
    nombre: 'Manuel',
    apellidos: 'Morales',
    email: 'manuel@test.com',
  },
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-07-02T09:00:00.000Z',
};

const historial = [
  {
    idHistorial: 1,
    estadoAnterior: 'Pendiente' as const,
    estadoNuevo: 'En_Progreso' as const,
    fechaCambio: '2026-07-02T09:00:00.000Z',
    modificadoPor: {
      idUsuario: 7,
      nombre: 'Manuel',
      apellidos: 'Morales',
      rol: ROLES.TUTOR_EMPRESA,
    },
  },
];

describe('TareaDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('el becario consulta y ve el historial sin controles de edición', async () => {
    // Protege el camino que falló en BUG-006 sin simular el propio modal.
    vi.mocked(becarioService.getTareaHistorial).mockResolvedValue({
      success: true,
      data: historial,
    });
    render(<TareaDetailModal tarea={tarea} onClose={vi.fn()} />);

    expect(await screen.findByText('Manuel Morales')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getAllByText('En Progreso').length).toBeGreaterThan(0);
    expect(becarioService.getTareaHistorial).toHaveBeenCalledWith(10);
    expect(tutorService.getTareaHistorial).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
  });

  it('el tutor usa su historial y puede guardar una edición', async () => {
    // El mismo componente cambia de servicio y habilita acciones según el rol.
    vi.mocked(tutorService.getTareaHistorial).mockResolvedValue({
      success: true,
      data: [],
    });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <TareaDetailModal
        tarea={tarea}
        userRole={ROLES.TUTOR_EMPRESA}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(await screen.findByText('Sin cambios registrados todavía')).toBeInTheDocument();
    const nombre = screen.getByPlaceholderText('Nombre de la tarea');
    await user.clear(nombre);
    await user.type(nombre, 'Informe actualizado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onUpdate).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ nombreTarea: 'Informe actualizado' }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(tutorService.getTareaHistorial).toHaveBeenCalledWith(10);
  });

  it('explica si el historial no puede cargarse', async () => {
    // Un fallo de red no debe dejar una carga infinita ni cerrar el detalle.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(becarioService.getTareaHistorial).mockRejectedValue(
      new Error('sin conexión'),
    );
    render(<TareaDetailModal tarea={tarea} onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el historial',
    );
    expect(screen.getByText('Preparar informe')).toBeInTheDocument();
  });
});
