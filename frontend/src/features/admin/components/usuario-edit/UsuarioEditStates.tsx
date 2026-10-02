import { Header } from '../../../../shared/components/Header';
import type { FeedbackState } from './types';
import pageStyles from '../../styles/adminPage.module.css';
import uiStyles from '../../../../shared/components/ui/ui.module.css';

interface BaseStateProps {
  nombre?: string;
  apellidos?: string;
  onLogout: () => void;
}

export function UsuarioEditLoadingState({
  nombre,
  apellidos,
  onLogout,
}: BaseStateProps) {
  return (
    <div className={pageStyles.container}>
      <Header
        nombre={nombre}
        apellidos={apellidos}
        rolLabel="Administrador"
        onLogout={onLogout}
      />
      <main className={pageStyles.main}>
        <div className={uiStyles.loadingContainer}>
          <div className={uiStyles.spinner}></div>
          <p>Cargando datos del usuario...</p>
        </div>
      </main>
    </div>
  );
}

interface ErrorStateProps extends BaseStateProps {
  feedback: FeedbackState;
  onBack: () => void;
}

export function UsuarioEditErrorState({
  nombre,
  apellidos,
  onLogout,
  feedback,
  onBack,
}: ErrorStateProps) {
  return (
    <div className={pageStyles.container}>
      <Header
        nombre={nombre}
        apellidos={apellidos}
        rolLabel="Administrador"
        onLogout={onLogout}
      />
      <main className={pageStyles.main}>
        <h1 className={pageStyles.pageTitle}>Error</h1>
        {feedback?.type === 'error' && (
          <div className={uiStyles.bannerError} role="alert">
            <span className={uiStyles.bannerIcon}>! </span>
            <span className={uiStyles.bannerText}>{feedback.message}</span>
          </div>
        )}
        <div className={uiStyles.cardFooter}>
          <button onClick={onBack} className={uiStyles.cancelButton}>
            Volver al Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
