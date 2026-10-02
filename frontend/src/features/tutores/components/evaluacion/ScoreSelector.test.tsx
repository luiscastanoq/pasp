import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScoreSelector } from './ScoreSelector';

describe('ScoreSelector', () => {
  it('permite elegir una puntuacion entre 1 y 5', async () => {
    // Probamos la accion visible que se usa al completar una evaluacion.
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ScoreSelector value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Puntuaci.n 4/ }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marca la puntuacion actual y bloquea cambios durante el guardado', () => {
    // El estado pulsado informa de la seleccion y disabled evita cambios mientras se envia.
    render(<ScoreSelector value={3} onChange={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: /Puntuaci.n 3/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('button')).toEqual(
      expect.arrayContaining([expect.objectContaining({ disabled: true })]),
    );
  });
});
