/**
 * SeleccionarBecariosModal — Fase 3
 * Modal con checklist de becarios para asignar a un Tutor académico
 */
import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui';
import usuariosService from '../services/usuariosService';
import styles from './SeleccionarBecariosModal.module.css';

interface Becario {
  id: string;
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  centroEstudios: {
    nombre: string;
  } | null;
  tipoFormacion: string | null;
}

interface SeleccionarBecariosModalProps {
  isOpen: boolean;
  becariosYaAsignados: Becario[];
  onConfirmar: (becariosSeleccionados: Becario[]) => void;
  onCancelar: () => void;
  onClose: () => void; // Cierre por overlay (conserva selección provisional)
}

export const SeleccionarBecariosModal = ({
  isOpen,
  becariosYaAsignados,
  onConfirmar,
  onCancelar,
  onClose,
}: SeleccionarBecariosModalProps) => {
  const [todosLosBecarios, setTodosLosBecarios] = useState<Becario[]>([]);
  const [seleccionProvisional, setSeleccionProvisional] = useState<Set<string>>(
    new Set()
  );
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar becarios al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const cargarBecarios = async () => {
      setCargando(true);
      setError(null);
      try {
        const becarios = await usuariosService.obtenerBecarios();
        setTodosLosBecarios(becarios);

        // Pre-marcar los becarios ya asignados
        const idsAsignados = new Set(becariosYaAsignados.map(b => b.id));
        setSeleccionProvisional(idsAsignados);
      } catch (err) {
        console.error('Error al cargar becarios:', err);
        setError(
          'Error al cargar la lista de becarios. Por favor, intenta de nuevo.'
        );
      } finally {
        setCargando(false);
      }
    };

    cargarBecarios();
  }, [isOpen, becariosYaAsignados]);

  // Filtrar becarios según búsqueda
  const becariosFiltrados = todosLosBecarios.filter(becario => {
    if (!busqueda.trim()) return true;

    const searchLower = busqueda.toLowerCase();
    const nombreCompleto =
      `${becario.nombre} ${becario.apellidos}`.toLowerCase();
    const email = becario.emailPersonal.toLowerCase();

    return nombreCompleto.includes(searchLower) || email.includes(searchLower);
  });

  // Toggle selección de un becario
  const toggleBecario = (becarioId: string) => {
    setSeleccionProvisional(prev => {
      const newSet = new Set(prev);
      if (newSet.has(becarioId)) {
        newSet.delete(becarioId);
      } else {
        newSet.add(becarioId);
      }
      return newSet;
    });
  };

  // Confirmar selección
  const handleConfirmar = () => {
    // Obtener los becarios correspondientes a los IDs seleccionados
    const becariosSeleccionados = todosLosBecarios.filter(b =>
      seleccionProvisional.has(b.id)
    );
    onConfirmar(becariosSeleccionados);
  };

  // Cancelar (restaurar al estado inicial)
  const handleCancelar = () => {
    // Restaurar a los becarios ya asignados
    const idsAsignados = new Set(becariosYaAsignados.map(b => b.id));
    setSeleccionProvisional(idsAsignados);
    setBusqueda('');
    onCancelar();
  };

  // Cerrar por overlay (conservar selección provisional)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Cabecera */}
        <div className={styles.header}>
          <h2 className={styles.title}>Seleccionar becarios</h2>
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
              <div className={styles.spinner}></div>
              <p>Cargando becarios...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!cargando && !error && becariosFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>
                {busqueda
                  ? `No se encontraron becarios que coincidan con "${busqueda}"`
                  : 'No hay becarios disponibles en el sistema'}
              </p>
            </div>
          )}

          {!cargando && !error && becariosFiltrados.length > 0 && (
            <div className={styles.checklist}>
              {becariosFiltrados.map(becario => (
                <label key={becario.id} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={seleccionProvisional.has(becario.id)}
                    onChange={() => toggleBecario(becario.id)}
                    className={styles.checkbox}
                  />
                  <div className={styles.becarioInfo}>
                    <div className={styles.becarioNombre}>
                      {becario.nombre} {becario.apellidos}
                    </div>
                    <div className={styles.becarioEmail}>
                      {becario.emailPersonal}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer con botones */}
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
