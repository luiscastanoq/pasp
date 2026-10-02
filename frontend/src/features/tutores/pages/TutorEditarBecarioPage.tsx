import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../../shared/components/Header';
import { ApiError } from '../../../shared/api/api';
import {
  ROLES,
  TIPO_FORMACION,
  TIPO_TUTORIA,
  normalizeTipoFormacion,
} from '../../../shared/constants/domain.constants';
import type {
  TipoFormacion,
  TipoTutoriaBecario as DomainTipoTutoriaBecario,
} from '../../../shared/constants/domain.constants';
import type {
  TutorAsignadoBecarioEdicion,
  UpdateUsuarioData,
  UsuarioDetalle,
} from '../../../types/usuario.types';
import { useAuth } from '../../auth/context/useAuth';
import { SeleccionarTutoresModal } from '../../admin/components/SeleccionarTutoresModal';
import type { TutorDisponible } from '../../admin/components/SeleccionarTutoresModal';
import { DatosBecarioForm } from '../../admin/components/usuario-form/DatosBecarioForm';
import { FeedbackMessages } from '../../admin/components/usuario-form/FeedbackMessages';
import { TutoresAsignadosTable } from '../../admin/components/usuario-form/TutoresAsignadosTable';
import type {
  DatosBecario,
  TipoTutoriaBecario,
  TutorAsignadoBecario,
} from '../../admin/components/usuario-form/types';
import { UsuarioBaseForm } from '../../admin/components/usuario-edit/UsuarioBaseForm';
import { UsuarioEditActions } from '../../admin/components/usuario-edit/UsuarioEditActions';
import {
  EliminarUsuarioModal,
  ToggleEstadoUsuarioModal,
} from '../../admin/components/usuario-edit/UsuarioConfirmModal';
import { UsuarioEditHeader } from '../../admin/components/usuario-edit/UsuarioEditHeader';
import { UsuarioInactiveBanner } from '../../admin/components/usuario-edit/UsuarioInactiveBanner';
import type { FeedbackState } from '../../admin/components/usuario-edit/types';
import { generarContrasenaTemp } from '../../admin/validation/usuario-edit.validation';
import {
  getBecarioEditable,
  getTutoresDelBecario,
  getTutoresDisponibles,
  deleteBecario,
  toggleEstadoBecario,
  updateBecario,
  updateBecarioUsuario,
  updateTutoresDelBecario,
} from '../services/tutorService';
import styles from '../../admin/styles/adminPage.module.css';

interface FormData extends DatosBecario {
  nombre: string;
  apellidos: string;
  emailInterno: string;
  contrasena: string;
  practica: string;
  cliente: string;
}

type ValidableField =
  | 'nombre'
  | 'apellidos'
  | 'emailInterno'
  | 'practica'
  | 'cliente'
  | keyof DatosBecario;

type FormErrors = Partial<Record<ValidableField, string>>;

