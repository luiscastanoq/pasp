import { z } from 'zod';
import { TIPOS_FORMACION_COMPATIBLES, TIPOS_TUTORIA } from '../constants/domain.constants';
import {
  optionalDateStringSchema,
  optionalStringSchema,
  requiredStringSchema,
} from './common.schemas';

const tipoFormacionSchema = z.enum([...TIPOS_FORMACION_COMPATIBLES]);
const ayudaEconomicaSchema = z.preprocess(
  value => (value === '' ? undefined : value),
  z.coerce
    .number()
    .int('La ayuda economica debe ser un numero entero')
    .min(0, 'La ayuda economica no puede ser negativa')
    .optional(),
);
const nullableAyudaEconomicaSchema = z.preprocess(
  value => (value === '' ? null : value),
  z
    .union([
      z.null(),
      z.coerce
        .number()
        .int('La ayuda economica debe ser un numero entero')
        .min(0, 'La ayuda economica no puede ser negativa'),
    ])
    .optional(),
);
const tutorAsignadoSchema = z.object({
  tutorId: z.coerce.number().int().positive(),
  tipoTutoria: z.enum([...TIPOS_TUTORIA]),
});

export const createTutorBecarioSchema = z.object({
  nombre: requiredStringSchema,
  apellidos: requiredStringSchema,
  email: z.string().trim().email('El formato del email no es valido'),
  contrasena: requiredStringSchema,
  practica: requiredStringSchema,
  cliente: requiredStringSchema,
  horasContrato: z.coerce.number().positive('Las horas de contrato deben ser positivas'),
  ayudaEconomica: ayudaEconomicaSchema,
  equipoEnUso: optionalStringSchema,
  fechaInicioPracticas: optionalDateStringSchema,
  fechaFinPracticas: optionalDateStringSchema,
  tipoFormacion: tipoFormacionSchema,
  nombreFormacion: requiredStringSchema,
  centroEstudios: requiredStringSchema,
  telefonoPersonal: optionalStringSchema,
  emailPersonal: z
    .string()
    .trim()
    .email('El formato del email personal no es valido')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .or(z.null()),
  linkedin: optionalStringSchema,
  tutoresAsignados: z.array(tutorAsignadoSchema).optional().default([]),
});

export const updateBecarioCorporativoAcademicoSchema = z
  .object({
    practica: optionalStringSchema,
    cliente: optionalStringSchema,
    horasContrato: z.coerce.number().positive('Las horas de contrato deben ser positivas').optional(),
    ayudaEconomica: nullableAyudaEconomicaSchema,
    equipoEnUso: optionalStringSchema,
    fechaInicioPracticas: optionalDateStringSchema.optional(),
    fechaFinPracticas: optionalDateStringSchema.optional().or(z.literal('').transform(() => null)),
    tipoFormacion: tipoFormacionSchema.optional(),
    nombreGradoUniversitario: optionalStringSchema,
    nombreFormacionProfesional: optionalStringSchema,
    centroEstudios: optionalStringSchema,
    telefonoPersonal: optionalStringSchema,
    emailPersonal: z
      .string()
      .trim()
      .email('El formato del email personal no es valido')
      .optional()
      .or(z.literal('').transform(() => null))
      .or(z.null()),
    linkedin: optionalStringSchema,
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export const updateTutorBecarioUsuarioSchema = z
  .object({
    nombre: optionalStringSchema,
    apellidos: optionalStringSchema,
    email: z.string().trim().email('El formato del email no es valido').optional(),
    contrasena: optionalStringSchema,
    practica: optionalStringSchema,
    cliente: optionalStringSchema,
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export const updateTutorBecarioTutoresSchema = z.object({
  tutores: z.array(
    z.object({
      tutorId: z.coerce.number().int().positive(),
      tipoTutoria: z.enum([...TIPOS_TUTORIA]),
    })
  ),
});
