import type {
  UsuarioEditErrors,
  UsuarioEditField,
  UsuarioEditFormData,
} from '../components/usuario-edit/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generarContrasenaTemp(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export function validateUsuarioEditField(
  field: UsuarioEditField,
  value: string,
  requiredPracticaCliente = false
): string | undefined {
  switch (field) {
    case 'nombre':
    case 'apellidos':
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    case 'practica':
    case 'cliente':
      if (!requiredPracticaCliente) return undefined;
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    case 'emailInterno':
      if (value.trim() === '') return 'Este campo es obligatorio.';
      return EMAIL_RE.test(value.trim())
        ? undefined
        : 'Introduce un email válido (ej. usuario@empresa.com).';
    default:
      return undefined;
  }
}

export function validateUsuarioEditFieldOnBlur(
  field: UsuarioEditField,
  value: string,
  requiredPracticaCliente = false
): string | undefined {
  if (value.trim() === '') return undefined;
  return validateUsuarioEditField(field, value, requiredPracticaCliente);
}

export function validateUsuarioEditForm(
  formData: UsuarioEditFormData,
  fields: UsuarioEditField[],
  requiredPracticaCliente = false
): {
  errors: UsuarioEditErrors;
  touched: Partial<Record<UsuarioEditField, boolean>>;
  isValid: boolean;
} {
  const errors: UsuarioEditErrors = {};
  const touched: Partial<Record<UsuarioEditField, boolean>> = {};

  for (const field of fields) {
    touched[field] = true;
    const value = String(formData[field] ?? '');
    const error = validateUsuarioEditField(
      field,
      value,
      requiredPracticaCliente
    );
    if (error) errors[field] = error;
  }

  return {
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
  };
}
