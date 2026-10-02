import { useState, useEffect } from 'react';
import type { BecarioSummary, UpdateBecarioData } from '../../../../types/becario';
import {
  TIPO_FORMACION,
  normalizeTipoFormacion,
} from '../../../../shared/constants/domain.constants';
import { DatePickerInput } from '../../../../shared/components/ui/DatePickerInput';
import type { TipoFormacion } from '../../../../shared/constants/domain.constants';
import styles from './BecarioEditModal.module.css';

interface BecarioEditModalProps {
  becario: BecarioSummary;
  onSave: (data: UpdateBecarioData) => Promise<void>;
  onCancel: () => void;
}

type BecarioEditFormData = Omit<UpdateBecarioData, 'tipoFormacion'> & {
  tipoFormacion?: TipoFormacion | '';
};

export const BecarioEditModal = ({
  becario,
  onSave,
  onCancel,
}: BecarioEditModalProps) => {
  const [formData, setFormData] = useState<BecarioEditFormData>({
    practica: becario.practica || '',
    cliente: becario.cliente || '',
    horasContrato: becario.horasContrato,
    ayudaEconomica: becario.ayudaEconomica ?? null,
    equipoEnUso: becario.equipoEnUso || '',
    fechaInicioPracticas: becario.fechaInicioPracticas
      ? new Date(becario.fechaInicioPracticas).toISOString().split('T')[0]
      : '',
    fechaFinPracticas: becario.fechaFinPracticas
      ? new Date(becario.fechaFinPracticas).toISOString().split('T')[0]
      : '',
    tipoFormacion: normalizeTipoFormacion(becario.tipoFormacion) || '',
    nombreGradoUniversitario: becario.nombreGradoUniversitario || '',
    nombreFormacionProfesional: becario.nombreFormacionProfesional || '',
    centroEstudios: becario.centroEstudios || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    name: 'fechaInicioPracticas' | 'fechaFinPracticas',
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const dataToSend: UpdateBecarioData = {};

      if (formData.practica && formData.practica !== becario.practica)
        dataToSend.practica = formData.practica;
      if (formData.cliente && formData.cliente !== becario.cliente)
        dataToSend.cliente = formData.cliente;
      if (
        formData.horasContrato &&
        formData.horasContrato !== becario.horasContrato
      )
        dataToSend.horasContrato = Number(formData.horasContrato);
      if (formData.ayudaEconomica !== becario.ayudaEconomica)
        dataToSend.ayudaEconomica =
          formData.ayudaEconomica !== null &&
          formData.ayudaEconomica !== undefined &&
          String(formData.ayudaEconomica) !== ''
            ? Number(formData.ayudaEconomica)
            : null;
      if (formData.equipoEnUso !== becario.equipoEnUso)
        dataToSend.equipoEnUso = formData.equipoEnUso?.trim() || null;
      if (
        formData.fechaInicioPracticas &&
        formData.fechaInicioPracticas !==
          new Date(becario.fechaInicioPracticas).toISOString().split('T')[0]
      )
        dataToSend.fechaInicioPracticas = formData.fechaInicioPracticas;

      if (formData.fechaFinPracticas !== undefined) {
        const becarioFechaFin = becario.fechaFinPracticas
          ? new Date(becario.fechaFinPracticas).toISOString().split('T')[0]
          : null;
        if (formData.fechaFinPracticas !== becarioFechaFin)
          dataToSend.fechaFinPracticas = formData.fechaFinPracticas || null;
      }

      if (
        formData.tipoFormacion !== undefined &&
        formData.tipoFormacion !== becario.tipoFormacion
      )
        dataToSend.tipoFormacion =
          formData.tipoFormacion === '' ? null : formData.tipoFormacion;
      if (
        formData.nombreGradoUniversitario !== undefined &&
        formData.nombreGradoUniversitario !== becario.nombreGradoUniversitario
      )
        dataToSend.nombreGradoUniversitario =
          formData.nombreGradoUniversitario || null;
      if (
        formData.nombreFormacionProfesional !== undefined &&
        formData.nombreFormacionProfesional !==
          becario.nombreFormacionProfesional
      )
        dataToSend.nombreFormacionProfesional =
          formData.nombreFormacionProfesional || null;
      if (
        formData.centroEstudios !== undefined &&
        formData.centroEstudios !== becario.centroEstudios
      )
        dataToSend.centroEstudios = formData.centroEstudios || null;

      if (Object.keys(dataToSend).length === 0) {
        setError('No se detectaron cambios para guardar');
        setLoading(false);
        return;
      }

      await onSave(dataToSend);
    } catch (err) {
      console.error('Error al actualizar becario:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar la información del becario'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Información del Becario</h2>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* Información Corporativa */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información Corporativa</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="practica" className={styles.label}>
                  Práctica
                </label>
                <input
                  type="text"
                  id="practica"
                  name="practica"
                  value={formData.practica || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ej: Development"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cliente" className={styles.label}>
                  Cliente
                </label>
                <input
                  type="text"
                  id="cliente"
                  name="cliente"
                  value={formData.cliente || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ej: Cliente XYZ"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="horasContrato" className={styles.label}>
                  Horas Contrato *
                </label>
                <input
                  type="number"
                  id="horasContrato"
                  name="horasContrato"
                  value={formData.horasContrato || ''}
                  onChange={handleChange}
                  className={styles.input}
                  min="1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="ayudaEconomica" className={styles.label}>
                  Ayuda economica
                </label>
                <input
                  type="number"
                  id="ayudaEconomica"
                  name="ayudaEconomica"
                  value={formData.ayudaEconomica ?? ''}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="equipoEnUso" className={styles.label}>
                  Equipo en uso
                </label>
                <input
                  type="text"
                  id="equipoEnUso"
                  name="equipoEnUso"
                  value={formData.equipoEnUso || ''}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="fechaInicioPracticas" className={styles.label}>
                  Fecha Inicio *
                </label>
                <DatePickerInput
                  id="fechaInicioPracticas"
                  name="fechaInicioPracticas"
                  value={formData.fechaInicioPracticas || ''}
                  onChange={value =>
                    handleDateChange('fechaInicioPracticas', value)
                  }
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="fechaFinPracticas" className={styles.label}>
                  Fecha Fin
                </label>
                <DatePickerInput
                  id="fechaFinPracticas"
                  name="fechaFinPracticas"
                  value={formData.fechaFinPracticas || ''}
                  onChange={value =>
                    handleDateChange('fechaFinPracticas', value)
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Formación Académica */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Formación Académica</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="tipoFormacion" className={styles.label}>
                  Tipo de Formación
                </label>
                <select
                  id="tipoFormacion"
                  name="tipoFormacion"
                  value={formData.tipoFormacion || ''}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Seleccionar...</option>
                  <option value={TIPO_FORMACION.UNIVERSITARIA}>
                    Grado Universitario
                  </option>
                  <option value={TIPO_FORMACION.FORMACION_PROFESIONAL}>
                    Formación Profesional
                  </option>
                </select>
              </div>
            </div>

            {formData.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="nombreGradoUniversitario"
                    className={styles.label}
                  >
                    Nombre del Grado
                  </label>
                  <input
                    type="text"
                    id="nombreGradoUniversitario"
                    name="nombreGradoUniversitario"
                    value={formData.nombreGradoUniversitario || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Ej: Ingeniería Informática"
                  />
                </div>
              </div>
            )}

            {formData.tipoFormacion === TIPO_FORMACION.FORMACION_PROFESIONAL && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="nombreFormacionProfesional"
                    className={styles.label}
                  >
                    Nombre de la FP
                  </label>
                  <input
                    type="text"
                    id="nombreFormacionProfesional"
                    name="nombreFormacionProfesional"
                    value={formData.nombreFormacionProfesional || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Ej: Desarrollo de Aplicaciones Web"
                  />
                </div>
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="centroEstudios" className={styles.label}>
                  Centro de Estudios
                </label>
                <input
                  type="text"
                  id="centroEstudios"
                  name="centroEstudios"
                  value={formData.centroEstudios || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ej: Universidad Complutense de Madrid"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
