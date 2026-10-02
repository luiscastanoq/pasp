import { useState, useEffect } from 'react';
import type {
  FichajeActivo,
  FichajeHistorialEntry,
} from '../../../../../types/fichaje';
import { fichajeService } from '../../../../fichajes/services/fichajeService';
import { getToken } from '../../../../../shared/api/api';
import { FichajeHistorial } from './FichajeHistorial';
import styles from './FichajeCard.module.css';

interface FichajeCardProps {
  fichajeActivo: FichajeActivo | null;
  loadingFichaje: boolean;
  onOpenFichajeModal: () => void;
  /** Incrementar este valor desde el padre para forzar la recarga de la mini-tabla */
  refreshKey?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatHora = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFecha = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const esHoy = (iso: string): boolean => {
  const fechaFichaje = new Date(iso).toISOString().slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  return fechaFichaje === hoy;
};

const formatHoras = (horas: number | string | null): string => {
  if (horas === null || horas === undefined) return '—';
  const num = Number(horas);
  if (isNaN(num)) return '—';
  return `${num.toFixed(1)} h`;
};

// ─── Componente ─────────────────────────────────────────────────────────────

export const FichajeCard = ({
  loadingFichaje,
  onOpenFichajeModal,
  refreshKey = 0,
}: FichajeCardProps) => {
  const [showHistorial, setShowHistorial] = useState(false);
  const [ultimosFichajes, setUltimosFichajes] = useState<
    FichajeHistorialEntry[]
  >([]);
  const [loadingUltimos, setLoadingUltimos] = useState(true);

  useEffect(() => {
    // Guardar referencia para evitar actualizar estado si el componente se desmonta
    let cancelled = false;

    const cargarUltimosFichajes = async () => {
      // Solo hacer la llamada si hay token disponible
      if (!getToken()) {
        setLoadingUltimos(false);
        return;
      }

      try {
        const response = await fichajeService.getHistorialFichajes({
          page: 1,
          limit: 4,
        });
        if (!cancelled && response.success) {
          setUltimosFichajes(response.data.fichajes);
        }
      } catch {
        // Fallo silencioso: la mini-tabla queda vacía, sin romper la sesión
      } finally {
        if (!cancelled) setLoadingUltimos(false);
      }
    };

    cargarUltimosFichajes();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]); // Se re-ejecuta cada vez que el padre incrementa refreshKey

  return (
    <>
      <div className={styles.fichajeCard}>
        {/* Botón principal de fichaje */}
        <div className={styles.fichajeButtonWrapper}>
          <button
            onClick={onOpenFichajeModal}
            disabled={loadingFichaje}
            className={styles.fichajeButtonMain}
          >
            {loadingFichaje ? 'Cargando...' : 'Fichar'}
          </button>
        </div>

        {/* Sección de últimos fichajes */}
        <div className={styles.fichajeHistorial}>
          <div className={styles.fichajeHistorialHeader}>
            <h4 className={styles.fichajeHistorialTitle}>Últimos Fichajes</h4>
            <button
              onClick={() => setShowHistorial(true)}
              className={styles.verHistorialButton}
            >
              Ver historial
            </button>
          </div>

          {/* Mini-tabla de últimos 4 fichajes */}
          {loadingUltimos ? (
            <div className={styles.miniTableLoading}>Cargando registros...</div>
          ) : ultimosFichajes.length === 0 ? (
            <div className={styles.miniTableEmpty}>
              No hay fichajes registrados aún
            </div>
          ) : (
            <div className={styles.miniTableWrapper}>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Imputadas</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosFichajes.map(fichaje => (
                    <tr key={fichaje.idFichaje}>
                      <td>
                        <span className={styles.fechaCell}>
                          {esHoy(fichaje.fecha) && (
                            <span
                              className={styles.hoyDot}
                              title="Fichaje de hoy"
                            />
                          )}
                          {formatFecha(fichaje.fecha)}
                        </span>
                      </td>
                      <td>{formatHora(fichaje.horaEntrada)}</td>
                      <td>{formatHora(fichaje.horaSalida)}</td>
                      <td>{formatHoras(fichaje.horasImputadas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FichajeHistorial
        isOpen={showHistorial}
        onClose={() => setShowHistorial(false)}
      />
    </>
  );
};
