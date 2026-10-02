import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import usuariosService, {
  type BecarioAsignadoTutorAcademico,
} from '../services/usuariosService';
import type { Becario, UsuarioDetalle } from '../../../types/usuario.types';
import { ApiError } from '../../../shared/api/api';
import { SeleccionarBecariosModal } from '../components/SeleccionarBecariosModal';
import { FeedbackMessages } from '../components/usuario-form/FeedbackMessages';
import { BecariosAsignadosTable } from '../components/usuario-form/BecariosAsignadosTable';
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
import type {
  FeedbackState,
  UsuarioEditErrors,
  UsuarioEditField,
  UsuarioEditFormData,
} from '../components/usuario-edit/types';
import {
  generarContrasenaTemp,
  validateUsuarioEditFieldOnBlur,
  validateUsuarioEditForm,
} from '../validation/usuario-edit.validation';
import styles from '../styles/adminPage.module.css';

const REQUIRED_FIELDS: UsuarioEditField[] = [
  'nombre',
  'apellidos',
  'emailInterno',
];

export const EditarTutorAcademicoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UsuarioEditFormData>({
    nombre: '',
    apellidos: '',
    emailInterno: '',
    contrasena: '',
  });
  const [errors, setErrors] = useState<UsuarioEditErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<UsuarioEditField, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [becariosAsignados, setBecariosAsignados] = useState<
    BecarioAsignadoTutorAcademico[]
  >([]);
  const [modalBecariosAbierto, setModalBecariosAbierto] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      if (!id || isNaN(Number(id))) {
        setFeedback({ type: 'error', message: 'ID de usuario no válido.' });
        setTimeout(() => navigate('/admin'), 2000);
        return;
      }

      const userId = parseInt(id, 10);
      try {
        setIsLoading(true);
        const data = await usuariosService.getUsuarioById(userId);
        setUsuario(data);
        setFormData({
          nombre: data.nombre,
          apellidos: data.apellidos,
          emailInterno: data.email,
          contrasena: '',
        });
        const becarios = await usuariosService.getBecariosDeTutorAcademico(userId);
        setBecariosAsignados(becarios);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          setFeedback({ type: 'error', message: 'Usuario no encontrado.' });
          setTimeout(() => navigate('/admin'), 2000);
        } else {
          setFeedback({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Error al cargar los datos del usuario.',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDatos();
  }, [id, navigate]);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as UsuarioEditField;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateUsuarioEditFieldOnBlur(field, value),
      }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as UsuarioEditField;
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateUsuarioEditFieldOnBlur(field, value),
    }));
  };

  const validateAll = (): boolean => {
    const result = validateUsuarioEditForm(formData, REQUIRED_FIELDS);
    setTouched(result.touched);
    setErrors(result.errors);
    return result.isValid;
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
      await usuariosService.updateAdministrador(usuario.idUsuario, {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.emailInterno.trim(),
        ...(formData.contrasena.trim() !== '' && {
          contrasena: formData.contrasena.trim(),
        }),
      });

      await usuariosService.actualizarBecariosDeTutorAcademico(
        usuario.idUsuario,
        becariosAsignados.map(becario => parseInt(becario.id, 10))
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
          err instanceof Error ? err.message : 'Error al cambiar el estado.',
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
          err instanceof Error ? err.message : 'Error al eliminar el usuario.',
      });
      setSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmarBecarios = (seleccionados: Becario[]) => {
    const existingMap = new Map<string, BecarioAsignadoTutorAcademico>(
      becariosAsignados.map(becario => [becario.id, becario])
    );
    const nuevaLista: BecarioAsignadoTutorAcademico[] = seleccionados.map(
      becario => {
        const existing = existingMap.get(becario.id);
        return {
          id: becario.id,
          nombre: becario.nombre,
          apellidos: becario.apellidos,
          emailPersonal: becario.emailPersonal,
          centroEstudios: becario.centroEstudios,
          tipoFormacion: becario.tipoFormacion,
          porcentajeAsignacion: existing?.porcentajeAsignacion ?? 0,
        };
      }
    );
    setBecariosAsignados(nuevaLista);
    setModalBecariosAbierto(false);
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
          submitting={submitting}
          onToggleEstado={() => setShowToggleModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />

        <FeedbackMessages
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />
        <UsuarioInactiveBanner activo={usuario.activo} />

        <UsuarioBaseForm
          usuario={usuario}
          formData={formData}
          errors={errors}
          roleLabel="Tutor académico"
          roleBadgeClassName={styles.badgeOrange}
          practicaClienteMode="readonly"
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

        <BecariosAsignadosTable
          becarios={becariosAsignados}
          onAgregar={() => setModalBecariosAbierto(true)}
          onRemove={becarioId =>
            setBecariosAsignados(prev =>
              prev.filter(becario => becario.id !== becarioId)
            )
          }
        />

        <UsuarioEditActions
          submitting={submitting}
          onCancel={() => navigate('/admin')}
        />
      </main>

      <SeleccionarBecariosModal
        isOpen={modalBecariosAbierto}
        becariosYaAsignados={becariosAsignados}
        onConfirmar={handleConfirmarBecarios}
        onCancelar={() => setModalBecariosAbierto(false)}
        onClose={() => setModalBecariosAbierto(false)}
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
