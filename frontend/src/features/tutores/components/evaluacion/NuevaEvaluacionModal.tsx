import { useState } from 'react';
import type { Evaluacion } from '../../../../types/evaluacion';
import { createEvaluacion } from '../../services/tutorService';
import { ScoreSelector } from './ScoreSelector';
import styles from './NuevaEvaluacionModal.module.css';

interface NuevaEvaluacionModalProps {
  idBecario: number;
  onClose: () => void;
  onSuccess: (evaluacion: Evaluacion) => void;
}

interface FormState {
  titulo: string;
  descripcion: string;
  puntuacionPuntualidad: number | null;
  puntuacionCalidad: number | null;
  puntuacionActitud: number | null;
  puntuacionAutonomia: number | null;
  puntuacionComunicacion: number | null;
}

interface FormErrors {
  titulo?: string;
  descripcion?: string;
  puntuacionPuntualidad?: string;
  puntuacionCalidad?: string;
  puntuacionActitud?: string;
  puntuacionAutonomia?: string;
  puntuacionComunicacion?: string;
}

const INITIAL_FORM: FormState = {
  titulo: '',
  descripcion: '',
  puntuacionPuntualidad: null,
  puntuacionCalidad: null,
  puntuacionActitud: null,
  puntuacionAutonomia: null,
  puntuacionComunicacion: null,
};

const calcularMedia = (form: FormState): string => {
  const puntuaciones = [
    form.puntuacionPuntualidad,
    form.puntuacionCalidad,
    form.puntuacionActitud,
    form.puntuacionAutonomia,
    form.puntuacionComunicacion,
  ];
  const rellenas = puntuaciones.filter((p): p is number => p !== null);
  if (rellenas.length === 0) return '—';
  const media = rellenas.reduce((sum, p) => sum + p, 0) / rellenas.length;
  return media.toFixed(2);
};

const validate = (form: FormState): FormErrors => {
  const errors: FormErrors = {};
  if (!form.titulo.trim()) errors.titulo = 'El título es obligatorio';
  if (!form.descripcion.trim())
    errors.descripcion = 'La descripción es obligatoria';
  if (form.puntuacionPuntualidad === null)
    errors.puntuacionPuntualidad = 'Selecciona una puntuación';
  if (form.puntuacionCalidad === null)
    errors.puntuacionCalidad = 'Selecciona una puntuación';
  if (form.puntuacionActitud === null)
    errors.puntuacionActitud = 'Selecciona una puntuación';
  if (form.puntuacionAutonomia === null)
    errors.puntuacionAutonomia = 'Selecciona una puntuación';
  if (form.puntuacionComunicacion === null)
    errors.puntuacionComunicacion = 'Selecciona una puntuación';
  return errors;
};

export const NuevaEvaluacionModal = ({
  idBecario,
  onClose,
  onSuccess,
}: NuevaEvaluacionModalProps) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleChange = (
    field: keyof FormState,
    value: string | number | null
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await createEvaluacion(idBecario, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        puntuacionPuntualidad: form.puntuacionPuntualidad!,
        puntuacionCalidad: form.puntuacionCalidad!,
        puntuacionActitud: form.puntuacionActitud!,
        puntuacionAutonomia: form.puntuacionAutonomia!,
        puntuacionComunicacion: form.puntuacionComunicacion!,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error al guardar la evaluación'
      );
      setLoading(false);
    }
  };

  const mediaDisplay = calcularMedia(form);

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Cabecera */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Nueva Evaluación</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            {/* Título */}
            <div className={styles.fieldGroup}>
              <label htmlFor="eval-titulo" className={styles.label}>
                Título <span className={styles.required}>*</span>
              </label>
              <input
                id="eval-titulo"
                type="text"
                className={`${styles.input}${errors.titulo ? ` ${styles.inputError}` : ''}`}
                value={form.titulo}
                onChange={e => handleChange('titulo', e.target.value)}
                placeholder="Ej: Evaluación mensual — Mayo 2026"
                disabled={loading}
              />
              {errors.titulo && (
                <p className={styles.errorText}>{errors.titulo}</p>
              )}
            </div>

            {/* Descripción */}
            <div className={styles.fieldGroup}>
              <label htmlFor="eval-descripcion" className={styles.label}>
                Descripción <span className={styles.required}>*</span>
              </label>
              <textarea
                id="eval-descripcion"
                className={`${styles.textarea}${errors.descripcion ? ` ${styles.inputError}` : ''}`}
                value={form.descripcion}
                onChange={e => handleChange('descripcion', e.target.value)}
                placeholder="Escribe aquí los comentarios y feedback del evaluado..."
                rows={3}
                disabled={loading}
              />
              {errors.descripcion && (
                <p className={styles.errorText}>{errors.descripcion}</p>
              )}
            </div>

            {/* Puntuaciones */}
            <div className={styles.section}>
              <p className={styles.sectionTitle}>Puntuaciones</p>
              <div className={styles.scoresGrid}>
                {/* Puntualidad */}
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    Puntualidad <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.scoreInputCol}>
                    <ScoreSelector
                      id="eval-puntualidad"
                      value={form.puntuacionPuntualidad}
                      onChange={val =>
                        handleChange('puntuacionPuntualidad', val)
                      }
                      disabled={loading}
                    />
                    {errors.puntuacionPuntualidad && (
                      <p className={styles.errorText}>
                        {errors.puntuacionPuntualidad}
                      </p>
                    )}
                  </div>
                </div>

                {/* Calidad */}
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    Calidad del Trabajo{' '}
                    <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.scoreInputCol}>
                    <ScoreSelector
                      id="eval-calidad"
                      value={form.puntuacionCalidad}
                      onChange={val => handleChange('puntuacionCalidad', val)}
                      disabled={loading}
                    />
                    {errors.puntuacionCalidad && (
                      <p className={styles.errorText}>
                        {errors.puntuacionCalidad}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actitud */}
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    Actitud <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.scoreInputCol}>
                    <ScoreSelector
                      id="eval-actitud"
                      value={form.puntuacionActitud}
                      onChange={val => handleChange('puntuacionActitud', val)}
                      disabled={loading}
                    />
                    {errors.puntuacionActitud && (
                      <p className={styles.errorText}>
                        {errors.puntuacionActitud}
                      </p>
                    )}
                  </div>
                </div>

                {/* Autonomía */}
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    Autonomía <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.scoreInputCol}>
                    <ScoreSelector
                      id="eval-autonomia"
                      value={form.puntuacionAutonomia}
                      onChange={val => handleChange('puntuacionAutonomia', val)}
                      disabled={loading}
                    />
                    {errors.puntuacionAutonomia && (
                      <p className={styles.errorText}>
                        {errors.puntuacionAutonomia}
                      </p>
                    )}
                  </div>
                </div>

                {/* Comunicación */}
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    Comunicación <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.scoreInputCol}>
                    <ScoreSelector
                      id="eval-comunicacion"
                      value={form.puntuacionComunicacion}
                      onChange={val =>
                        handleChange('puntuacionComunicacion', val)
                      }
                      disabled={loading}
                    />
                    {errors.puntuacionComunicacion && (
                      <p className={styles.errorText}>
                        {errors.puntuacionComunicacion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Puntuación media */}
            <div className={styles.mediaSection}>
              <span className={styles.mediaLabel}>Puntuación Media</span>
              <span className={styles.mediaValue}>{mediaDisplay}</span>
            </div>

            {/* Error de envío */}
            {submitError && (
              <div className={styles.submitError} role="alert">
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall} />
                  Guardando...
                </>
              ) : (
                'Guardar evaluación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
