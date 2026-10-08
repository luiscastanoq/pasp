import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../shared/api/api';
import { Login } from './Login';
import { useAuth } from '../context/useAuth';
import { authService } from '../services/authService';

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Login', () => {
  const login = vi.fn();
  const warmUpDatabase = vi.spyOn(authService, 'warmUpDatabase');

  beforeEach(() => {
    vi.clearAllMocks();
    warmUpDatabase.mockResolvedValue();
    vi.mocked(useAuth).mockReturnValue({
      login,
      isLoading: false,
      loginStatus: 'idle',
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['administrador', 'Administrador'],
    ['tutor de empresa', 'Tutor_Empresa'],
    ['tutor académico', 'Tutor_Academico'],
    ['becario', 'Becario'],
  ])('entra como %s sin pedir credenciales', async (label, role) => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Login />);
    await user.click(
      screen.getByRole('button', { name: /Explora la aplicación/ })
    );
    await user.click(
      screen.getByRole('button', { name: `Entrar como ${label}` })
    );
    expect(login).toHaveBeenCalledWith({ role });
  });

  it('muestra los accesos demo en el orden solicitado', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(
      screen.getByRole('button', { name: /Explora la aplicación/ })
    );

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map(heading => heading.textContent)
    ).toEqual([
      'Becario',
      'Tutor de empresa',
      'Administrador',
      'Tutor académico',
    ]);
  });

  it('empieza a preparar la base un segundo después de cargar el login', async () => {
    vi.useFakeTimers();
    render(<Login />);

    expect(warmUpDatabase).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(warmUpDatabase).toHaveBeenCalledTimes(1);
  });

  it('envia el email y la contrasena escritos por el usuario', async () => {
    // Probamos el formulario desde fuera, usando los mismos campos y boton que usaria una persona.
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'ana@test.com');
    await user.type(screen.getByLabelText(/^Contrase/), 'Password123');
    await user.click(screen.getByRole('button', { name: /Iniciar/ }));

    expect(login).toHaveBeenCalledWith({
      email: 'ana@test.com',
      password: 'Password123',
    });
  });

  it('muestra el mensaje que devuelve la API cuando el login falla', async () => {
    // El usuario necesita una explicacion visible cuando sus credenciales son incorrectas.
    login.mockRejectedValue(new ApiError(401, 'Credenciales incorrectas'));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'ana@test.com');
    await user.type(screen.getByLabelText(/^Contrase/), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /Iniciar/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Credenciales incorrectas/
    );
  });

  it('desactiva campos y boton mientras se inicia sesion', () => {
    // Bloquear los controles durante el envio evita dos peticiones de login seguidas.
    vi.mocked(useAuth).mockReturnValue({
      login,
      isLoading: true,
      loginStatus: 'authenticating',
    } as never);
    render(<Login />);

    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText(/^Contrase/)).toBeDisabled();
    const connectionStatus = screen.getByRole('status');
    expect(connectionStatus).toHaveTextContent(/Comprobando disponibilidad/);
    expect(screen.getByText(/Reactivando el servicio/)).toHaveTextContent(
      /Entrarás automáticamente/
    );
    expect(connectionStatus).not.toHaveTextContent(
      /Estamos comprobando que todos los servicios/
    );
    expect(
      screen.getByRole('button', { name: /Preparando acceso/ })
    ).toBeDisabled();
  });

  it('avisa del calentamiento anticipado sin bloquear el formulario', async () => {
    vi.useFakeTimers();
    warmUpDatabase.mockImplementationOnce(options => {
      options?.onDatabaseWaking?.();
      return new Promise(() => undefined);
    });
    render(<Login />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      /Puedes completar tus datos/
    );
    expect(screen.getByLabelText('Email')).toBeEnabled();
    expect(screen.getByLabelText(/^Contrase/)).toBeEnabled();
    expect(
      screen.getByRole('button', { name: /Iniciar Sesión/ })
    ).toBeEnabled();
  });

  it('explica que el sistema se está preparando mientras arranca la base', () => {
    vi.mocked(useAuth).mockReturnValue({
      login,
      isLoading: true,
      loginStatus: 'waking-database',
    } as never);
    render(<Login />);

    expect(screen.getByText(/Reactivando el servicio/)).toBeVisible();
    expect(screen.getByLabelText(/Tiempo de espera/)).toHaveTextContent('0 s');
    expect(screen.queryByText(/\(30s\)/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Preparando acceso/ })
    ).toBeDisabled();
  });

  it('permite mostrar y volver a ocultar la contraseña', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText(/^Contrase/);
    await user.type(passwordInput, 'Password123');
    await user.click(
      screen.getByRole('button', { name: 'Mostrar contraseña' })
    );

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('Password123');

    await user.click(
      screen.getByRole('button', { name: 'Ocultar contraseña' })
    );
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
