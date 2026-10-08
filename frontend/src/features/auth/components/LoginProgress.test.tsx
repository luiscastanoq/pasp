import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authService,
  type DatabaseReadinessStatus,
} from '../services/authService';
import { LoginProgress } from './LoginProgress';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('LoginProgress', () => {
  it('actualiza el contador sin inventar respuestas ni anunciar cada segundo', async () => {
    vi.useFakeTimers();
    let publish!: (status: DatabaseReadinessStatus) => void;
    const unsubscribe = vi.fn();
    vi.spyOn(authService, 'subscribeDatabaseReadiness').mockImplementation(
      listener => {
        publish = listener;
        listener({ phase: 'checking', lastResponseAt: null });
        return unsubscribe;
      }
    );
    const { unmount } = render(<LoginProgress />);
    expect(screen.getByText(/Esperando la primera respuesta/)).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(95_000));
    expect(screen.getByLabelText(/Tiempo de espera/)).toHaveTextContent(
      '1 min 35 s'
    );
    expect(screen.getByText(/Esperando la primera respuesta/)).toBeVisible();
    expect(screen.getByRole('status')).not.toHaveTextContent('1 min 35 s');

    act(() => publish({ phase: 'waking', lastResponseAt: Date.now() }));
    await act(() => vi.advanceTimersByTimeAsync(4_000));
    expect(
      screen.getByText('El servidor respondió hace 4 s: sigue iniciándose.')
    ).toBeVisible();
    act(() =>
      publish({ phase: 'checking', lastResponseAt: Date.now() - 4_000 })
    );
    expect(screen.getByText(/Última respuesta hace 4 s/)).toBeVisible();
    act(() => publish({ phase: 'ready', lastResponseAt: Date.now() }));
    expect(
      screen.getAllByText('Servicio disponible. Iniciando sesión…')
    ).toHaveLength(2);
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
