import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import { usuariosService } from '../services/usuariosService';
import { SeleccionarTutoresModal } from '../components/SeleccionarTutoresModal';
import type { TutorDisponible } from '../components/SeleccionarTutoresModal';
import type {
  UsuarioDetalle,
  UpdateUsuarioData,
  UpdateBecarioDetalleData,
  TutorAsignadoBecarioEdicion,
} from '../../../types/usuario.types';
import { ApiError } from '../../../shared/api/api';
import {
  ROLES,
  TIPO_TUTORIA,
  normalizeTipoFormacion,
} from '../../../shared/constants/domain.constants';
import type {
  TipoFormacion,
  TipoTutoriaBecario as DomainTipoTutoriaBecario,
} from '../../../shared/constants/domain.constants';
import { FeedbackMessages } from '../components/usuario-form/FeedbackMessages';
import { DatosBecarioForm } from '../components/usuario-form/DatosBecarioForm';
import { TutoresAsignadosTable } from '../components/usuario-form/TutoresAsignadosTable';
import type {
  DatosBecario,
  TipoTutoriaBecario,
  TutorAsignadoBecario,
} from '../components/usuario-form/types';
import { UsuarioBaseForm } from '../components/usuario-edit/UsuarioBaseForm';
import { UsuarioEditActions } from '../components/usuario-edit/UsuarioEditActions';
import {
  EliminarUsuarioModal,
  ToggleEstadoUsuarioModal,
} from '../components/usuario-edit/UsuarioConfirmModal';
import { UsuarioEditHeader } from '../components/usuario-edit/UsuarioEditHeader';
import {
  UsuarioEditErrorState,
  UsuarioEditLoadingState,
} from '../components/usuario-edit/UsuarioEditStates';
import { UsuarioInactiveBanner } from '../components/usuario-edit/UsuarioInactiveBanner';
import type { FeedbackState } from '../components/usuario-edit/types';
import { generarContrasenaTemp } from '../validation/usuario-edit.validation';
import styles from '../styles/adminPage.module.css';

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
        : 'Introduce un email válido (ej. usuario@empresa.com).';
    case 'emailPersonal':
      if (value.trim() === '') return undefined;
      return EMAIL_RE.test(value.trim()) ? undefined : 'Introduce un email válido.';
    case 'horasContrato': {
      if (value.trim() === '') return 'Este campo es obligatorio.';
      const num = Number(value);
      return Number.isNaN(num) || num <= 0
        ? 'Introduce un número de horas válido (mayor a 0).'
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
      return value === '' ? 'Debes seleccionar un tipo de formación.' : undefined;
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

export const EditarBecarioPage = () => {
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
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || isNaN(Number(id))) {
        setFeedback({ type: 'error', message: 'ID de usuario no válido' });
        setTimeout(() => navigate('/admin'), 2000);
        return;
      }

      const userId = parseInt(id, 10);
      try {
        setIsLoading(true);
        const usuarioData = await usuariosService.getUsuarioById(userId);

        if (usuarioData.rol !== ROLES.BECARIO) {
          setFeedback({
            type: 'error',
            message: 'El usuario no tiene rol Becario',
          });
          setTimeout(() => navigate('/admin'), 2000);
          return;
        }

        setUsuario(usuarioData);

        const becarioData = await usuariosService.getBecarioDetalle(userId);
        const tutoresData = await usuariosService.getTutoresDelBecario(userId);
        setTutoresAsignados(
          tutoresData.map(tutor => ({
            id: String(tutor.id),
            nombre: tutor.nombre ?? '',
            apellidos: tutor.apellidos ?? '',
            email: tutor.email ?? '',
            rol: tutor.rol ?? '',
            tipoTutoria: (tutor.tipoTutoria ?? '') as TipoTutoriaBecario,
          }))
        );

        setFormData({
          nombre: usuarioData.nombre,
          apellidos: usuarioData.apellidos,
          emailInterno: usuarioData.email,
          contrasena: '',
          practica: usuarioData.practica || '',
          cliente: usuarioData.cliente || '',
          horasContrato: String(becarioData.horasContrato),
          ayudaEconomica:
            becarioData.ayudaEconomica !== null
              ? String(becarioData.ayudaEconomica)
              : '',
          equipoEnUso: becarioData.equipoEnUso || '',
          fechaInicioPracticas: becarioData.fechaInicioPracticas,
          fechaFinPracticas: becarioData.fechaFinPracticas,
          tipoFormacion: normalizeTipoFormacion(becarioData.tipoFormacion) ?? '',
          nombreFormacion: becarioData.nombreFormacion,
          centroEstudios: becarioData.centroEstudios,
          telefonoPersonal: becarioData.telefonoPersonal || '',
          emailPersonal: becarioData.emailPersonal || '',
          linkedin: becarioData.linkedin || '',
        });
      } catch (err: unknown) {
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
  }, [id, navigate]);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

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

  const handleSubmit = async () => {
    setFeedback(null);
    if (!validateAll()) {
      setFeedback({
        type: 'error',
        message: 'Revisa los campos marcados en rojo antes de guardar.',
      });
      return;
    }
    if (!usuario) return;

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
      await usuariosService.updateAdministrador(
        usuario.idUsuario,
        updateUsuarioData
      );

      const updateBecarioData: UpdateBecarioDetalleData = {
        horasContrato: Number(formData.horasContrato),
        ayudaEconomica:
          formData.ayudaEconomica.trim() !== ''
            ? Number(formData.ayudaEconomica)
            : null,
        equipoEnUso: formData.equipoEnUso.trim() || null,
        fechaInicioPracticas: formData.fechaInicioPracticas,
        fechaFinPracticas: formData.fechaFinPracticas,
        tipoFormacion: formData.tipoFormacion as TipoFormacion,
        nombreFormacion: formData.nombreFormacion.trim(),
        centroEstudios: formData.centroEstudios.trim(),
        telefonoPersonal: formData.telefonoPersonal.trim() || null,
        emailPersonal: formData.emailPersonal.trim() || null,
        linkedin: formData.linkedin.trim() || null,
      };
      await usuariosService.updateBecarioDetalle(
        usuario.idUsuario,
        updateBecarioData
      );

      const tutoresParaGuardar: TutorAsignadoBecarioEdicion[] =
        tutoresAsignados.map(tutor => ({
          tutorId: Number(tutor.id),
          tipoTutoria: tutor.tipoTutoria as DomainTipoTutoriaBecario,
        }));
      await usuariosService.actualizarTutoresDelBecario(
        usuario.idUsuario,
        tutoresParaGuardar
      );

      navigate('/admin');
    } catch (err: unknown) {
      handleSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        setFeedback({
          type: 'error',
          message:
            'El email introducido ya existe en el sistema. Usa un email diferente.',
        });
      } else if (err.status === 400) {
        setFeedback({
          type: 'error',
          message:
            err.message ||
            'Datos incorrectos. Revisa los campos e inténtalo de nuevo.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Error interno del servidor. Inténtalo de nuevo más tarde.',
        });
      }
    } else {
      setFeedback({
        type: 'error',
        message: 'Error de conexión. Comprueba tu red e inténtalo de nuevo.',
      });
    }
  };

  const handleToggleEstado = async () => {
    if (!usuario) return;
    setSubmitting(true);
    try {
      await usuariosService.toggleEstadoUsuario(usuario.idUsuario);
      const updatedData = await usuariosService.getUsuarioById(
        usuario.idUsuario
      );
      setUsuario(updatedData);
      setFeedback({
        type: 'success',
        message: `Usuario ${updatedData.activo ? 'habilitado' : 'deshabilitado'} correctamente.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Error al cambiar el estado del usuario',
      });
    } finally {
      setSubmitting(false);
      setShowToggleModal(false);
    }
  };

  const handleDelete = async () => {
    if (!usuario) return;
    setSubmitting(true);
    try {
      await usuariosService.deleteUsuario(usuario.idUsuario);
      navigate('/admin');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Error al eliminar el usuario',
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
      <UsuarioEditLoadingState
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        onLogout={() => logout()}
      />
    );
  }

  if (!usuario) {
    return (
      <UsuarioEditErrorState
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        onLogout={() => logout()}
        feedback={feedback}
        onBack={() => navigate('/admin')}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Administrador"
        onLogout={() => logout()}
      />

      <main className={styles.main}>
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
          onAgregar={() => setShowTutoresModal(true)}
          onTipoTutoriaChange={(tutorId, tipo) =>
            setTutoresAsignados(prev =>
              prev.map(tutor =>
                tutor.id === tutorId ? { ...tutor, tipoTutoria: tipo } : tutor
              )
            )
          }
          onRemove={tutorId =>
            setTutoresAsignados(prev =>
              prev.filter(tutor => tutor.id !== tutorId)
            )
          }
        />

        <UsuarioEditActions
          submitting={submitting}
          onCancel={() => navigate('/admin')}
        />
      </main>

      <SeleccionarTutoresModal
        isOpen={showTutoresModal}
        tutoresYaAsignados={tutoresAsignados}
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
