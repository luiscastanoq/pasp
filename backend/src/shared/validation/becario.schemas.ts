import { z } from 'zod';
import { optionalStringSchema } from './common.schemas';

export const updateBecarioProfileSchema = z
  .object({
    telefono_personal: optionalStringSchema,
    email_personal: optionalStringSchema,
    linkedin: optionalStringSchema,
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });
