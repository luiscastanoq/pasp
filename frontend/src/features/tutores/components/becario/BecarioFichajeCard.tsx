import { useState, useEffect } from 'react';
import { getFichajesByBecario } from '../../services/tutorService';
import type { FichajeHistorialEntry } from '../../../../types/fichaje';
import { BecarioFichajeHistorial } from './BecarioFichajeHistorial';
import styles from './BecarioFichajeCard.module.css';

interface BecarioFichajeCardProps {
  idBecario: number;
  nombreBecario: string;
}

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
  return (
    new Date(iso).toISOString().slice(0, 10) ===
    new Date().toISOString().slice(0, 10)
  );
};

const formatHoras = (horas: number | string | null): string => {
  if (horas === null || horas === undefined) return '—';
  const num = Number(horas);
  if (isNaN(num)) return '—';
  return `${num.toFixed(1)} h`;
};

export const BecarioFichajeCard = ({
  idBecario,
  nombreBecario,
}: BecarioFichajeCardProps) => {
  const [showHistorial, setShowHistorial] = useState(false);
  const [ultimosFichajes, setUltimosFichajes] = useState<
    FichajeHistorialEntry[]
  >([]);
  const [loadingUltimos, setLoadingUltimos] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      try {
        const response = await getFichajesByBecario(idBecario, {
          page: 1,
          limit: 4,
        });
        if (!cancelled && response.success) {
          setUltimosFichajes(response.data);
        }
      } catch {
        // fallo silencioso
      } finally {
        if (!cancelled) setLoadingUltimos(false);
      }
    };
    cargar();
    return () => {
      cancelled = true;
    };
  }, [idBecario]);

  return (
    <>
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

        {loadingUltimos ? (
          <div className={styles.miniTableLoading}>Cargando registros...</div>
        ) : ultimosFichajes.length === 0 ? (
          <div className={styles.miniTableEmpty}>
            No hay fichajes registrados aun
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

      <BecarioFichajeHistorial
        isOpen={showHistorial}
        onClose={() => setShowHistorial(false)}
        idBecario={idBecario}
        nombreBecario={nombreBecario}
      />
    </>
  );
};
