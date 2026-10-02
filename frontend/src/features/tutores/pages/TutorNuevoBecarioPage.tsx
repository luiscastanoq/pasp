import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import {
  ROLES,
  TIPO_TUTORIA,
} from '../../../shared/constants/domain.constants';
import { ApiError } from '../../../shared/api/api';
import { SeleccionarTutoresModal } from '../../admin/components/SeleccionarTutoresModal';
import type { TutorDisponible } from '../../admin/components/SeleccionarTutoresModal';
import { DatosBasicosUsuarioForm } from '../../admin/components/usuario-form/DatosBasicosUsuarioForm';
import { DatosBecarioForm } from '../../admin/components/usuario-form/DatosBecarioForm';
import { FeedbackMessages } from '../../admin/components/usuario-form/FeedbackMessages';
import { TutoresAsignadosTable } from '../../admin/components/usuario-form/TutoresAsignadosTable';
import type {
  DatosBecario,
  FeedbackState,
  FormErrors,
  NuevoUsuarioFormData,
  TipoTutoriaBecario,
  ValidableField,
} from '../../admin/components/usuario-form/types';
import {
  DATOS_BECARIO_EMPTY,
  TIPO_TUTORIA_LABELS,
  type TutorAsignadoBecario,
} from '../../admin/components/usuario-form/types';
import {
  generarContrasenaTemp,
  validateDatosBecarioFieldOnBlur,
  validateDatosBecarioSubmit,
  validateFieldOnBlur,
  validateUsuarioForm,
} from '../../admin/validation/usuario.validation';
import { mapNuevoBecarioPayload } from '../../admin/mappers/usuario.mapper';
import {
  createBecarioAsignado,
  getTutoresDisponibles,
} from '../services/tutorService';
import styles from './TutorNuevoBecarioPage.module.css';

