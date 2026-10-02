import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangePassword } from './ChangePassword';
import { TokenExpiredModal } from '../../../shared/components/TokenExpiredModal';
import { useAuth } from '../context/useAuth';
import { getDefaultRouteByRole } from '../utils/getDefaultRouteByRole';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, updateUser, logout, showTokenExpired, handleTokenExpired } =
    useAuth();
  const navigate = useNavigate();

  const handlePasswordChangeSuccess = () => {
    if (!user) {
      return;
    }

    updateUser({ ...user, primerAcceso: false });
    navigate(getDefaultRouteByRole(user.rol), { replace: true });
  };

  const handlePasswordChangeCancel = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (showTokenExpired) {
    return <TokenExpiredModal onRetry={handleTokenExpired} />;
  }

  if (user?.primerAcceso) {
    return (
      <ChangePassword
        isFirstAccess={true}
        onSuccess={handlePasswordChangeSuccess}
        onCancel={handlePasswordChangeCancel}
      />
    );
  }

  return <>{children}</>;
}
