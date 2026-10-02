import { z } from 'zod';
import {
  ROLES,
  ROLES_USUARIO,
  TIPO_FORMACION,
  TIPO_TUTORIA,
  TIPOS_FORMACION_COMPATIBLES,
  TIPOS_TUTORIA,
  TIPOS_TUTORIA_EMPRESA,
} from '../constants/domain.constants';
import {
  optionalDateStringSchema,
  optionalStringSchema,
  positiveIntSchema,
  requiredStringSchema,
} from './common.schemas';

const roleSchema = z.enum([...ROLES_USUARIO]);

const tipoTutoriaSchema = z.enum([...TIPOS_TUTORIA]);
const tipoTutoriaEmpresaSchema = z.enum([...TIPOS_TUTORIA_EMPRESA]);
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
  tutorId: positiveIntSchema,
  tipoTutoria: tipoTutoriaSchema,
});

const becarioEmpresaSchema = z.object({
  becarioId: positiveIntSchema,
  tipoTutoria: tipoTutoriaEmpresaSchema,
});

export const createUsuarioSchema = z
  .object({
    nombre: requiredStringSchema,
    apellidos: requiredStringSchema,
    email: z.string().trim().email('El formato del email no es valido'),
    contrasena: requiredStringSchema,
    rol: roleSchema,
    practica: optionalStringSchema,
    cliente: optionalStringSchema,
    becarioIds: z.array(positiveIntSchema).optional().default([]),
    becarios: z.array(becarioEmpresaSchema).optional().default([]),
    horasContrato: z.coerce.number().positive('Las horas de contrato deben ser positivas').optional(),
    ayudaEconomica: ayudaEconomicaSchema,
    equipoEnUso: optionalStringSchema,
    fechaInicioPracticas: optionalDateStringSchema.optional(),
    fechaFinPracticas: optionalDateStringSchema.optional(),
    tipoFormacion: tipoFormacionSchema.optional(),
    nombreFormacion: optionalStringSchema,
    centroEstudios: optionalStringSchema,
    telefonoPersonal: optionalStringSchema,
    emailPersonal: optionalStringSchema,
    linkedin: optionalStringSchema,
    tutoresAsignados: z.array(tutorAsignadoSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.rol === ROLES.TUTOR_EMPRESA) {
      if (!data.practica) ctx.addIssue({ code: 'custom', path: ['practica'], message: 'Campo obligatorio' });
      if (!data.cliente) ctx.addIssue({ code: 'custom', path: ['cliente'], message: 'Campo obligatorio' });
    }

    if (data.rol === ROLES.BECARIO) {
      const requiredFields = [
        'practica',
        'cliente',
        'horasContrato',
        'fechaInicioPracticas',
        'fechaFinPracticas',
        'tipoFormacion',
        'nombreFormacion',
        'centroEstudios',
      ] as const;

      requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          ctx.addIssue({ code: 'custom', path: [field], message: 'Campo obligatorio' });
        }
      });
    }
  });

export const updateUsuarioSchema = z
  .object({
    nombre: optionalStringSchema,
    apellidos: optionalStringSchema,
    email: z.string().trim().email('El formato del email no es valido').optional(),
    contrasena: optionalStringSchema,
    practica: optionalStringSchema,
    cliente: optionalStringSchema,
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Se debe proporcionar al menos un campo para actualizar',
  });

export const updateBecarioDetalleSchema = z
  .object({
    horasContrato: z.coerce.number().positive('Las horas de contrato deben ser positivas').optional(),
    ayudaEconomica: nullableAyudaEconomicaSchema,
    equipoEnUso: optionalStringSchema,
    fechaInicioPracticas: optionalDateStringSchema.optional(),
    fechaFinPracticas: optionalDateStringSchema.optional(),
    tipoFormacion: tipoFormacionSchema.optional(),
    nombreFormacion: optionalStringSchema,
    centroEstudios: optionalStringSchema,
    telefonoPersonal: optionalStringSchema,
    emailPersonal: optionalStringSchema,
    linkedin: optionalStringSchema,
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'Se debe proporcionar al menos un campo para actualizar',
  });

export const tutoresBecarioSchema = z.object({
  tutores: z.array(tutorAsignadoSchema),
});

export const becariosTutorAcademicoSchema = z.object({
  becarioIds: z.array(positiveIntSchema),
});

export const becariosTutorEmpresaSchema = z.object({
  becarios: z.array(becarioEmpresaSchema),
});

export { TIPO_FORMACION, TIPO_TUTORIA };
