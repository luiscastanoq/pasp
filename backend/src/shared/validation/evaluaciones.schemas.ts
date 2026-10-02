import { z } from 'zod';
import { requiredStringSchema } from './common.schemas';

const puntuacionSchema = z.coerce
  .number()
  .int('La puntuacion debe ser un entero')
  .min(1, 'La puntuacion minima es 1')
  .max(5, 'La puntuacion maxima es 5');

export const createEvaluacionSchema = z.object({
  titulo: requiredStringSchema,
  descripcion: requiredStringSchema,
  puntuacionPuntualidad: puntuacionSchema,
  puntuacionCalidad: puntuacionSchema,
  puntuacionActitud: puntuacionSchema,
  puntuacionAutonomia: puntuacionSchema,
  puntuacionComunicacion: puntuacionSchema,
});
