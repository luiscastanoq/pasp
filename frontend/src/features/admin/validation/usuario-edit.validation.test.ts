import { describe, expect, it } from 'vitest';

import {
  validateUsuarioEditField,
  validateUsuarioEditForm,
} from './usuario-edit.validation';

describe('validacion de edicion de usuarios', () => {
  it('rechaza nombre vacio y email incorrecto', () => {
    // Estos errores deben detectarse antes de enviar una modificacion al backend.
    expect(validateUsuarioEditField('nombre', '   ')).toBeDefined();
    expect(validateUsuarioEditField('emailInterno', 'correo-roto')).toContain('email válido');
  });

  it('solo exige practica y cliente en los roles que los necesitan', () => {
    // El mismo formulario se reutiliza para roles distintos y sus requisitos no son iguales.
    expect(validateUsuarioEditField('practica', '', false)).toBeUndefined();
    expect(validateUsuarioEditField('practica', '', true)).toBeDefined();
    expect(validateUsuarioEditField('cliente', '', true)).toBeDefined();
  });

  it('valida conjuntamente solo los campos indicados por la pantalla', () => {
    // Una pagina de administrador no debe fallar por campos opcionales que ni siquiera muestra.
    const result = validateUsuarioEditForm(
      {
        nombre: 'Ana',
        apellidos: 'Lopez',
        emailInterno: 'ana@test.com',
        contrasena: '',
      },
      ['nombre', 'apellidos', 'emailInterno'],
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });
});