export const TutorNuevoBecarioPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NuevoUsuarioFormData>(() => ({
    nombre: '',
    apellidos: '',
    emailInterno: '',
    contrasena: generarContrasenaTemp(),
    practica: '',
    cliente: '',
  }));
  const [datosBecario, setDatosBecario] =
    useState<DatosBecario>(DATOS_BECARIO_EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [datosBecarioErrors, setDatosBecarioErrors] = useState<
    Partial<Record<keyof DatosBecario, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<ValidableField, boolean>>
  >({});
  const [datosBecarioTouched, setDatosBecarioTouched] = useState<
    Partial<Record<keyof DatosBecario, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [tutoresAsignados, setTutoresAsignados] = useState<
    TutorAsignadoBecario[]
  >([]);
  const [tutoresDuplicadosError, setTutoresDuplicadosError] = useState<
    string | null
  >(null);
  const [showTutoresModal, setShowTutoresModal] = useState(false);
  const [tipoTutoriaTutorActual, setTipoTutoriaTutorActual] =
    useState<TipoTutoriaBecario>(TIPO_TUTORIA.EMPRESA_PRINCIPAL);

  const tutorActualAsignado: TutorAsignadoBecario | null = user
    ? {
        id: String(user.idUsuario),
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: ROLES.TUTOR_EMPRESA,
        tipoTutoria: tipoTutoriaTutorActual,
      }
    : null;
  const lockedTutorIds = tutorActualAsignado ? [tutorActualAsignado.id] : [];
  const tutoresParaTabla =
    tutorActualAsignado &&
    !tutoresAsignados.some(tutor => tutor.id === tutorActualAsignado.id)
      ? [tutorActualAsignado, ...tutoresAsignados]
      : tutoresAsignados;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateFieldOnBlur(field, value, ROLES.BECARIO),
      }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateFieldOnBlur(field, value, ROLES.BECARIO),
    }));
  };

  const handleDatosBecarioChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as keyof DatosBecario;
    setDatosBecario(prev => ({ ...prev, [field]: value }));

    if (datosBecarioTouched[field]) {
      setDatosBecarioErrors(prev => ({
        ...prev,
        [field]: validateDatosBecarioFieldOnBlur(field, value),
      }));
    }
  };

  const handleDatosBecarioBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as keyof DatosBecario;
    setDatosBecarioTouched(prev => ({ ...prev, [field]: true }));
    setDatosBecarioErrors(prev => ({
      ...prev,
      [field]: validateDatosBecarioFieldOnBlur(field, value),
    }));
  };

  const validateTutoresAsignados = (): boolean => {
    const tutoresSinTipo = tutoresParaTabla.filter(tutor => !tutor.tipoTutoria);
    if (tutoresSinTipo.length > 0) {
      setFeedback({
        type: 'error',
        message: `Todos los tutores deben tener un tipo de tutoría seleccionado. Faltan: ${tutoresSinTipo.map(t => `${t.nombre} ${t.apellidos}`).join(', ')}.`,
      });
      return false;
    }

    const tiposUsados = tutoresParaTabla
      .filter(tutor => tutor.tipoTutoria !== '')
      .map(tutor => tutor.tipoTutoria);
    const tiposUnicos = new Set(tiposUsados);
    if (tiposUsados.length !== tiposUnicos.size) {
      const duplicados = Array.from(tiposUnicos).filter(
        tipo => tiposUsados.filter(t => t === tipo).length > 1
      );
      const duplicadosLabel = duplicados
        .map(tipo => TIPO_TUTORIA_LABELS[tipo] ?? tipo)
        .join(', ');

      setTutoresDuplicadosError(
        `Hay tipos de tutoría duplicados: ${duplicadosLabel}. Cada tipo solo puede asignarse a un tutor.`
      );
      setFeedback({
        type: 'error',
        message:
          'Existen tipos de tutoría duplicados en la lista de tutores. Revisa la tabla de tutores asignados.',
      });
      return false;
    }

    setTutoresDuplicadosError(null);
    return true;
  };

  const handleSubmit = async () => {
    setFeedback(null);

    const userValidation = validateUsuarioForm(formData, ROLES.BECARIO);
    setTouched(userValidation.touched);
    setErrors(userValidation.errors);

    const becarioValidation = validateDatosBecarioSubmit(datosBecario);
    setDatosBecarioTouched(prev => ({
      ...prev,
      ...becarioValidation.touched,
    }));
    setDatosBecarioErrors(becarioValidation.errors);

    if (!userValidation.isValid || !becarioValidation.isValid) {
      setFeedback({
        type: 'error',
        message:
          'Revisa los campos marcados en rojo antes de crear el becario.',
      });
      return;
    }

    if (!validateTutoresAsignados()) {
      return;
    }

    setSubmitting(true);
    try {
      await createBecarioAsignado(
        mapNuevoBecarioPayload(formData, datosBecario, tutoresParaTabla)
      );
      setFeedback({
        type: 'success',
        message: 'Becario creado y asociado correctamente.',
      });
      navigate('/tutor');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        setFeedback({
          type: 'error',
          message: 'El email introducido ya existe en el sistema.',
        });
      } else {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'No se pudo crear el becario. Inténtalo de nuevo.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmarTutores = (tutoresSeleccionados: TutorDisponible[]) => {
    setTutoresAsignados(prev => {
      const prevMap = new Map(prev.map(tutor => [tutor.id, tutor]));
      return tutoresSeleccionados
        .filter(tutor => tutor.id !== tutorActualAsignado?.id)
        .map(tutor => {
          const existing = prevMap.get(tutor.id);
          return {
            id: tutor.id,
            nombre: tutor.nombre,
            apellidos: tutor.apellidos,
            email: tutor.email,
            rol: tutor.rol,
            tipoTutoria:
              existing?.tipoTutoria !== undefined
                ? existing.tipoTutoria
                : tutor.rol === ROLES.TUTOR_ACADEMICO
                  ? TIPO_TUTORIA.ACADEMICO
                  : ('' as TipoTutoriaBecario),
          };
        });
    });
    setTutoresDuplicadosError(null);
    setShowTutoresModal(false);
  };

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Tutor de empresa"
        onLogout={logout}
      />

      <main className={styles.main}>
        <section className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>Añadir Becario</h1>
          <p className={styles.sectionSubtitle}>
            Completa los datos del nuevo becario. Al crearlo quedará asociado a
            tu tutoría.
          </p>
        </section>

        <FeedbackMessages
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />

        <div className={styles.createGrid}>
          <div className={styles.createMainColumn}>
            <DatosBasicosUsuarioForm
              formData={formData}
              errors={errors}
              isDisabled={false}
              isPracticaClienteDisabled={false}
              showPracticaCliente
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSubmit}
            />
            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={datosBecarioErrors}
              section="academic"
              onChange={handleDatosBecarioChange}
              onBlur={handleDatosBecarioBlur}
            />
            <TutoresAsignadosTable
              tutores={tutoresParaTabla}
              duplicadosError={tutoresDuplicadosError}
              nonRemovableTutorIds={lockedTutorIds}
              onAgregar={() => setShowTutoresModal(true)}
              onTipoTutoriaChange={(tutorId, tipo) => {
                if (lockedTutorIds.includes(tutorId)) {
                  setTipoTutoriaTutorActual(tipo);
                  return;
                }
                setTutoresAsignados(prev =>
                  prev.map(tutor =>
                    tutor.id === tutorId
                      ? { ...tutor, tipoTutoria: tipo }
                      : tutor
                  )
                );
              }}
              onRemove={tutorId => {
                if (lockedTutorIds.includes(tutorId)) return;
                setTutoresAsignados(prev =>
                  prev.filter(tutor => tutor.id !== tutorId)
                );
              }}
            />
          </div>

          <aside className={styles.createSideColumn}>
            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={datosBecarioErrors}
              section="intern"
              onChange={handleDatosBecarioChange}
              onBlur={handleDatosBecarioBlur}
            />
            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={datosBecarioErrors}
              section="personal"
              onChange={handleDatosBecarioChange}
              onBlur={handleDatosBecarioBlur}
            />
          </aside>
        </div>

        <div className={styles.cardFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate('/tutor')}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="nuevo-usuario-form"
            className={styles.saveButton}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinnerSmall} />
                Guardando...
              </>
            ) : (
              'Crear becario'
            )}
          </button>
        </div>
      </main>

      <SeleccionarTutoresModal
        isOpen={showTutoresModal}
        tutoresYaAsignados={tutoresParaTabla}
        loadTutores={getTutoresDisponibles}
        lockedTutorIds={lockedTutorIds}
        onConfirmar={handleConfirmarTutores}
        onCancelar={() => setShowTutoresModal(false)}
        onClose={() => setShowTutoresModal(false)}
      />
    </div>
  );
};
