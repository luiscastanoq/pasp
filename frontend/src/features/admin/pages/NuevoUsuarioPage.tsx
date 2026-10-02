/**
 * NuevoUsuarioPage — orquestador de alta de usuarios.
 *
 * Las secciones de formulario, tablas, validaciones y mappers viven fuera de la
 * página para mantener este componente centrado en flujo, estado y submit.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import usuariosService from '../services/usuariosService';
import { ApiError } from '../../../shared/api/api';
import { SeleccionarBecariosModal } from '../components/SeleccionarBecariosModal';
import { SeleccionarTutoresModal } from '../components/SeleccionarTutoresModal';
import type { TutorDisponible } from '../components/SeleccionarTutoresModal';
import { ROLES, TIPO_TUTORIA } from '../../../shared/constants/domain.constants';
import { FeedbackMessages } from '../components/usuario-form/FeedbackMessages';
import { RoleSelector } from '../components/usuario-form/RoleSelector';
import { DatosBasicosUsuarioForm } from '../components/usuario-form/DatosBasicosUsuarioForm';
import { BecariosAsignadosTable } from '../components/usuario-form/BecariosAsignadosTable';
import { DatosBecarioForm } from '../components/usuario-form/DatosBecarioForm';
import { TutoresAsignadosTable } from '../components/usuario-form/TutoresAsignadosTable';
import { BecariosEmpresaTable } from '../components/usuario-form/BecariosEmpresaTable';
import type {
  Becario,
  BecarioAsignadoEmpresa,
  DatosBecario,
  FeedbackState,
  FormErrors,
  NuevoUsuarioFormData,
  TipoTutoriaBecario,
  TipoTutoriaEmpresa,
  TutorAsignadoBecario,
  ValidableField,
} from '../components/usuario-form/types';
import {
  DATOS_BECARIO_EMPTY,
  ROL_OPTIONS,
  ROLES_SIN_PRACTICA_CLIENTE,
  TIPO_TUTORIA_LABELS,
} from '../components/usuario-form/types';
import {
  generarContrasenaTemp,
  validateDatosBecarioFieldOnBlur,
  validateDatosBecarioSubmit,
  validateFieldOnBlur,
  validateUsuarioForm,
} from '../validation/usuario.validation';
import {
  mapBecarioIdsPayload,
  mapBecariosEmpresaPayload,
  mapNuevoBecarioPayload,
} from '../mappers/usuario.mapper';
import styles from './NuevoUsuarioPage.module.css';

export const NuevoUsuarioPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [becariosAsignados, setBecariosAsignados] = useState<Becario[]>([]);
  const [modalBecariosAbierto, setModalBecariosAbierto] = useState(false);
  const [becariosEmpresa, setBecariosEmpresa] = useState<
    BecarioAsignadoEmpresa[]
  >([]);
  const [modalEmpresaAbierto, setModalEmpresaAbierto] = useState(false);
  const [datosBecario, setDatosBecario] =
    useState<DatosBecario>(DATOS_BECARIO_EMPTY);
  const [datosBecarioErrors, setDatosBecarioErrors] = useState<
    Partial<Record<keyof DatosBecario, string>>
  >({});
  const [datosBecarioTouched, setDatosBecarioTouched] = useState<
    Partial<Record<keyof DatosBecario, boolean>>
  >({});
  const [tutoresAsignados, setTutoresAsignados] = useState<
    TutorAsignadoBecario[]
  >([]);
  const [tutoresDuplicadosError, setTutoresDuplicadosError] = useState<
    string | null
  >(null);
  const [modalTutoresAbierto, setModalTutoresAbierto] = useState(false);
  const [formData, setFormData] = useState<NuevoUsuarioFormData>(() => ({
    nombre: '',
    apellidos: '',
    emailInterno: '',
    contrasena: generarContrasenaTemp(),
    practica: '',
    cliente: '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<ValidableField, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleRolChange = (nuevoRol: string) => {
    setRolSeleccionado(nuevoRol);
    setErrors({});
    setTouched({});
    setFeedback(null);

    if (nuevoRol !== ROLES.TUTOR_ACADEMICO) {
      setBecariosAsignados([]);
    }
    if (nuevoRol !== ROLES.TUTOR_EMPRESA) {
      setBecariosEmpresa([]);
    }
    if (nuevoRol !== ROLES.BECARIO) {
      setDatosBecario(DATOS_BECARIO_EMPTY);
      setDatosBecarioErrors({});
      setDatosBecarioTouched({});
      setTutoresAsignados([]);
      setTutoresDuplicadosError(null);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateFieldOnBlur(field, value, rolSeleccionado),
      }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as ValidableField;
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateFieldOnBlur(field, value, rolSeleccionado),
    }));
  };

  const validateAll = (): boolean => {
    const result = validateUsuarioForm(formData, rolSeleccionado);
    setTouched(result.touched);
    setErrors(result.errors);
    return result.isValid;
  };

  const validateBecarioData = (): boolean => {
    const result = validateDatosBecarioSubmit(datosBecario);
    setDatosBecarioTouched(prev => ({ ...prev, ...result.touched }));
    setDatosBecarioErrors(prev => ({ ...prev, ...result.errors }));

    if (!result.isValid) {
      setFeedback({
        type: 'error',
        message:
          'Revisa los campos marcados en rojo en "Datos del Becario" antes de guardar.',
      });
      return false;
    }

    return true;
  };

  const validateTutoresAsignados = (): boolean => {
    const tutoresSinTipo = tutoresAsignados.filter(tutor => !tutor.tipoTutoria);
    if (tutoresSinTipo.length > 0) {
      setFeedback({
        type: 'error',
        message: `Todos los tutores deben tener un tipo de tutoría seleccionado. Faltan: ${tutoresSinTipo.map(t => `${t.nombre} ${t.apellidos}`).join(', ')}.`,
      });
      return false;
    }

    const tiposUsados = tutoresAsignados
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

  const validateBecariosEmpresa = (): boolean => {
    const sinTipo = becariosEmpresa.filter(becario => !becario.tipoTutoria);
    if (sinTipo.length > 0) {
      setFeedback({
        type: 'error',
        message: `Todos los becarios deben tener un tipo de tutoría seleccionado. Faltan: ${sinTipo.map(b => `${b.nombre} ${b.apellidos}`).join(', ')}.`,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setFeedback(null);

    if (!rolSeleccionado) {
      setFeedback({
        type: 'error',
        message: 'Debes seleccionar un rol antes de guardar el usuario.',
      });
      return;
    }

    if (!validateAll()) {
      setFeedback({
        type: 'error',
        message:
          'Revisa los campos marcados en rojo antes de guardar el usuario.',
      });
      return;
    }

    if (
      rolSeleccionado === ROLES.BECARIO &&
      (!validateBecarioData() || !validateTutoresAsignados())
    ) {
      return;
    }

    if (
      rolSeleccionado === ROLES.TUTOR_EMPRESA &&
      !validateBecariosEmpresa()
    ) {
      return;
    }

    setSubmitting(true);
    try {
      let response;

      if (rolSeleccionado === ROLES.ADMIN) {
        response = await usuariosService.crearAdministrador({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.emailInterno,
          contrasena: formData.contrasena,
          rol: ROLES.ADMIN,
        });
      } else if (rolSeleccionado === ROLES.TUTOR_EMPRESA) {
        response = await usuariosService.crearTutorEmpresa({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.emailInterno,
          contrasena: formData.contrasena,
          rol: ROLES.TUTOR_EMPRESA,
          practica: formData.practica,
          cliente: formData.cliente,
          becarios: mapBecariosEmpresaPayload(becariosEmpresa),
        });
      } else if (rolSeleccionado === ROLES.BECARIO) {
        response = await usuariosService.crearBecario(
          mapNuevoBecarioPayload(formData, datosBecario, tutoresAsignados)
        );
      } else {
        response = await usuariosService.crearTutorAcademico({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.emailInterno,
          contrasena: formData.contrasena,
          rol: ROLES.TUTOR_ACADEMICO,
          becarioIds: mapBecarioIdsPayload(becariosAsignados),
        });
      }

      if (response.success) {
        handleCreateSuccess();
      } else {
        setFeedback({ type: 'error', message: response.message });
      }
    } catch (err: unknown) {
      handleCreateError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSuccess = () => {
    let extraMsg = '';
    if (
      rolSeleccionado === ROLES.TUTOR_ACADEMICO &&
      becariosAsignados.length > 0
    ) {
      extraMsg = ` Con ${becariosAsignados.length} becario(s) asignado(s).`;
    } else if (
      rolSeleccionado === ROLES.TUTOR_EMPRESA &&
      becariosEmpresa.length > 0
    ) {
      extraMsg = ` Con ${becariosEmpresa.length} becario(s) asignado(s).`;
    } else if (
      rolSeleccionado === ROLES.BECARIO &&
      tutoresAsignados.length > 0
    ) {
      extraMsg = ` Con ${tutoresAsignados.length} tutor(es) asignado(s).`;
    }

    const nombreCreado = formData.nombre;
    const apellidosCreado = formData.apellidos;
    const emailCreado = formData.emailInterno;
    const contrasenaCreada = formData.contrasena;

    setFormData({
      nombre: '',
      apellidos: '',
      emailInterno: '',
      contrasena: generarContrasenaTemp(),
      practica: '',
      cliente: '',
    });
    setBecariosAsignados([]);
    setBecariosEmpresa([]);
    setDatosBecario(DATOS_BECARIO_EMPTY);
    setDatosBecarioErrors({});
    setDatosBecarioTouched({});
    setTutoresAsignados([]);
    setTutoresDuplicadosError(null);
    setErrors({});
    setTouched({});

    setFeedback({
      type: 'success',
      message: `Usuario "${nombreCreado} ${apellidosCreado}" (${emailCreado}) creado correctamente. Contrasena temporal: ${contrasenaCreada}${extraMsg}`,
    });
  };

  const handleCreateError = (err: unknown) => {
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

  const handleConfirmarBecarios = (becariosSeleccionados: Becario[]) => {
    setBecariosAsignados(becariosSeleccionados);
    setModalBecariosAbierto(false);
  };

  const handleConfirmarEmpresa = (becariosSeleccionados: Becario[]) => {
    const idsActuales = new Set(becariosEmpresa.map(becario => becario.id));
    const nuevos: BecarioAsignadoEmpresa[] = becariosSeleccionados
      .filter(becario => !idsActuales.has(becario.id))
      .map(becario => ({
        ...becario,
        tipoTutoria: '' as TipoTutoriaEmpresa,
      }));
    setBecariosEmpresa(prev => [...prev, ...nuevos]);
    setModalEmpresaAbierto(false);
  };

  const handleTipoTutoriaEmpresaChange = (
    becarioId: string,
    nuevoTipo: TipoTutoriaEmpresa
  ) => {
    setBecariosEmpresa(prev =>
      prev.map(becario =>
        becario.id === becarioId
          ? { ...becario, tipoTutoria: nuevoTipo }
          : becario
      )
    );
  };

  const handleConfirmarTutores = (tutoresSeleccionados: TutorDisponible[]) => {
    const nuevos: TutorAsignadoBecario[] = tutoresSeleccionados.map(tutor => ({
      id: tutor.id,
      nombre: tutor.nombre,
      apellidos: tutor.apellidos,
      email: tutor.email,
      rol: tutor.rol,
      tipoTutoria:
        tutor.rol === ROLES.TUTOR_ACADEMICO
          ? TIPO_TUTORIA.ACADEMICO
          : ('' as TipoTutoriaBecario),
    }));
    setTutoresAsignados(nuevos);
    setModalTutoresAbierto(false);
  };

  const handleTipoTutoriaTutorChange = (
    tutorId: string,
    nuevoTipo: TipoTutoriaBecario
  ) => {
    setTutoresAsignados(prev =>
      prev.map(tutor =>
        tutor.id === tutorId ? { ...tutor, tipoTutoria: nuevoTipo } : tutor
      )
    );
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

  const isDisabled = !rolSeleccionado;
  const isPracticaClienteDisabled =
    !rolSeleccionado || ROLES_SIN_PRACTICA_CLIENTE.includes(rolSeleccionado);
  const showPracticaCliente =
    !!rolSeleccionado && !ROLES_SIN_PRACTICA_CLIENTE.includes(rolSeleccionado);
  const rolLabel =
    ROL_OPTIONS.find(option => option.value === rolSeleccionado)?.label ??
    'Rol pendiente';
  const pageTitle = rolSeleccionado ? `Crear ${rolLabel}` : 'Crear usuario';
  const hasSideSections = rolSeleccionado === ROLES.BECARIO;
  const pageSubtitle = rolSeleccionado
    ? 'Completa la información necesaria para dar de alta este perfil en el sistema.'
    : 'Selecciona el rol del nuevo usuario y completa los datos de alta.';

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Administrador"
        onLogout={() => logout()}
      />

      <main className={styles.main}>
        <section className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>{pageTitle}</h1>
          <p className={styles.sectionSubtitle}>{pageSubtitle}</p>
        </section>

        <section
          className={styles.roleSelectorPanel}
          aria-label="Seleccionar rol del usuario"
        >
          <RoleSelector value={rolSeleccionado} onChange={handleRolChange} />
        </section>

        <FeedbackMessages
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />

        <div
          className={
            hasSideSections ? styles.createGrid : styles.createGridSingle
          }
        >
          <div className={styles.createMainColumn}>
            <DatosBasicosUsuarioForm
              formData={formData}
              errors={errors}
              isDisabled={isDisabled}
              isPracticaClienteDisabled={isPracticaClienteDisabled}
              showPracticaCliente={showPracticaCliente}
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSubmit}
            />

            {rolSeleccionado === ROLES.BECARIO && (
              <DatosBecarioForm
                datosBecario={datosBecario}
                errors={datosBecarioErrors}
                section="academic"
                onChange={handleDatosBecarioChange}
                onBlur={handleDatosBecarioBlur}
              />
            )}

            {rolSeleccionado === ROLES.TUTOR_ACADEMICO && (
              <BecariosAsignadosTable
                becarios={becariosAsignados}
                onAgregar={() => setModalBecariosAbierto(true)}
                onRemove={becarioId =>
                  setBecariosAsignados(prev =>
                    prev.filter(becario => becario.id !== becarioId)
                  )
                }
              />
            )}

            {rolSeleccionado === ROLES.BECARIO && (
              <TutoresAsignadosTable
                tutores={tutoresAsignados}
                duplicadosError={tutoresDuplicadosError}
                onAgregar={() => setModalTutoresAbierto(true)}
                onTipoTutoriaChange={handleTipoTutoriaTutorChange}
                onRemove={tutorId =>
                  setTutoresAsignados(prev =>
                    prev.filter(tutor => tutor.id !== tutorId)
                  )
                }
              />
            )}

            {rolSeleccionado === ROLES.TUTOR_EMPRESA && (
              <BecariosEmpresaTable
                becarios={becariosEmpresa}
                onAgregar={() => setModalEmpresaAbierto(true)}
                onTipoTutoriaChange={handleTipoTutoriaEmpresaChange}
                onRemove={becarioId =>
                  setBecariosEmpresa(prev =>
                    prev.filter(becario => becario.id !== becarioId)
                  )
                }
              />
            )}
          </div>

          {hasSideSections && (
            <aside className={styles.createSideColumn}>
              <>
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
              </>
            </aside>
          )}
        </div>

        <div className={styles.cardFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate('/admin')}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="nuevo-usuario-form"
            className={styles.saveButton}
            disabled={submitting || !rolSeleccionado}
          >
            {submitting ? (
              <>
                <span className={styles.spinnerSmall} />
                Guardando...
              </>
            ) : (
              'Crear usuario'
            )}
          </button>
        </div>
      </main>

      <SeleccionarBecariosModal
        isOpen={modalBecariosAbierto}
        becariosYaAsignados={becariosAsignados}
        onConfirmar={handleConfirmarBecarios}
        onCancelar={() => setModalBecariosAbierto(false)}
        onClose={() => setModalBecariosAbierto(false)}
      />

      <SeleccionarBecariosModal
        isOpen={modalEmpresaAbierto}
        becariosYaAsignados={becariosEmpresa}
        onConfirmar={handleConfirmarEmpresa}
        onCancelar={() => setModalEmpresaAbierto(false)}
        onClose={() => setModalEmpresaAbierto(false)}
      />

      <SeleccionarTutoresModal
        isOpen={modalTutoresAbierto}
        tutoresYaAsignados={tutoresAsignados}
        onConfirmar={handleConfirmarTutores}
        onCancelar={() => setModalTutoresAbierto(false)}
        onClose={() => setModalTutoresAbierto(false)}
      />
    </div>
  );
};
