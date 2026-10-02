import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDefaultRouteByRole } from '../utils/getDefaultRouteByRole';

export function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteByRole(user.rol)} replace />;
}
