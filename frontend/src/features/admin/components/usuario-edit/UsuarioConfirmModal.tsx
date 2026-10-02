import type { UsuarioDetalle } from '../../../../types/usuario.types';
import styles from '../../../../shared/components/ui/ui.module.css';

interface ToggleModalProps {
  usuario: UsuarioDetalle;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ToggleEstadoUsuarioModal({
  usuario,
  submitting,
  onCancel,
  onConfirm,
}: ToggleModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={event => event.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {usuario.activo ? 'Deshabilitar Usuario' : 'Habilitar Usuario'}
        </h3>
        <p className={styles.modalText}>
          {usuario.activo
            ? '¿Está seguro de que desea deshabilitar este usuario? No podrá acceder al sistema hasta que sea habilitado nuevamente.'
            : '¿Está seguro de que desea habilitar este usuario? Podrá acceder al sistema.'}
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={styles.saveButton}
            disabled={submitting}
          >
            {submitting ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  usuario: UsuarioDetalle;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EliminarUsuarioModal({
  usuario,
  submitting,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={event => event.stopPropagation()}>
        <h3 className={styles.modalTitle}>Eliminar Usuario</h3>
        <p className={styles.modalText}>
          ¿Está seguro de que desea eliminar permanentemente a{' '}
          <strong>
            {usuario.nombre} {usuario.apellidos}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={styles.deleteButton}
            disabled={submitting}
          >
            {submitting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