const REQUIRED_FIELDS: ValidableField[] = [
  'nombre',
  'apellidos',
  'emailInterno',
  'practica',
  'cliente',
  'horasContrato',
  'fechaInicioPracticas',
  'fechaFinPracticas',
  'tipoFormacion',
  'nombreFormacion',
  'centroEstudios',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(
  field: ValidableField,
  value: string
): string | undefined {
  switch (field) {
    case 'nombre':
    case 'apellidos':
    case 'practica':
    case 'cliente':
    case 'centroEstudios':
    case 'nombreFormacion':
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    case 'emailInterno':
      if (value.trim() === '') return 'Este campo es obligatorio.';
      return EMAIL_RE.test(value.trim())
        ? undefined
        : 'Introduce un email valido (ej. usuario@empresa.com).';
    case 'emailPersonal':
      if (value.trim() === '') return undefined;
      return EMAIL_RE.test(value.trim())
        ? undefined
        : 'Introduce un email valido.';
    case 'horasContrato': {
      if (value.trim() === '') return 'Este campo es obligatorio.';
      const num = Number(value);
      return Number.isNaN(num) || num <= 0
        ? 'Introduce un numero de horas valido (mayor a 0).'
        : undefined;
    }
    case 'ayudaEconomica': {
      if (value.trim() === '') return undefined;
      const num = Number(value);
      return !Number.isInteger(num) || num < 0
        ? 'Introduce un numero entero no negativo.'
        : undefined;
    }
    case 'fechaInicioPracticas':
    case 'fechaFinPracticas':
      return value.trim() === '' ? 'Este campo es obligatorio.' : undefined;
    case 'tipoFormacion':
      return value === ''
        ? 'Debes seleccionar un tipo de formacion.'
        : undefined;
    default:
      return undefined;
  }
}

function validateFieldOnBlur(
  field: ValidableField,
  value: string
): string | undefined {
  if (field === 'emailPersonal' && value.trim() === '') return undefined;
  if (value.trim() === '') return undefined;
  return validateField(field, value);
}

export const TutorEditarBecarioPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellidos: '',
    emailInterno: '',
    contrasena: '',
    practica: '',
    cliente: '',
    horasContrato: '',
    ayudaEconomica: '',
    equipoEnUso: '',
    fechaInicioPracticas: '',
    fechaFinPracticas: '',
    tipoFormacion: '',
    nombreFormacion: '',
    centroEstudios: '',
    telefonoPersonal: '',
    emailPersonal: '',
    linkedin: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<ValidableField, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [tutoresAsignados, setTutoresAsignados] = useState<
    TutorAsignadoBecario[]
  >([]);
  const [showTutoresModal, setShowTutoresModal] = useState(false);
  const [tutoresDuplicadosError, setTutoresDuplicadosError] = useState<
    string | null
  >(null);
  const [lockedTutorIds, setLockedTutorIds] = useState<string[]>([]);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const idBecario = id && !Number.isNaN(Number(id)) ? Number(id) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!idBecario) {
        setFeedback({ type: 'error', message: 'ID de becario no valido' });
        setTimeout(() => navigate('/tutor'), 2000);
        return;
      }

      try {
        setIsLoading(true);
        const [editableData, tutoresData] = await Promise.all([
          getBecarioEditable(idBecario),
          getTutoresDelBecario(idBecario),
        ]);

        setUsuario(editableData.usuario);
        setLockedTutorIds([String(tutoresData.tutorActualId)]);
        setTutoresAsignados(
          tutoresData.tutores.map(tutor => ({
            id: String(tutor.id),
            nombre: tutor.nombre ?? '',
            apellidos: tutor.apellidos ?? '',
            email: tutor.email ?? '',
            rol: tutor.rol ?? '',
            tipoTutoria: (tutor.tipoTutoria ?? '') as TipoTutoriaBecario,
          }))
        );
        setFormData({
          nombre: editableData.usuario.nombre,
          apellidos: editableData.usuario.apellidos,
          emailInterno: editableData.usuario.email,
          contrasena: '',
          practica: editableData.usuario.practica || '',
          cliente: editableData.usuario.cliente || '',
          horasContrato: String(editableData.becario.horasContrato),
          ayudaEconomica:
            editableData.becario.ayudaEconomica !== null
              ? String(editableData.becario.ayudaEconomica)
              : '',
          equipoEnUso: editableData.becario.equipoEnUso || '',
          fechaInicioPracticas: editableData.becario.fechaInicioPracticas,
          fechaFinPracticas: editableData.becario.fechaFinPracticas,
          tipoFormacion:
            normalizeTipoFormacion(editableData.becario.tipoFormacion) ?? '',
          nombreFormacion: editableData.becario.nombreFormacion,
          centroEstudios: editableData.becario.centroEstudios,
          telefonoPersonal: editableData.becario.telefonoPersonal || '',
          emailPersonal: editableData.becario.emailPersonal || '',
          linkedin: editableData.becario.linkedin || '',
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Error al cargar los datos del becario',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [idBecario, navigate]);

  const loadTutoresForModal = useCallback(() => getTutoresDisponibles(), []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setFormData(prev => ({ ...prev, [field]: value }));

    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateFieldOnBlur(field, value),
      }));
    }
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateFieldOnBlur(field, value),
    }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const newTouched: Partial<Record<ValidableField, boolean>> = {};

    for (const field of REQUIRED_FIELDS) {
      newTouched[field] = true;
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    }

    if (formData.emailPersonal.trim() !== '') {
      const emailError = validateField('emailPersonal', formData.emailPersonal);
      if (emailError) {
        newErrors.emailPersonal = emailError;
        newTouched.emailPersonal = true;
      }
    }

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitError = (err: unknown) => {
    if (err instanceof ApiError) {
      setFeedback({
        type: 'error',
        message:
          err.status === 409
            ? 'El email introducido ya existe en el sistema.'
            : err.message || 'No se pudieron guardar los cambios.',
      });
      return;
    }

    setFeedback({
      type: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Error de conexion. Comprueba tu red e intentalo de nuevo.',
    });
  };

  const handleSubmit = async () => {
    setFeedback(null);
    if (!validateAll()) {
      setFeedback({
        type: 'error',
        message: 'Revisa los campos marcados en rojo antes de guardar.',
      });
      return;
    }
    if (!usuario || !idBecario) return;

    setSubmitting(true);
    try {
      const updateUsuarioData: UpdateUsuarioData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.emailInterno.trim(),
        practica: formData.practica.trim(),
        cliente: formData.cliente.trim(),
        ...(formData.contrasena.trim() !== '' && {
          contrasena: formData.contrasena.trim(),
        }),
      };
      await updateBecarioUsuario(idBecario, updateUsuarioData);

      const esUniversitaria =
        formData.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA;
      await updateBecario(idBecario, {
        practica: formData.practica.trim(),
        cliente: formData.cliente.trim(),
        horasContrato: Number(formData.horasContrato),
        ayudaEconomica:
          formData.ayudaEconomica.trim() !== ''
            ? Number(formData.ayudaEconomica)
            : null,
        equipoEnUso: formData.equipoEnUso.trim() || null,
        fechaInicioPracticas: formData.fechaInicioPracticas,
        fechaFinPracticas: formData.fechaFinPracticas,
        tipoFormacion: formData.tipoFormacion as TipoFormacion,
        nombreGradoUniversitario: esUniversitaria
          ? formData.nombreFormacion.trim()
          : null,
        nombreFormacionProfesional: esUniversitaria
          ? null
          : formData.nombreFormacion.trim(),
        centroEstudios: formData.centroEstudios.trim(),
        telefonoPersonal: formData.telefonoPersonal.trim() || null,
        emailPersonal: formData.emailPersonal.trim() || null,
        linkedin: formData.linkedin.trim() || null,
      });

      const tutoresParaGuardar: TutorAsignadoBecarioEdicion[] =
        tutoresAsignados.map(tutor => ({
          tutorId: Number(tutor.id),
          tipoTutoria: tutor.tipoTutoria as DomainTipoTutoriaBecario,
        }));
      await updateTutoresDelBecario(idBecario, tutoresParaGuardar);

      navigate('/tutor');
    } catch (err) {
      handleSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!usuario || !idBecario) return;

    setSubmitting(true);
    try {
      const updated = await toggleEstadoBecario(idBecario);
      setUsuario(prev => (prev ? { ...prev, activo: updated.activo } : prev));
      setFeedback({
        type: 'success',
        message: `Becario ${updated.activo ? 'habilitado' : 'deshabilitado'} correctamente.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Error al cambiar el estado del becario',
      });
    } finally {
      setSubmitting(false);
      setShowToggleModal(false);
    }
  };

  const handleDelete = async () => {
    if (!idBecario) return;

    setSubmitting(true);
    try {
      await deleteBecario(idBecario);
      navigate('/tutor');
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Error al eliminar el becario',
      });
      setSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmarTutores = (tutoresSeleccionados: TutorDisponible[]) => {
    setTutoresAsignados(prev => {
      const prevMap = new Map(prev.map(tutor => [tutor.id, tutor]));
      return tutoresSeleccionados.map(tutor => {
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

  const datosBecario: DatosBecario = {
    horasContrato: formData.horasContrato,
    ayudaEconomica: formData.ayudaEconomica,
    equipoEnUso: formData.equipoEnUso,
    fechaInicioPracticas: formData.fechaInicioPracticas,
    fechaFinPracticas: formData.fechaFinPracticas,
    tipoFormacion: formData.tipoFormacion,
    nombreFormacion: formData.nombreFormacion,
    centroEstudios: formData.centroEstudios,
    telefonoPersonal: formData.telefonoPersonal,
    emailPersonal: formData.emailPersonal,
    linkedin: formData.linkedin,
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor de empresa"
          onLogout={() => logout()}
        />
        <main className={styles.main}>
          <p>Cargando datos del becario...</p>
        </main>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor de empresa"
          onLogout={() => logout()}
        />
        <main className={styles.main}>
          <FeedbackMessages
            feedback={feedback}
            onClose={() => setFeedback(null)}
          />
          <UsuarioEditActions
            submitting={false}
            onCancel={() => navigate('/tutor')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Tutor de empresa"
        onLogout={() => logout()}
      />

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1>Editar Becario</h1>
          <p className={styles.subtitle}>
            Actualiza los datos del becario y gestiona sus tutores asignados.
          </p>
        </div>

        <UsuarioEditHeader
          usuario={usuario}
          roleLabel="Becario"
          roleBadgeClassName={styles.badgeBlue}
          submitting={submitting}
          onToggleEstado={() => setShowToggleModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />

        <FeedbackMessages
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />
        <UsuarioInactiveBanner activo={usuario.activo} />

        <div className={styles.editGrid}>
          <div className={styles.editMainColumn}>
            <UsuarioBaseForm
              usuario={usuario}
              formData={formData}
              errors={errors}
              roleLabel="Becario"
              roleBadgeClassName={styles.badgeBlue}
              practicaClienteMode="editable"
              showEmailInterno={false}
              showPracticaCliente={false}
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSubmit}
              onRegenerarContrasena={() =>
                setFormData(prev => ({
                  ...prev,
                  contrasena: generarContrasenaTemp(),
                }))
              }
            />

            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={errors}
              section="academic"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className={styles.editSideColumn}>
            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={errors}
              section="intern"
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <DatosBecarioForm
              datosBecario={datosBecario}
              errors={errors}
              section="personal"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <TutoresAsignadosTable
          tutores={tutoresAsignados}
          duplicadosError={tutoresDuplicadosError}
          nonRemovableTutorIds={lockedTutorIds}
          lockedTutorTypeIds={lockedTutorIds}
          onAgregar={() => setShowTutoresModal(true)}
          onTipoTutoriaChange={(tutorId, tipo) => {
            if (lockedTutorIds.includes(tutorId)) return;
            setTutoresAsignados(prev =>
              prev.map(tutor =>
                tutor.id === tutorId ? { ...tutor, tipoTutoria: tipo } : tutor
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

        <UsuarioEditActions
          submitting={submitting}
          onCancel={() => navigate('/tutor')}
        />
      </main>

      <SeleccionarTutoresModal
        isOpen={showTutoresModal}
        tutoresYaAsignados={tutoresAsignados}
        loadTutores={loadTutoresForModal}
        lockedTutorIds={lockedTutorIds}
        onConfirmar={handleConfirmarTutores}
        onCancelar={() => setShowTutoresModal(false)}
        onClose={() => setShowTutoresModal(false)}
      />

      {showToggleModal && (
        <ToggleEstadoUsuarioModal
          usuario={usuario}
          submitting={submitting}
          onCancel={() => setShowToggleModal(false)}
          onConfirm={handleToggleEstado}
        />
      )}

      {showDeleteModal && (
        <EliminarUsuarioModal
          usuario={usuario}
          submitting={submitting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
