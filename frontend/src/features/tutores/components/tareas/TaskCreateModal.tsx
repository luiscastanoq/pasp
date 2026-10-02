import { useState } from 'react';
import type { CreateTareaData } from '../../../../types/tarea';
import { DatePickerInput } from '../../../../shared/components/ui/DatePickerInput';
import styles from './TaskCreateModal.module.css';

interface TaskCreateModalProps {
  onSubmit: (data: CreateTareaData) => Promise<void>;
  onCancel: () => void;
}

export const TaskCreateModal = ({
  onSubmit,
  onCancel,
}: TaskCreateModalProps) => {
  const [nombreTarea, setNombreTarea] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [fechaFinEstimada, setFechaFinEstimada] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nombreTarea.trim()) {
      newErrors.nombreTarea = 'El nombre de la tarea es obligatorio';
    } else if (nombreTarea.trim().length < 3) {
      newErrors.nombreTarea = 'El nombre debe tener al menos 3 caracteres';
    }
    if (!fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }
    if (fechaFinEstimada && fechaInicio && fechaFinEstimada < fechaInicio) {
      newErrors.fechaFinEstimada =
        'La fecha fin debe ser posterior a la fecha de inicio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        nombreTarea: nombreTarea.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaInicio,
        fechaFinEstimada: fechaFinEstimada || undefined,
      });
    } catch (error) {
      // Conservamos el motivo del backend para que el usuario sepa qué corregir.
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Error al crear la tarea. Inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={!isSubmitting ? onCancel : undefined}
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crear Nueva Tarea</h2>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Nombre de la tarea <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={nombreTarea}
              onChange={e => {
                setNombreTarea(e.target.value);
                if (errors.nombreTarea)
                  setErrors(prev => ({ ...prev, nombreTarea: '' }));
              }}
              className={[
                styles.input,
                errors.nombreTarea ? styles.inputError : '',
              ].join(' ')}
              placeholder="Ej: Implementar módulo de autenticación"
              disabled={isSubmitting}
              maxLength={255}
            />
            {errors.nombreTarea && (
              <span className={styles.fieldError}>{errors.nombreTarea}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className={styles.textarea}
              placeholder="Descripción detallada de la tarea..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>
                Fecha de inicio <span className={styles.required}>*</span>
              </label>
              <DatePickerInput
                value={fechaInicio}
                onChange={value => {
                  setFechaInicio(value);
                  if (errors.fechaInicio)
                    setErrors(prev => ({ ...prev, fechaInicio: '' }));
                }}
                className={[
                  styles.input,
                  errors.fechaInicio ? styles.inputError : '',
                ].join(' ')}
                disabled={isSubmitting}
              />
              {errors.fechaInicio && (
                <span className={styles.fieldError}>{errors.fechaInicio}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fecha fin estimada</label>
              <DatePickerInput
                value={fechaFinEstimada}
                onChange={value => {
                  setFechaFinEstimada(value);
                  if (errors.fechaFinEstimada)
                    setErrors(prev => ({ ...prev, fechaFinEstimada: '' }));
                }}
                className={[
                  styles.input,
                  errors.fechaFinEstimada ? styles.inputError : '',
                ].join(' ')}
                disabled={isSubmitting}
                min={fechaInicio}
              />
              {errors.fechaFinEstimada && (
                <span className={styles.fieldError}>
                  {errors.fechaFinEstimada}
                </span>
              )}
            </div>
          </div>

          {submitError && (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
