import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { normalizeRolUsuario } from '../../../shared/constants/domain.constants';
import type { RolUsuario } from '../../../shared/constants/domain.constants';
import { AccessDeniedModal } from '../../../shared/components/AccessDeniedModal';
import { getDefaultRouteByRole } from '../utils/getDefaultRouteByRole';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: RolUsuario[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRolUsuario(user.rol);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRolUsuario);

  if (!normalizedAllowedRoles.includes(userRole)) {
    return (
      <AccessDeniedModal
        onGoBack={() => navigate(getDefaultRouteByRole(userRole), { replace: true })}
      />
    );
  }

  return <>{children}</>;
}
