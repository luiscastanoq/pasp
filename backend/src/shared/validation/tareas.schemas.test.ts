import { describe, expect, it } from 'vitest';

import { ESTADO_TAREA } from '../constants/domain.constants';
import {
  createTareaSchema,
  updateEstadoTareaSchema,
  updateTareaSchema,
} from './tareas.schemas';

describe('tareas.schemas', () => {
  it('acepta una tarea nueva con los campos minimos validos', () => {
    // Este test protege el caso normal: una tarea debe poder crearse con nombre y fecha de inicio.
    const result = createTareaSchema.safeParse({
      nombreTarea: 'Preparar informe',
      fechaInicio: '2026-07-13',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza una tarea nueva sin nombre', () => {
    // El nombre es obligatorio porque despues se usa para identificar la tarea en listados y detalle.
    const result = createTareaSchema.safeParse({
      nombreTarea: '',
      fechaInicio: '2026-07-13',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['nombreTarea']);
  });

  it('rechaza una fecha de inicio no valida', () => {
    // Este test evita que llegue al sistema una fecha que luego romperia calculos o conversiones.
    const result = createTareaSchema.safeParse({
      nombreTarea: 'Preparar informe',
      fechaInicio: 'fecha-rara',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['fechaInicio']);
  });

  it('rechaza una actualizacion vacia', () => {
    // Una actualizacion sin campos no cambia nada, asi que la API debe considerarla una peticion invalida.
    const result = updateTareaSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('acepta solo estados de tarea permitidos', () => {
    // El estado debe estar controlado para evitar valores que la interfaz no sabe representar.
    const validResult = updateEstadoTareaSchema.safeParse({
      estado: ESTADO_TAREA.COMPLETADA,
    });
    const invalidResult = updateEstadoTareaSchema.safeParse({
      estado: 'Terminada',
    });

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });
});
