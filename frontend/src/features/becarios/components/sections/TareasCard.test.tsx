import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Tarea } from '../../../../types/tarea';
import { TareasCard } from './TareasCard';

const tarea: Tarea = {
  idTarea: 6,
  nombreTarea: 'Preparar informe',
  descripcion: 'Resumen mensual',
  estado: 'Pendiente',
  fechaInicio: '2026-07-01',
  fechaFinEstimada: null,
  fechaCompletada: null,
  tutorAsignador: {
    idUsuario: 8,
    nombre: 'Luis',
    apellidos: 'Garcia',
    email: 'luis@test.com',
  },
  createdAt: '2026-07-01',
  updatedAt: '2026-07-01',
};

describe('TareasCard', () => {
  const baseProps = {
    updatingTareaId: null,
    onUpdateEstado: vi.fn().mockResolvedValue(undefined),
    onSelectTarea: vi.fn(),
  };

  it('muestra estados diferentes para carga y lista vacia', () => {
    // La persona debe saber si tiene que esperar o si realmente no tiene tareas.
    const { rerender } = render(
      <TareasCard {...baseProps} tareas={[]} loadingTareas />,
    );
    expect(screen.getByText('Cargando tareas...')).toBeInTheDocument();

    rerender(<TareasCard {...baseProps} tareas={[]} loadingTareas={false} />);
    expect(screen.getByText(/No tienes tareas asignadas/)).toBeInTheDocument();
  });

  it('permite abrir una tarea y cambiar su estado', async () => {
    // Protegemos las dos acciones principales de la tarjeta del becario.
    const onSelectTarea = vi.fn();
    const onUpdateEstado = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <TareasCard
        tareas={[tarea]}
        loadingTareas={false}
        updatingTareaId={null}
        onUpdateEstado={onUpdateEstado}
        onSelectTarea={onSelectTarea}
      />,
    );

    await user.click(screen.getByText('Preparar informe'));
    await user.selectOptions(screen.getByRole('combobox'), 'En_Progreso');

    expect(onSelectTarea).toHaveBeenCalledWith(tarea);
    expect(onUpdateEstado).toHaveBeenCalledWith(6, 'En_Progreso');
  });
});
