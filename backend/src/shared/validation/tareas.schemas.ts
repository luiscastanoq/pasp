import { z } from 'zod';
import { ESTADOS_TAREA } from '../constants/domain.constants';
import { optionalDateStringSchema, optionalStringSchema, requiredStringSchema } from './common.schemas';

export const estadoTareaSchema = z.enum([...ESTADOS_TAREA]);

export const createTareaSchema = z.object({
  nombreTarea: requiredStringSchema,
  descripcion: optionalStringSchema,
  fechaInicio: optionalDateStringSchema,
  fechaFinEstimada: optionalDateStringSchema.optional(),
});

export const updateTareaSchema = z
  .object({
    nombreTarea: optionalStringSchema,
    descripcion: optionalStringSchema,
    estado: estadoTareaSchema.optional(),
    fechaFinEstimada: optionalDateStringSchema.optional(),
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export const updateEstadoTareaSchema = z.object({
  estado: estadoTareaSchema,
});
