import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Evaluacion } from '../../../../types/evaluacion';
import { EvaluacionesTable } from './EvaluacionesTable';

const evaluaciones: Evaluacion[] = Array.from({ length: 8 }, (_, index) => ({
  idEvaluacion: index + 1,
  idBecario: 3,
  idTutorEvaluador: 8,
  titulo: `Evaluacion ${index + 1}`,
  fechaEvaluacion: '2026-07-13T12:00:00.000Z',
  puntuacionPuntualidad: 4,
  puntuacionCalidad: 4,
  puntuacionActitud: 4,
  puntuacionAutonomia: 4,
  puntuacionComunicacion: 4,
  puntuacionMedia: 4,
  comentarios: 'Buen progreso',
  createdAt: '2026-07-13T12:00:00.000Z',
}));

describe('EvaluacionesTable', () => {
  it('explica claramente cuando no existen evaluaciones', () => {
    // Una lista vacia es un estado normal y no debe parecer un error de carga.
    render(<EvaluacionesTable evaluaciones={[]} />);

    expect(screen.getByText(/no hay evaluaciones registradas/)).toBeInTheDocument();
  });

  it('pagina las evaluaciones y abre la seleccionada', async () => {
    // La octava evaluacion debe aparecer en la segunda pagina y conservar su objeto completo.
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<EvaluacionesTable evaluaciones={evaluaciones} onRowClick={onRowClick} />);

    expect(screen.getByText('Evaluacion 1')).toBeInTheDocument();
    expect(screen.queryByText('Evaluacion 8')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByText('Evaluacion 8'));

    expect(onRowClick).toHaveBeenCalledWith(evaluaciones[7]);
  });
});
