import { TIPO_FORMACION } from '../../../../shared/constants/domain.constants';
import { DatePickerInput } from '../../../../shared/components/ui/DatePickerInput';
import type { DatosBecario } from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface DatosBecarioFormProps {
  datosBecario: DatosBecario;
  errors: Partial<Record<keyof DatosBecario, string>>;
  section?: 'all' | 'intern' | 'academic' | 'personal';
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function DatosBecarioForm({
  datosBecario,
  errors,
  section = 'all',
  onChange,
  onBlur,
}: DatosBecarioFormProps) {
  const inputClass = (field: keyof DatosBecario) =>
    `${styles.input}${errors[field] ? ` ${styles.inputError}` : ''}`;

  const selectClass = (field: keyof DatosBecario) =>
    `${styles.select}${errors[field] ? ` ${styles.inputError}` : ''}`;

  const handleDateChange = (name: keyof DatosBecario, value: string) => {
    onChange({
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const renderInternFields = () => (
    <>
      <div className={styles.formField}>
        <label htmlFor="horasContrato" className={styles.label}>
          Horas de contrato <span className={styles.required}>*</span>
        </label>
        <input
          id="horasContrato"
          name="horasContrato"
          type="number"
          min={1}
          step={1}
          className={inputClass('horasContrato')}
          value={datosBecario.horasContrato}
          onChange={onChange}
          onBlur={onBlur}
          required
          aria-invalid={!!errors.horasContrato}
          aria-describedby={
            errors.horasContrato ? 'horasContrato-error' : undefined
          }
        />
        {errors.horasContrato && (
          <p id="horasContrato-error" className={styles.errorMessage} role="alert">
            {errors.horasContrato}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="ayudaEconomica" className={styles.label}>
          Ayuda economica
        </label>
        <input
          id="ayudaEconomica"
          name="ayudaEconomica"
          type="number"
          min={0}
          step={1}
          className={inputClass('ayudaEconomica')}
          value={datosBecario.ayudaEconomica}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!errors.ayudaEconomica}
          aria-describedby={
            errors.ayudaEconomica ? 'ayudaEconomica-error' : undefined
          }
        />
        {errors.ayudaEconomica && (
          <p id="ayudaEconomica-error" className={styles.errorMessage} role="alert">
            {errors.ayudaEconomica}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="equipoEnUso" className={styles.label}>
          Equipo en uso
        </label>
        <input
          id="equipoEnUso"
          name="equipoEnUso"
          type="text"
          className={styles.input}
          value={datosBecario.equipoEnUso}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>

      <div className={styles.formField}>
        <label htmlFor="fechaInicioPracticas" className={styles.label}>
          Inicio prácticas <span className={styles.required}>*</span>
        </label>
        <DatePickerInput
          id="fechaInicioPracticas"
          name="fechaInicioPracticas"
          className={inputClass('fechaInicioPracticas')}
          value={datosBecario.fechaInicioPracticas}
          onChange={value => handleDateChange('fechaInicioPracticas', value)}
          onBlur={onBlur}
          required
          ariaInvalid={!!errors.fechaInicioPracticas}
          ariaDescribedBy={
            errors.fechaInicioPracticas ? 'fechaInicio-error' : undefined
          }
        />
        {errors.fechaInicioPracticas && (
          <p id="fechaInicio-error" className={styles.errorMessage} role="alert">
            {errors.fechaInicioPracticas}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="fechaFinPracticas" className={styles.label}>
          Fin prácticas <span className={styles.required}>*</span>
        </label>
        <DatePickerInput
          id="fechaFinPracticas"
          name="fechaFinPracticas"
          className={inputClass('fechaFinPracticas')}
          value={datosBecario.fechaFinPracticas}
          onChange={value => handleDateChange('fechaFinPracticas', value)}
          onBlur={onBlur}
          required
          ariaInvalid={!!errors.fechaFinPracticas}
          ariaDescribedBy={
            errors.fechaFinPracticas ? 'fechaFin-error' : undefined
          }
        />
        {errors.fechaFinPracticas && (
          <p id="fechaFin-error" className={styles.errorMessage} role="alert">
            {errors.fechaFinPracticas}
          </p>
        )}
      </div>
    </>
  );

  const renderAcademicFields = () => (
    <>
      <div className={`${styles.formField} ${styles.formFieldFull}`}>
        <label htmlFor="tipoFormacion" className={styles.label}>
          Tipo de formación <span className={styles.required}>*</span>
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="tipoFormacion"
            name="tipoFormacion"
            className={selectClass('tipoFormacion')}
            value={datosBecario.tipoFormacion}
            onChange={onChange}
            onBlur={onBlur}
            required
            aria-invalid={!!errors.tipoFormacion}
            aria-describedby={
              errors.tipoFormacion ? 'tipoFormacion-error' : undefined
            }
          >
            <option value="" disabled>
              Selecciona tipo
            </option>
            <option value={TIPO_FORMACION.UNIVERSITARIA}>
              Grado universitario
            </option>
            <option value={TIPO_FORMACION.FORMACION_PROFESIONAL}>
              Formación Profesional (FP)
            </option>
          </select>
        </div>
        {errors.tipoFormacion && (
          <p id="tipoFormacion-error" className={styles.errorMessage} role="alert">
            {errors.tipoFormacion}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="nombreFormacion" className={styles.label}>
          {datosBecario.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA
            ? 'Nombre del Grado'
            : 'Nombre de la formación'}{' '}
          <span className={styles.required}>*</span>
        </label>
        <input
          id="nombreFormacion"
          name="nombreFormacion"
          type="text"
          className={inputClass('nombreFormacion')}
          value={datosBecario.nombreFormacion}
          onChange={onChange}
          onBlur={onBlur}
          required
          aria-invalid={!!errors.nombreFormacion}
          aria-describedby={
            errors.nombreFormacion ? 'nombreFormacion-error' : undefined
          }
        />
        {errors.nombreFormacion && (
          <p id="nombreFormacion-error" className={styles.errorMessage} role="alert">
            {errors.nombreFormacion}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="centroEstudios" className={styles.label}>
          Centro de estudios <span className={styles.required}>*</span>
        </label>
        <input
          id="centroEstudios"
          name="centroEstudios"
          type="text"
          className={inputClass('centroEstudios')}
          value={datosBecario.centroEstudios}
          onChange={onChange}
          onBlur={onBlur}
          required
          aria-invalid={!!errors.centroEstudios}
          aria-describedby={
            errors.centroEstudios ? 'centroEstudios-error' : undefined
          }
        />
        {errors.centroEstudios && (
          <p id="centroEstudios-error" className={styles.errorMessage} role="alert">
            {errors.centroEstudios}
          </p>
        )}
      </div>
    </>
  );

  const renderPersonalFields = () => (
    <>
      <div className={styles.formField}>
        <label htmlFor="telefonoPersonal" className={styles.label}>
          Teléfono personal
        </label>
        <input
          id="telefonoPersonal"
          name="telefonoPersonal"
          type="text"
          className={styles.input}
          value={datosBecario.telefonoPersonal}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>

      <div className={styles.formField}>
        <label htmlFor="emailPersonalBecario" className={styles.label}>
          Email personal
        </label>
        <input
          id="emailPersonalBecario"
          name="emailPersonal"
          type="email"
          className={inputClass('emailPersonal')}
          value={datosBecario.emailPersonal}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!errors.emailPersonal}
          aria-describedby={errors.emailPersonal ? 'emailPersonal-error' : undefined}
        />
        {errors.emailPersonal && (
          <p id="emailPersonal-error" className={styles.errorMessage} role="alert">
            {errors.emailPersonal}
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label htmlFor="linkedin" className={styles.label}>
          LinkedIn
        </label>
        <input
          id="linkedin"
          name="linkedin"
          type="text"
          className={styles.input}
          value={datosBecario.linkedin}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
    </>
  );

  const renderHeaderIcon = () => {
    if (section === 'academic') {
      return <UsuarioEditIcon name="school" className={styles.cardHeaderIcon} />;
    }
    if (section === 'personal') {
      return <UsuarioEditIcon name="contact" className={styles.cardHeaderIcon} />;
    }
    return <UsuarioEditIcon name="badge" className={styles.cardHeaderIcon} />;
  };

  if (section !== 'all') {
    const titles = {
      intern: 'Datos del Becario',
      academic: 'Formación Académica',
      personal: 'Información Personal',
    };

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardHeaderTitle}>
            {renderHeaderIcon()}
            {titles[section]}
          </h2>
        </div>
        <div className={styles.cardBody}>
          <div
            className={
              section === 'academic' ? styles.formGrid : styles.formStack
            }
          >
            {section === 'intern' && renderInternFields()}
            {section === 'academic' && renderAcademicFields()}
            {section === 'personal' && renderPersonalFields()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardHeaderTitle}>
          <UsuarioEditIcon name="badge" className={styles.cardHeaderIcon} />
          Datos del Becario
        </h2>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.sectionTitle}>Información Corporativa</h3>
        <div className={styles.formGrid}>{renderInternFields()}</div>

        <h3 className={styles.sectionTitle}>Formación Académica</h3>
        <div className={styles.formGrid}>{renderAcademicFields()}</div>

        <h3 className={styles.sectionTitle}>Información Personal</h3>
        <p className={styles.sectionHint}>
          Estos campos son opcionales. Podrán completarse más adelante desde el
          perfil del becario.
        </p>
        <div className={styles.formGrid}>{renderPersonalFields()}</div>
      </div>
    </div>
  );
}
