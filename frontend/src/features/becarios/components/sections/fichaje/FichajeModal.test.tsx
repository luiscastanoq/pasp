import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fichajeService } from '../../../../fichajes/services/fichajeService';
import { FichajeModal } from './FichajeModal';

vi.mock('../../../../fichajes/services/fichajeService', () => ({
  fichajeService: {
    ficharEntrada: vi.fn(),
    ficharSalida: vi.fn(),
  },
}));

const fichajeActivo = {
  idFichaje: 20,
  fecha: '2026-07-13T00:00:00.000Z',
  horaEntrada: '2026-07-13T08:00:00.000Z',
  horaSalida: null,
};

describe('FichajeModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('solo permite fichar entrada cuando aun no existe fichaje', () => {
    // El estado inicial debe guiar al usuario y bloquear una salida imposible.
    render(
      <FichajeModal
        isOpen
        onClose={vi.fn()}
        fichajeActivo={null}
        onFichajeCompleted={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Fichar Entrada/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Fichar Salida/ })).toBeDisabled();
    expect(screen.getByLabelText('Horas a imputar (Disponible tras fichar entrada)'))
      .toBeDisabled();
  });

  it('registra una entrada y actualiza el estado visible', async () => {
    // Una respuesta correcta debe habilitar la salida sin tener que cerrar y abrir el modal.
    vi.mocked(fichajeService.ficharEntrada).mockResolvedValue({
      success: true,
      message: 'ok',
      data: fichajeActivo,
    });
    const completed = vi.fn();
    const user = userEvent.setup();
    render(
      <FichajeModal
        isOpen
        onClose={vi.fn()}
        fichajeActivo={null}
        onFichajeCompleted={completed}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Fichar Entrada/ }));

    expect(await screen.findByText('Entrada registrada correctamente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fichar Salida/ })).toBeEnabled();
    expect(completed).toHaveBeenCalledOnce();
  });

  it('rechaza horas superiores al maximo antes de llamar al backend', async () => {
    // Frontend y backend deben compartir el rango de 0.5 a 16 horas para dar feedback inmediato.
    const user = userEvent.setup();
    render(
      <FichajeModal
        isOpen
        onClose={vi.fn()}
        fichajeActivo={fichajeActivo}
        onFichajeCompleted={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Horas a imputar'), '17');
    await user.click(screen.getByRole('button', { name: /Fichar Salida/ }));

    expect(await screen.findByText(/entre 0.5 y 16/)).toBeInTheDocument();
    expect(fichajeService.ficharSalida).not.toHaveBeenCalled();
  });
});
