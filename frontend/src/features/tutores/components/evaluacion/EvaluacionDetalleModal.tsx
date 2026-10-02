import { useState } from 'react';
import type { Evaluacion } from '../../../../types/evaluacion';
import { deleteEvaluacion } from '../../services/tutorService';
import { ScoreSelector } from './ScoreSelector';
import styles from './EvaluacionDetalleModal.module.css';

interface EvaluacionDetalleModalProps {
  evaluacion: Evaluacion;
  idBecario: number;
  puedeEliminar: boolean;
  onClose: () => void;
  onDelete: (idEvaluacion: number) => void;
}

const formatFecha = (fechaStr: string): string => {
  return new Date(fechaStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EvaluacionDetalleModal = ({
  evaluacion,
  idBecario,
  puedeEliminar,
  onClose,
  onDelete,
}: EvaluacionDetalleModalProps) => {
  const [confirmando, setConfirmando] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirmarEliminar = async () => {
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteEvaluacion(idBecario, evaluacion.idEvaluacion);
      onDelete(evaluacion.idEvaluacion);
      onClose();
    } catch (err) {
      console.error('Error al eliminar evaluación:', err);
      setDeleteError(
        err instanceof Error ? err.message : 'Error al eliminar la evaluación'
      );
      setDeleting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Cabecera */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Detalle de Evaluación</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.body}>
          {/* Título y fecha */}
          <div className={styles.section}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Título</span>
              <span className={styles.fieldValue}>{evaluacion.titulo}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Fecha</span>
              <span className={styles.fieldValue}>
                {formatFecha(evaluacion.fechaEvaluacion)}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Descripción</p>
            <p className={styles.descripcion}>
              {evaluacion.comentarios || '—'}
            </p>
          </div>

          {/* Puntuaciones individuales */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Puntuaciones</p>
            <div className={styles.scoresGrid}>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Puntualidad</span>
                <ScoreSelector
                  value={evaluacion.puntuacionPuntualidad}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Calidad del Trabajo</span>
                <ScoreSelector
                  value={evaluacion.puntuacionCalidad}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Actitud</span>
                <ScoreSelector
                  value={evaluacion.puntuacionActitud}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Autonomía</span>
                <ScoreSelector
                  value={evaluacion.puntuacionAutonomia}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Comunicación</span>
                <ScoreSelector
                  value={evaluacion.puntuacionComunicacion}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Puntuación media */}
          <div className={styles.mediaSection}>
            <span className={styles.mediaLabel}>Puntuación Media</span>
            <span className={styles.mediaValue}>
              {evaluacion.puntuacionMedia !== null
                ? evaluacion.puntuacionMedia.toFixed(2)
                : '—'}
            </span>
          </div>

          {/* Diálogo de confirmación de borrado */}
          {confirmando && (
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>
                ¿Estás seguro de que quieres eliminar esta evaluación? Esta
                acción no se puede deshacer.
              </p>
              {deleteError && (
                <p className={styles.deleteError}>{deleteError}</p>
              )}
              <div className={styles.confirmActions}>
                <button
                  className={styles.cancelConfirmBtn}
                  onClick={() => {
                    setConfirmando(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className={styles.confirmDeleteBtn}
                  onClick={handleConfirmarEliminar}
                  disabled={deleting}
                >
                  {deleting && <span className={styles.spinnerSmall} />}
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {puedeEliminar && !confirmando && (
            <button
              className={styles.eliminarBtn}
              onClick={() => setConfirmando(true)}
            >
              Eliminar
            </button>
          )}
          <button className={styles.cerrarBtn} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
