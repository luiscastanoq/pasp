import type {
  FormErrors,
  NuevoUsuarioFormData,
  ValidableField,
} from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface DatosBasicosUsuarioFormProps {
  formData: NuevoUsuarioFormData;
  errors: FormErrors;
  isDisabled: boolean;
  isPracticaClienteDisabled: boolean;
  showPracticaCliente?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export function DatosBasicosUsuarioForm({
  formData,
  errors,
  isDisabled,
  isPracticaClienteDisabled,
  showPracticaCliente = true,
  onChange,
  onBlur,
  onSubmit,
}: DatosBasicosUsuarioFormProps) {
  const inputClass = (field: ValidableField, extraDisabled?: boolean) => {
    const base = styles.input;
    const error = errors[field] ? ` ${styles.inputError}` : '';
    const disabled =
      !formData || isDisabled || extraDisabled ? ` ${styles.inputDisabled}` : '';
    return `${base}${error}${disabled}`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardHeaderTitle}>
          <UsuarioEditIcon name="user" className={styles.cardHeaderIcon} />
          Datos de usuario
        </h2>
      </div>
      <div className={styles.cardBody}>
        <form
          id="nuevo-usuario-form"
          className={styles.form}
          noValidate
          onSubmit={event => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="nombre" className={styles.label}>
                Nombre <span className={styles.required}>*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className={inputClass('nombre')}
                value={formData.nombre}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Introduce el nombre"
                required
                disabled={isDisabled}
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? 'nombre-error' : undefined}
              />
              {errors.nombre && (
                <p id="nombre-error" className={styles.errorMessage} role="alert">
                  !  {errors.nombre}
                </p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="apellidos" className={styles.label}>
                Apellidos <span className={styles.required}>*</span>
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                className={inputClass('apellidos')}
                value={formData.apellidos}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Introduce los apellidos"
                required
                disabled={isDisabled}
                aria-invalid={!!errors.apellidos}
                aria-describedby={
                  errors.apellidos ? 'apellidos-error' : undefined
                }
              />
              {errors.apellidos && (
                <p
                  id="apellidos-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  !  {errors.apellidos}
                </p>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="emailInterno" className={styles.label}>
                Email interno <span className={styles.required}>*</span>
              </label>
              <input
                id="emailInterno"
                name="emailInterno"
                type="email"
                className={inputClass('emailInterno')}
                value={formData.emailInterno}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="usuario@empresa.com"
                required
                disabled={isDisabled}
                aria-invalid={!!errors.emailInterno}
                aria-describedby={errors.emailInterno ? 'email-error' : undefined}
              />
              {errors.emailInterno && (
                <p id="email-error" className={styles.errorMessage} role="alert">
                  !  {errors.emailInterno}
                </p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="contrasena" className={styles.label}>
                Contrasena <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputReadonlyWrapper}>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="text"
                  className={`${styles.input} ${styles.inputReadonly}`}
                  value={formData.contrasena}
                  readOnly
                  required
                />
                <span className={styles.lockIcon} aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 8h-1V6A4 4 0 0 0 8 6v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V6zm3 9.73V17a1 1 0 0 1-2 0v-1.27a2 2 0 1 1 2 0z" />
                  </svg>
                </span>
              </div>
              <p className={styles.fieldHint}>
                Contrasena temporal generada automaticamente para primer acceso
              </p>
            </div>
          </div>

          {showPracticaCliente && (
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="practica" className={styles.label}>
                Practica
                {!isPracticaClienteDisabled && (
                  <span className={styles.required}> *</span>
                )}
              </label>
              <input
                id="practica"
                name="practica"
                type="text"
                className={inputClass('practica', isPracticaClienteDisabled)}
                value={formData.practica}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={
                  isPracticaClienteDisabled
                    ? 'No aplica para este rol'
                    : 'Introduce la practica'
                }
                required={!isPracticaClienteDisabled}
                disabled={isPracticaClienteDisabled}
                aria-invalid={!!errors.practica}
                aria-describedby={
                  errors.practica ? 'practica-error' : undefined
                }
              />
              {errors.practica && !isPracticaClienteDisabled && (
                <p
                  id="practica-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  !  {errors.practica}
                </p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="cliente" className={styles.label}>
                Cliente
                {!isPracticaClienteDisabled && (
                  <span className={styles.required}> *</span>
                )}
              </label>
              <input
                id="cliente"
                name="cliente"
                type="text"
                className={inputClass('cliente', isPracticaClienteDisabled)}
                value={formData.cliente}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={
                  isPracticaClienteDisabled
                    ? 'No aplica para este rol'
                    : 'Introduce el cliente'
                }
                required={!isPracticaClienteDisabled}
                disabled={isPracticaClienteDisabled}
                aria-invalid={!!errors.cliente}
                aria-describedby={errors.cliente ? 'cliente-error' : undefined}
              />
              {errors.cliente && !isPracticaClienteDisabled && (
                <p
                  id="cliente-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  !  {errors.cliente}
                </p>
              )}
            </div>
          </div>
          )}
        </form>
      </div>
    </div>
  );
}
