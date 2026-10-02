import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import { usuariosService } from '../services/usuariosService';
import type {
  UsuarioDetalle,
  UpdateUsuarioData,
} from '../../../types/usuario.types';
import { ApiError } from '../../../shared/api/api';
import { FeedbackMessages } from '../components/usuario-form/FeedbackMessages';
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

export const EditarAdminPage = () => {
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
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!id || isNaN(Number(id))) {
        setFeedback({ type: 'error', message: 'ID de usuario no válido' });
        setIsLoading(false);
        setTimeout(() => navigate('/admin'), 2000);
        return;
      }

      try {
        setIsLoading(true);
        const data = await usuariosService.getUsuarioById(parseInt(id, 10));
        setUsuario(data);
        setFormData({
          nombre: data.nombre,
          apellidos: data.apellidos,
          emailInterno: data.email,
          contrasena: '',
        });
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          setFeedback({ type: 'error', message: 'Usuario no encontrado' });
          setTimeout(() => navigate('/admin'), 2000);
        } else {
          setFeedback({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Error al cargar los datos del usuario',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsuario();
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
      const updateData: UpdateUsuarioData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.emailInterno.trim(),
        ...(formData.contrasena.trim() !== '' && {
          contrasena: formData.contrasena.trim(),
        }),
      };

      await usuariosService.updateAdministrador(usuario.idUsuario, updateData);
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
          roleLabel="Administrador"
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

        <UsuarioEditActions
          submitting={submitting}
          onCancel={() => navigate('/admin')}
        />
      </main>

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
