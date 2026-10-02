import type {
  DatosBecario,
  FormErrors,
  NuevoUsuarioFormData,
  ValidableField,
} from '../components/usuario-form/types';
import { ROLES_SIN_PRACTICA_CLIENTE } from '../components/usuario-form/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generarContrasenaTemp(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export function validateField(
  field: ValidableField,
  value: string,
  rol: string
): string | undefined {
  switch (field) {
    case 'nombre':
    case 'apellidos':
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    case 'emailInterno':
      if (value.trim() === '') return 'Este campo es obligatorio.';
      return EMAIL_RE.test(value.trim())
        ? undefined
        : 'Introduce un email valido (ej. usuario@empresa.com).';
    case 'practica':
    case 'cliente':
      if (ROLES_SIN_PRACTICA_CLIENTE.includes(rol)) return undefined;
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    default:
      return undefined;
  }
}

export function validateFieldOnBlur(
  field: ValidableField,
  value: string,
  rol: string
): string | undefined {
  if (value.trim() === '') return undefined;
  return validateField(field, value, rol);
}

export function validateUsuarioForm(
  formData: NuevoUsuarioFormData,
  rol: string
): {
  errors: FormErrors;
  touched: Partial<Record<ValidableField, boolean>>;
  isValid: boolean;
} {
  const allFields: ValidableField[] = [
    'nombre',
    'apellidos',
    'emailInterno',
    'practica',
    'cliente',
  ];
  const errors: FormErrors = {};
  const touched: Partial<Record<ValidableField, boolean>> = {};

  for (const field of allFields) {
    touched[field] = true;
    const error = validateField(field, formData[field], rol);
    if (error) errors[field] = error;
  }

  return {
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
  };
}

export function validateDatosBecarioField(
  field: keyof DatosBecario,
  value: string
): string | undefined {
  if (field === 'horasContrato') {
    if (value.trim() === '') return 'Este campo es obligatorio.';
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1) {
      return 'Debe ser un número entero positivo (≥ 1).';
    }
    return undefined;
  }

  if (field === 'ayudaEconomica') {
    if (value.trim() === '') return undefined;
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
      return 'Debe ser un numero entero no negativo.';
    }
    return undefined;
  }

  if (field === 'fechaInicioPracticas' || field === 'fechaFinPracticas') {
    return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
  }

  if (
    field === 'tipoFormacion' ||
    field === 'nombreFormacion' ||
    field === 'centroEstudios'
  ) {
    return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
  }

  if (field === 'emailPersonal') {
    if (value.trim() === '') return undefined;
    return EMAIL_RE.test(value.trim()) ? undefined : 'Introduce un email válido.';
  }

  return undefined;
}

export function validateDatosBecarioFieldOnBlur(
  field: keyof DatosBecario,
  value: string
): string | undefined {
  if (value.trim() === '') return undefined;
  return validateDatosBecarioField(field, value);
}

export function validateDatosBecarioSubmit(datosBecario: DatosBecario): {
  errors: Partial<Record<keyof DatosBecario, string>>;
  touched: Partial<Record<keyof DatosBecario, boolean>>;
  isValid: boolean;
} {
  const camposObligatorios: (keyof DatosBecario)[] = [
    'horasContrato',
    'fechaInicioPracticas',
    'fechaFinPracticas',
    'tipoFormacion',
    'nombreFormacion',
    'centroEstudios',
  ];
  const touched: Partial<Record<keyof DatosBecario, boolean>> = {};
  const errors: Partial<Record<keyof DatosBecario, string>> = {};

  for (const campo of camposObligatorios) {
    touched[campo] = true;
    const error = validateDatosBecarioField(campo, datosBecario[campo]);
    if (error) errors[campo] = error;
  }

  if (datosBecario.emailPersonal.trim() !== '') {
    const emailError = validateDatosBecarioField(
      'emailPersonal',
      datosBecario.emailPersonal
    );
    if (emailError) {
      errors.emailPersonal = emailError;
      touched.emailPersonal = true;
    }
  }

  if (datosBecario.ayudaEconomica.trim() !== '') {
    const ayudaError = validateDatosBecarioField(
      'ayudaEconomica',
      datosBecario.ayudaEconomica
    );
    if (ayudaError) {
      errors.ayudaEconomica = ayudaError;
      touched.ayudaEconomica = true;
    }
  }

  return {
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
  };
}
