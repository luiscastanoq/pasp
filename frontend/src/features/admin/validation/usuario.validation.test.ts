import { describe, expect, it } from 'vitest';

import { ROLES } from '../../../shared/constants/domain.constants';
import { DATOS_BECARIO_EMPTY } from '../components/usuario-form/types';
import {
  validateDatosBecarioSubmit,
  validateField,
  validateUsuarioForm,
} from './usuario.validation';

describe('validacion de usuarios', () => {
  it('rechaza un email interno con formato incorrecto', () => {
    // Detectamos el error antes de enviar una peticion innecesaria al backend.
    expect(validateField('emailInterno', 'email-invalido', ROLES.ADMIN))
      .toContain('email valido');
  });

  it('no exige practica ni cliente a un administrador', () => {
    // Estos campos solo tienen sentido para roles relacionados con practicas de empresa.
    const result = validateUsuarioForm({
      nombre: 'Ana',
      apellidos: 'Lopez',
      emailInterno: 'ana@test.com',
      contrasena: 'temporal',
      practica: '',
      cliente: '',
    }, ROLES.ADMIN);

    expect(result.isValid).toBe(true);
  });

  it('exige practica y cliente a un becario', () => {
    // Una ficha de becario quedaria incompleta si se permitiera guardar sin estos datos.
    const result = validateUsuarioForm({
      nombre: 'Ana',
      apellidos: 'Lopez',
      emailInterno: 'ana@test.com',
      contrasena: 'temporal',
      practica: '',
      cliente: '',
    }, ROLES.BECARIO);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('practica');
    expect(result.errors).toHaveProperty('cliente');
  });

  it('rechaza datos obligatorios vacios y horas de contrato no validas', () => {
    // La validacion conjunta evita crear un perfil que luego no se pueda utilizar correctamente.
    const emptyResult = validateDatosBecarioSubmit(DATOS_BECARIO_EMPTY);
    const invalidHoursResult = validateDatosBecarioSubmit({
      ...DATOS_BECARIO_EMPTY,
      horasContrato: '-5',
      fechaInicioPracticas: '2026-01-01',
      fechaFinPracticas: '2026-06-01',
      tipoFormacion: 'Universitaria',
      nombreFormacion: 'Informatica',
      centroEstudios: 'Universidad',
    });

    expect(emptyResult.isValid).toBe(false);
    expect(invalidHoursResult.errors.horasContrato).toBeDefined();
  });
});
