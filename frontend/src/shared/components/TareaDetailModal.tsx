import { useCallback, useEffect, useState } from 'react';
import type {
  Tarea,
  EstadoTarea,
  TareaHistorialEntry,
  UpdateTareaData,
} from '../../types/tarea';
import { becarioService } from '../../features/becarios/services/becarioService';
import * as tutorService from '../../features/tutores/services/tutorService';
import { ROLES } from '../constants/domain.constants';
import { DatePickerInput } from './ui/DatePickerInput';
import styles from './TareaDetailModal.module.css';

interface TareaDetailModalProps {
  tarea: Tarea;
  onClose: () => void;
  userRole?: typeof ROLES.TUTOR_EMPRESA | typeof ROLES.BECARIO;
  onUpdate?: (idTarea: number, data: UpdateTareaData) => Promise<void>;
  onDelete?: (idTarea: number) => Promise<void>;
}

const ESTADO_LABELS: Record<EstadoTarea, string> = {
  Pendiente: 'Pendiente',
  En_Progreso: 'En Progreso',
  Completada: 'Completada',
};
const ESTADO_COLORS: Record<EstadoTarea, string> = {
  Pendiente: '#b45309',
  En_Progreso: '#1d4ed8',
  Completada: '#15803d',
};

export const TareaDetailModal = ({
  tarea,
  onClose,
  userRole = ROLES.BECARIO,
  onUpdate,
  onDelete,
}: TareaDetailModalProps) => {
  const isTutor = userRole === ROLES.TUTOR_EMPRESA;

  const [historial, setHistorial] = useState<TareaHistorialEntry[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [historialError, setHistorialError] = useState<string | null>(null);

  const [nombreTarea, setNombreTarea] = useState(tarea.nombreTarea);
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? '');
  const [fechaFinEstimada, setFechaFinEstimada] = useState(
    tarea.fechaFinEstimada ? tarea.fechaFinEstimada.split('T')[0] : ''
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    setHistorialError(null);
    try {
      if (isTutor) {
        const r = await tutorService.getTareaHistorial(tarea.idTarea);
        if (r.success && r.data) {
          setHistorial(r.data);
        }
      } else {
        const r = await becarioService.getTareaHistorial(tarea.idTarea);
        if (r.success && r.data) {
          setHistorial(r.data);
        }
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorialError('No se pudo cargar el historial');
    } finally {
      setLoadingHistorial(false);
    }
  }, [isTutor, tarea.idTarea]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistorial();
    });
  }, [loadHistorial]);

  const formatDate = (d: string | null) =>
    !d
      ? '—'
      : new Date(d).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!nombreTarea.trim()) {
      errors.nombreTarea = 'El nombre es obligatorio';
    } else if (nombreTarea.trim().length < 3) {
      errors.nombreTarea = 'El nombre debe tener al menos 3 caracteres';
    }
    if (
      fechaFinEstimada &&
      tarea.fechaInicio &&
      fechaFinEstimada < tarea.fechaInicio.split('T')[0]
    ) {
      errors.fechaFinEstimada =
        'La fecha fin debe ser posterior a la fecha de inicio';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!isTutor || !onUpdate) return;
    if (!validate()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdate(tarea.idTarea, {
        nombreTarea: nombreTarea.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaFinEstimada: fechaFinEstimada || undefined,
      });
      onClose();
    } catch {
      setSaveError('Error al guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isTutor || !onDelete) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
    setIsDeleting(true);
    try {
      await onDelete(tarea.idTarea);
      onClose();
    } catch {
      setSaveError('Error al eliminar la tarea. Inténtalo de nuevo.');
      setIsDeleting(false);
    }
  };

  const isBusy = isSaving || isDeleting;

  return (
    <div className={styles.overlay} onClick={!isBusy ? onClose : undefined}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>
              {isTutor ? nombreTarea || tarea.nombreTarea : tarea.nombreTarea}
            </h2>
            <span
              className={styles.estadoBadge}
              style={{
                backgroundColor: ESTADO_COLORS[tarea.estado] + '20',
                color: ESTADO_COLORS[tarea.estado],
              }}
            >
              {ESTADO_LABELS[tarea.estado]}
            </span>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isBusy}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Información de la tarea</h3>

            {isTutor ? (
              <div className={styles.editGrid}>
                <div className={styles.editFieldFull}>
                  <label className={styles.editLabel}>
                    Nombre de la tarea{' '}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreTarea}
                    onChange={e => {
                      setNombreTarea(e.target.value);
                      if (fieldErrors.nombreTarea)
                        setFieldErrors(prev => ({ ...prev, nombreTarea: '' }));
                    }}
                    className={[
                      styles.editInput,
                      fieldErrors.nombreTarea ? styles.editInputError : '',
                    ].join(' ')}
                    disabled={isBusy}
                    maxLength={255}
                    placeholder="Nombre de la tarea"
                  />
                  {fieldErrors.nombreTarea && (
                    <span className={styles.fieldError}>
                      {fieldErrors.nombreTarea}
                    </span>
                  )}
                </div>

                <div className={styles.editFieldFull}>
                  <label className={styles.editLabel}>Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className={styles.editTextarea}
                    disabled={isBusy}
                    rows={3}
                    placeholder="Descripción de la tarea..."
                  />
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Fecha inicio</label>
                  <span className={styles.value}>
                    {formatDate(tarea.fechaInicio)}
                  </span>
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Fecha fin estimada</label>
                  <DatePickerInput
                    value={fechaFinEstimada}
                    onChange={value => {
                      setFechaFinEstimada(value);
                      if (fieldErrors.fechaFinEstimada)
                        setFieldErrors(prev => ({
                          ...prev,
                          fechaFinEstimada: '',
                        }));
                    }}
                    className={[
                      styles.editInput,
                      fieldErrors.fechaFinEstimada ? styles.editInputError : '',
                    ].join(' ')}
                    disabled={isBusy}
                    min={tarea.fechaInicio?.split('T')[0]}
                  />
                  {fieldErrors.fechaFinEstimada && (
                    <span className={styles.fieldError}>
                      {fieldErrors.fechaFinEstimada}
                    </span>
                  )}
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Asignado por</label>
                  <span className={styles.value}>
                    {tarea.tutorAsignador.nombre}{' '}
                    {tarea.tutorAsignador.apellidos}
                  </span>
                </div>

                {tarea.estado === 'Completada' && tarea.fechaCompletada && (
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Completada el</label>
                    <span className={styles.valueSuccess}>
                      {formatDate(tarea.fechaCompletada)}
                    </span>
                  </div>
                )}

                {saveError && (
                  <div className={styles.editFieldFull}>
                    <div className={styles.saveError} role="alert">
                      {saveError}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.grid}>
                {tarea.descripcion && (
                  <div className={styles.fieldFull}>
                    <span className={styles.label}>Descripción</span>
                    <p className={styles.value}>{tarea.descripcion}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <span className={styles.label}>Asignado por</span>
                  <span className={styles.value}>
                    {tarea.tutorAsignador.nombre}{' '}
                    {tarea.tutorAsignador.apellidos}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Fecha inicio</span>
                  <span className={styles.value}>
                    {formatDate(tarea.fechaInicio)}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Fecha fin estimada</span>
                  <span className={styles.value}>
                    {formatDate(tarea.fechaFinEstimada)}
                  </span>
                </div>
                {tarea.estado === 'Completada' && tarea.fechaCompletada && (
                  <div className={styles.field}>
                    <span className={styles.label}>Completada el</span>
                    <span className={styles.valueSuccess}>
                      {formatDate(tarea.fechaCompletada)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className={`${styles.section} ${isTutor ? styles.historySection : ''}`}>
            <h3 className={styles.sectionTitle}>Historial de cambios</h3>
            {loadingHistorial ? (
              <div className={styles.loadingText}>Cargando historial...</div>
            ) : historialError ? (
              <div className={styles.errorText} role="alert">
                {historialError}
              </div>
            ) : historial.length === 0 ? (
              <div className={styles.emptyText}>
                Sin cambios registrados todavía
              </div>
            ) : (
              <div className={styles.timeline}>
                {historial.map(entry => (
                  <div key={entry.idHistorial} className={styles.timelineEntry}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineUser}>
                          {entry.modificadoPor.nombre}{' '}
                          {entry.modificadoPor.apellidos}
                        </span>
                        <span className={styles.timelineDate}>
                          {formatDateTime(entry.fechaCambio)}
                        </span>
                      </div>
                      <div className={styles.timelineChange}>
                        {entry.estadoAnterior ? (
                          <>
                            <span
                              className={styles.miniEstadoBadge}
                              style={{
                                backgroundColor:
                                  ESTADO_COLORS[entry.estadoAnterior] + '20',
                                color: ESTADO_COLORS[entry.estadoAnterior],
                              }}
                            >
                              {ESTADO_LABELS[entry.estadoAnterior]}
                            </span>
                            <span className={styles.arrow}> → </span>
                          </>
                        ) : (
                          <span className={styles.createdLabel}>
                            Tarea creada →{' '}
                          </span>
                        )}
                        <span
                          className={styles.miniEstadoBadge}
                          style={{
                            backgroundColor:
                              ESTADO_COLORS[entry.estadoNuevo] + '20',
                            color: ESTADO_COLORS[entry.estadoNuevo],
                          }}
                        >
                          {ESTADO_LABELS[entry.estadoNuevo]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isTutor && (
            <div className={styles.tutorActions}>
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.deleteButton}
                  disabled={isBusy}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar tarea'}
                </button>
              )}
              <div className={styles.tutorActionsRight}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.cancelButton}
                  disabled={isBusy}
                >
                  Cancelar
                </button>
                {onUpdate && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className={styles.saveButton}
                    disabled={isBusy}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
