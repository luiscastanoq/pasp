import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Evaluacion } from '../../../../types/evaluacion';
import { createEvaluacion } from '../../services/tutorService';
import { NuevaEvaluacionModal } from './NuevaEvaluacionModal';

vi.mock('../../services/tutorService', () => ({
  createEvaluacion: vi.fn(),
}));

const evaluacionCreada: Evaluacion = {
  idEvaluacion: 9,
  idBecario: 3,
  idTutorEvaluador: 8,
  titulo: 'Seguimiento mensual',
  fechaEvaluacion: '2026-07-13T12:00:00.000Z',
  puntuacionPuntualidad: 4,
  puntuacionCalidad: 4,
  puntuacionActitud: 4,
  puntuacionAutonomia: 4,
  puntuacionComunicacion: 4,
  puntuacionMedia: 4,
  comentarios: 'Buen progreso',
  createdAt: '2026-07-13T12:00:00.000Z',
};

describe('NuevaEvaluacionModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra todos los campos obligatorios que faltan', async () => {
    // Al enviar el formulario vacio se deben explicar los siete datos necesarios.
    const user = userEvent.setup();
    render(
      <NuevaEvaluacionModal idBecario={3} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /Guardar evaluaci/ }));

    expect(screen.getByText(/t.tulo es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/descripci.n es obligatoria/)).toBeInTheDocument();
    expect(screen.getAllByText(/Selecciona una puntuaci/)).toHaveLength(5);
    expect(createEvaluacion).not.toHaveBeenCalled();
  });

  it('calcula la media y envia una evaluacion valida', async () => {
    // Elegimos un 4 en las cinco categorias para comprobar una media visible de 4.00.
    vi.mocked(createEvaluacion).mockResolvedValue({
      success: true,
      message: 'creada',
      data: evaluacionCreada,
    });
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <NuevaEvaluacionModal idBecario={3} onClose={onClose} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText(/T.tulo/), '  Seguimiento mensual  ');
    await user.type(screen.getByLabelText(/Descripci.n/), '  Buen progreso  ');
    for (const button of screen.getAllByRole('button', { name: /Puntuaci.n 4/ })) {
      await user.click(button);
    }

    expect(screen.getByText('4.00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Guardar evaluaci/ }));

    expect(createEvaluacion).toHaveBeenCalledWith(3, {
      titulo: 'Seguimiento mensual',
      descripcion: 'Buen progreso',
      puntuacionPuntualidad: 4,
      puntuacionCalidad: 4,
      puntuacionActitud: 4,
      puntuacionAutonomia: 4,
      puntuacionComunicacion: 4,
    });
    expect(onSuccess).toHaveBeenCalledWith(evaluacionCreada);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('muestra el error del backend sin cerrar el modal', async () => {
    // Una peticion fallida debe conservar el formulario y explicar el problema.
    vi.mocked(createEvaluacion).mockRejectedValue(new Error('No tienes permisos'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <NuevaEvaluacionModal idBecario={3} onClose={onClose} onSuccess={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/T.tulo/), 'Seguimiento');
    await user.type(screen.getByLabelText(/Descripci.n/), 'Buen progreso');
    for (const button of screen.getAllByRole('button', { name: /Puntuaci.n 3/ })) {
      await user.click(button);
    }
    await user.click(screen.getByRole('button', { name: /Guardar evaluaci/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permisos',
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
