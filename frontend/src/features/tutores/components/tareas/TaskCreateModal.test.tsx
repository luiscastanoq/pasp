import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaskCreateModal } from './TaskCreateModal';

describe('TaskCreateModal', () => {
  it('no envia una tarea sin nombre y muestra el motivo', async () => {
    // El formulario debe detener los datos incompletos antes de llamar al servicio.
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskCreateModal onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Crear Tarea' }));

    expect(screen.getByText('El nombre de la tarea es obligatorio')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia los datos limpios de una tarea valida', async () => {
    // Los espacios exteriores no deben guardarse como parte del nombre o la descripcion.
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TaskCreateModal onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/Implementar/), '  Preparar informe  ');
    await user.type(screen.getByPlaceholderText(/Descripci/), '  Resumen mensual  ');
    await user.click(screen.getByRole('button', { name: 'Crear Tarea' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      nombreTarea: 'Preparar informe',
      descripcion: 'Resumen mensual',
    }));
  });

  it('muestra un error si el backend rechaza la creacion', async () => {
    // Aunque la validacion local pase, el usuario debe recibir feedback si falla la peticion.
    const onSubmit = vi.fn().mockRejectedValue(new Error('No tienes permisos'));
    const user = userEvent.setup();
    render(<TaskCreateModal onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/Implementar/), 'Preparar informe');
    await user.click(screen.getByRole('button', { name: 'Crear Tarea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permisos',
    );
  });
});
