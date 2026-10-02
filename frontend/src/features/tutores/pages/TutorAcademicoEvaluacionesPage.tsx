import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BecarioSummary } from '../../../types/becario';
import { Header } from '../../../shared/components/Header';
import { useAuth } from '../../auth/context/useAuth';
import {
  getEvaluacionesAcademicasByBecario,
  getMyBecariosAcademicos,
} from '../services/tutorService';
import { EvaluacionView } from '../components/evaluacion/EvaluacionView';
import styles from './TutorAcademicoBecarioPage.module.css';

export function TutorAcademicoEvaluacionesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [becarios, setBecarios] = useState<BecarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idBecario = id && !Number.isNaN(Number(id)) ? Number(id) : null;

  const becario = useMemo(
    () =>
      idBecario == null
        ? undefined
        : becarios.find(current => current.idBecario === idBecario),
    [becarios, idBecario]
  );

  const loadBecarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBecariosAcademicos();
      setBecarios(data);
    } catch (err) {
      console.error('Error al cargar el becario academico:', err);
      setError('Error al cargar la informacion del becario.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBecarios();
  }, [loadBecarios]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <div className={styles.loading}>Cargando evaluaciones...</div>
      </div>
    );
  }

  if (error || !becario) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <div className={styles.error}>
          <div className={styles.errorCard}>
            <h1>Evaluaciones no disponibles</h1>
            <p>
              {error ??
                'No se ha encontrado este becario entre tus asignaciones academicas.'}
            </p>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate('/tutor-academico')}
            >
              Volver al panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EvaluacionView
      becario={becario}
      onBack={() => navigate(`/tutor-academico/becario/${becario.idBecario}`)}
      readOnly
      roleLabel="Tutor académico"
      getEvaluaciones={getEvaluacionesAcademicasByBecario}
    />
  );
}
