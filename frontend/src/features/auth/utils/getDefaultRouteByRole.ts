import { ROLES, normalizeRolUsuario } from '../../../shared/constants/domain.constants';
import type { RolUsuario } from '../../../shared/constants/domain.constants';

export function getDefaultRouteByRole(role: RolUsuario): string {
  const normalizedRole = normalizeRolUsuario(role);

  if (normalizedRole === ROLES.ADMIN) {
    return '/admin';
  }

  if (normalizedRole === ROLES.TUTOR_EMPRESA) {
    return '/tutor';
  }

  if (normalizedRole === ROLES.TUTOR_ACADEMICO) {
    return '/tutor-academico';
  }

  if (normalizedRole === ROLES.BECARIO) {
    return '/becario';
  }

  return '/otros';
}
