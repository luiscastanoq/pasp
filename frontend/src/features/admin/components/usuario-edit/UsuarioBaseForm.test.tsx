import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ROLES } from '../../../../shared/constants/domain.constants';
import { UsuarioBaseForm } from './UsuarioBaseForm';

const usuario = {
  idUsuario: 7,
  nombre: 'Ana',
  apellidos: 'Lopez',
  email: 'ana@test.com',
  rol: ROLES.ADMIN,
  activo: true,
  primerAcceso: false,
  esSuperAdmin: false,
  practica: null,
  cliente: null,
};

describe('UsuarioBaseForm', () => {
  const baseProps = {
    usuario,
    formData: {
      nombre: 'Ana',
      apellidos: 'Lopez',
      emailInterno: 'ana@test.com',
      contrasena: '',
    },
    errors: {},
    roleLabel: 'Administrador',
    roleBadgeClassName: 'badge',
    practicaClienteMode: 'readonly' as const,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onSubmit: vi.fn(),
    onRegenerarContrasena: vi.fn(),
  };

  it('muestra los datos actuales y mantiene la contrasena oculta', () => {
    // La edicion debe cargar los valores existentes sin exponer la contrasena almacenada.
    render(<UsuarioBaseForm {...baseProps} />);

    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Ana');
    expect(screen.getByLabelText(/Email interno/)).toHaveValue('ana@test.com');
    expect(screen.getByLabelText(/Contrase/)).toHaveAttribute('type', 'password');
    expect(screen.getByText(/Sin cambios/)).toBeInTheDocument();
  });

  it('permite solicitar una nueva contrasena temporal', async () => {
    // El boton no modifica directamente el usuario: avisa a la pagina para generar la clave.
    const onRegenerarContrasena = vi.fn();
    const user = userEvent.setup();
    render(
      <UsuarioBaseForm
        {...baseProps}
        onRegenerarContrasena={onRegenerarContrasena}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Restablecer/ }));

    expect(onRegenerarContrasena).toHaveBeenCalledOnce();
  });

  it('relaciona los errores visibles con sus campos', () => {
    // aria-invalid permite que una persona y las ayudas de accesibilidad identifiquen el problema.
    render(
      <UsuarioBaseForm
        {...baseProps}
        errors={{ emailInterno: 'Email incorrecto' }}
      />,
    );

    expect(screen.getByLabelText(/Email interno/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Email incorrecto');
  });
});
