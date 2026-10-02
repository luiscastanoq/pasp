/**
 * SeleccionarTutoresModal — HU-5.14 Fase 5
 * Modal con checklist de tutores (Tutor_Empresa / Tutor_Academico)
 * para asignar a un Becario recién creado.
 */
import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui';
import usuariosService from '../services/usuariosService';
import { ROLES } from '../../../shared/constants/domain.constants';
import type { TutorAsignadoBecario } from './usuario-form/types';
import styles from './SeleccionarTutoresModal.module.css';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface TutorDisponible {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: typeof ROLES.TUTOR_EMPRESA | typeof ROLES.TUTOR_ACADEMICO;
}

const ROL_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.TUTOR_EMPRESA]: 'Tutor de empresa',
  [ROLES.TUTOR_ACADEMICO]: 'Tutor académico',
  [ROLES.BECARIO]: 'Becario',
};

interface SeleccionarTutoresModalProps {
  isOpen: boolean;
  tutoresYaAsignados: TutorAsignadoBecario[];
  onConfirmar: (tutoresSeleccionados: TutorDisponible[]) => void;
  onCancelar: () => void;
  onClose: () => void;
  loadTutores?: () => Promise<TutorDisponible[]>;
  lockedTutorIds?: string[];
}

// ── Componente ────────────────────────────────────────────────────────────────

export const SeleccionarTutoresModal = ({
  isOpen,
  tutoresYaAsignados,
  onConfirmar,
  onCancelar,
  onClose,
  loadTutores,
  lockedTutorIds = [],
}: SeleccionarTutoresModalProps) => {
  const [todosLosTutores, setTodosLosTutores] = useState<TutorDisponible[]>([]);
  const [seleccionProvisional, setSeleccionProvisional] = useState<Set<string>>(
    new Set()
  );
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedTutorIdSet = new Set(lockedTutorIds);

  // Cargar tutores al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const cargarTutores = async () => {
      setCargando(true);
      setError(null);
      try {
        const tutores: TutorDisponible[] = loadTutores
          ? await loadTutores()
          : (await usuariosService.getAllUsuarios())
              .filter(
                u =>
                  u.rol === ROLES.TUTOR_EMPRESA ||
                  u.rol === ROLES.TUTOR_ACADEMICO
              )
              .map(u => ({
                id: String(u.idUsuario),
                nombre: u.nombre,
                apellidos: u.apellidos,
                email: u.email,
                rol: u.rol as TutorDisponible['rol'],
              }));
        setTodosLosTutores(tutores);

        // Pre-marcar los tutores ya asignados
        const idsAsignados = new Set(tutoresYaAsignados.map(t => t.id));
        setSeleccionProvisional(idsAsignados);
      } catch (err) {
        console.error('Error al cargar tutores:', err);
        setError(
          'Error al cargar la lista de tutores. Por favor, intenta de nuevo.'
        );
      } finally {
        setCargando(false);
      }
    };

    cargarTutores();
  }, [isOpen, loadTutores, tutoresYaAsignados]);

  // Filtrar según búsqueda
  const tutoresFiltrados = todosLosTutores.filter(tutor => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      `${tutor.nombre} ${tutor.apellidos}`.toLowerCase().includes(q) ||
      tutor.email.toLowerCase().includes(q)
    );
  });

  // Toggle selección
  const toggleTutor = (tutorId: string) => {
    if (lockedTutorIdSet.has(tutorId)) return;

    setSeleccionProvisional(prev => {
      const next = new Set(prev);
      if (next.has(tutorId)) {
        next.delete(tutorId);
      } else {
        next.add(tutorId);
      }
      return next;
    });
  };

  // Confirmar — devuelve los objetos completos seleccionados
  const handleConfirmar = () => {
    const nextSeleccion = new Set(seleccionProvisional);
    lockedTutorIds.forEach(id => nextSeleccion.add(id));
    const seleccionados = todosLosTutores.filter(t =>
      nextSeleccion.has(t.id)
    );
    onConfirmar(seleccionados);
  };

  // Cancelar — restaura al estado previo
  const handleCancelar = () => {
    const idsAsignados = new Set(tutoresYaAsignados.map(t => t.id));
    setSeleccionProvisional(idsAsignados);
    setBusqueda('');
    onCancelar();
  };

  // Cerrar por overlay (conserva selección provisional)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Cabecera */}
        <div className={styles.header}>
          <h2 className={styles.title}>Seleccionar tutores</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Contenido */}
        <div className={styles.content}>
          {cargando && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Cargando tutores...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!cargando && !error && tutoresFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>
                {busqueda
                  ? `No se encontraron tutores que coincidan con "${busqueda}"`
                  : 'No hay tutores disponibles en el sistema'}
              </p>
            </div>
          )}

          {!cargando && !error && tutoresFiltrados.length > 0 && (
            <div className={styles.checklist}>
              {tutoresFiltrados.map(tutor => (
                <label key={tutor.id} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={seleccionProvisional.has(tutor.id)}
                    disabled={lockedTutorIdSet.has(tutor.id)}
                    onChange={() => toggleTutor(tutor.id)}
                    className={styles.checkbox}
                  />
                  <div className={styles.tutorInfo}>
                    <span className={styles.tutorNombre}>
                      {tutor.nombre} {tutor.apellidos}
                    </span>
                    <span className={styles.tutorEmail}>{tutor.email}</span>
                    <span
                      className={`${styles.tutorRolBadge} ${
                        tutor.rol === ROLES.TUTOR_EMPRESA
                          ? styles.badgeEmpresa
                          : styles.badgeAcademico
                      }`}
                    >
                      {ROL_LABELS[tutor.rol] ?? tutor.rol}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSeleccionProvisional(new Set())}
            disabled={cargando || seleccionProvisional.size === 0}
          >
            Limpiar
          </Button>
          <div className={styles.footerActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelar}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmar}
              disabled={cargando}
            >
              Listo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
