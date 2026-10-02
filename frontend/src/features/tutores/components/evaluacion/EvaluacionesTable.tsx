import { useState } from 'react';
import type { Evaluacion } from '../../../../types/evaluacion';
import styles from './EvaluacionesTable.module.css';

interface EvaluacionesTableProps {
  evaluaciones: Evaluacion[];
  onRowClick?: (evaluacion: Evaluacion) => void;
}

const PAGE_SIZE = 7;
const DESCRIPCION_MAX_LENGTH = 80;

const truncar = (texto: string | null, max: number): string => {
  if (!texto) return '—';
  return texto.length > max ? `${texto.slice(0, max)}...` : texto;
};

const formatFecha = (fechaStr: string): string => {
  return new Date(fechaStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EvaluacionesTable = ({
  evaluaciones,
  onRowClick,
}: EvaluacionesTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (evaluaciones.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>
          Aún no hay evaluaciones registradas para este becario.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(evaluaciones.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedEvaluaciones = evaluaciones.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <tbody>
          {paginatedEvaluaciones.map(evaluacion => (
            <tr
              key={evaluacion.idEvaluacion}
              className={`${styles.row}${onRowClick ? ` ${styles.rowClickable}` : ''}`}
              onClick={() => onRowClick?.(evaluacion)}
            >
              <td className={styles.cellFecha}>
                {formatFecha(evaluacion.fechaEvaluacion)}
              </td>
              <td className={styles.cellTitulo}>{evaluacion.titulo}</td>
              <td className={styles.cellDescripcion}>
                {truncar(evaluacion.comentarios, DESCRIPCION_MAX_LENGTH)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        {/* Flecha izquierda */}
        <button
          className={styles.pageArrow}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {/* Números de página */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`${styles.pageNumber}${page === currentPage ? ` ${styles.pageNumberActive}` : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Flecha derecha */}
        <button
          className={styles.pageArrow}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </div>
  );
};
