import styles from '../../../../shared/components/ui/ui.module.css';

interface UsuarioEditActionsProps {
  submitting: boolean;
  onCancel: () => void;
  formId?: string;
}

export function UsuarioEditActions({
  submitting,
  onCancel,
  formId = 'editar-usuario-form',
}: UsuarioEditActionsProps) {
  return (
    <div className={styles.cardFooter}>
      <button
        type="button"
        className={styles.cancelButton}
        onClick={onCancel}
        disabled={submitting}
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        className={styles.saveButton}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className={styles.spinnerSmall} />
            Guardando...
          </>
        ) : (
          'Guardar cambios'
        )}
      </button>
    </div>
  );
}
