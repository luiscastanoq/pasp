import type { UsuarioDetalle } from '../../../../types/usuario.types';
import type {
  UsuarioEditErrors,
  UsuarioEditField,
  UsuarioEditFormData,
} from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from './UsuarioEditIcon';

interface UsuarioBaseFormProps {
  usuario: UsuarioDetalle;
  formData: UsuarioEditFormData;
  errors: UsuarioEditErrors;
  roleLabel: string;
  roleBadgeClassName: string;
  practicaClienteMode: 'readonly' | 'editable';
  showEmailInterno?: boolean;
  showPracticaCliente?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onRegenerarContrasena: () => void;
}

export function UsuarioBaseForm({
  usuario,
  formData,
  errors,
  roleLabel,
  roleBadgeClassName,
  practicaClienteMode,
  showEmailInterno = true,
  showPracticaCliente = true,
  onChange,
  onBlur,
  onSubmit,
  onRegenerarContrasena,
}: UsuarioBaseFormProps) {
  const inputClass = (field: UsuarioEditField) => {
    const error = errors[field] ? ` ${styles.inputError}` : '';
    return `${styles.input}${error}`;
  };

  const practicaClienteEditable = practicaClienteMode === 'editable';
  const compactIdentityLayout = !showEmailInterno && !showPracticaCliente;

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
          id="editar-usuario-form"
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
            {showEmailInterno && (
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
                aria-invalid={!!errors.emailInterno}
                aria-describedby={errors.emailInterno ? 'email-error' : undefined}
              />
              {errors.emailInterno && (
                <p id="email-error" className={styles.errorMessage} role="alert">
                  !  {errors.emailInterno}
                </p>
              )}
            </div>
            )}

            <div
              className={`${styles.formField} ${
                compactIdentityLayout ? styles.formFieldFull : ''
              }`}
            >
              <label htmlFor="contrasena" className={styles.label}>
                Contraseña
              </label>
              <div className={styles.inputReadonlyWrapper}>
                <input
                  id="contrasena"
                  name="contrasena"
                  type={usuario.primerAcceso ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputReadonly}`}
                  value={formData.contrasena}
                  readOnly
                  placeholder="Contraseña cifrada, regenerar para cambiar"
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
              <button
                type="button"
                onClick={onRegenerarContrasena}
                className={styles.regenerarButton}
                title="Restablece la contraseña del usuario a una temporal"
              >
                Restablecer a nueva contraseña temporal
              </button>
              {formData.contrasena ? (
                <p className={styles.fieldHint}>
                  Nueva contraseña temporal: <strong>{formData.contrasena}</strong>
                </p>
              ) : (
                <p className={styles.fieldHint}>
                  Sin cambios — se mantendrá la contraseña actual
                </p>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Primer acceso</label>
              <input
                type="text"
                className={`${styles.input} ${styles.inputReadonly}`}
                value={usuario.primerAcceso ? 'Sí (pendiente)' : 'No'}
                readOnly
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Rol</label>
              <div>
                <span className={roleBadgeClassName}>{roleLabel}</span>
              </div>
            </div>
          </div>

          {showPracticaCliente && (
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="practica" className={styles.label}>
                Práctica
                {practicaClienteEditable && (
                  <span className={styles.required}> *</span>
                )}
              </label>
              <input
                id="practica"
                name="practica"
                type="text"
                className={
                  practicaClienteEditable
                    ? inputClass('practica')
                    : `${styles.input} ${styles.inputReadonly}`
                }
                value={
                  practicaClienteEditable
                    ? formData.practica ?? ''
                    : 'No aplica para este rol'
                }
                onChange={onChange}
                onBlur={onBlur}
                readOnly={!practicaClienteEditable}
                required={practicaClienteEditable}
              />
              {practicaClienteEditable && errors.practica && (
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
                {practicaClienteEditable && (
                  <span className={styles.required}> *</span>
                )}
              </label>
              <input
                id="cliente"
                name="cliente"
                type="text"
                className={
                  practicaClienteEditable
                    ? inputClass('cliente')
                    : `${styles.input} ${styles.inputReadonly}`
                }
                value={
                  practicaClienteEditable
                    ? formData.cliente ?? ''
                    : 'No aplica para este rol'
                }
                onChange={onChange}
                onBlur={onBlur}
                readOnly={!practicaClienteEditable}
                required={practicaClienteEditable}
              />
              {practicaClienteEditable && errors.cliente && (
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
