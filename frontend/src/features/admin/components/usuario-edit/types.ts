export interface UsuarioEditFormData {
  nombre: string;
  apellidos: string;
  emailInterno: string;
  contrasena: string;
  practica?: string;
  cliente?: string;
}

export type UsuarioEditField =
  | 'nombre'
  | 'apellidos'
  | 'emailInterno'
  | 'practica'
  | 'cliente';

export type UsuarioEditErrors = Partial<Record<UsuarioEditField, string>>;

export type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;
