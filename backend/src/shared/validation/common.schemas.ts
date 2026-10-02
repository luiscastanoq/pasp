import { z } from 'zod';

export const positiveIntSchema = z.coerce
  .number()
  .int('Debe ser un numero entero')
  .positive('Debe ser un numero positivo');

export const idParamSchema = z.object({
  id: positiveIntSchema,
});

export const idTareaParamSchema = z.object({
  idTarea: positiveIntSchema,
});

export const idEvaluacionParamSchema = z.object({
  idBecario: positiveIntSchema,
  idEvaluacion: positiveIntSchema,
});

export const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal('').transform(() => undefined))
  .or(z.null());

export const requiredStringSchema = z
  .string()
  .trim()
  .min(1, 'Campo obligatorio');

export const optionalDateStringSchema = z
  .string()
  .trim()
  .min(1, 'Fecha obligatoria')
  .refine(value => !Number.isNaN(Date.parse(value)), 'Fecha no valida');
