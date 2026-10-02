import { ROL_OPTIONS } from './types';
import { ROLES } from '../../../../shared/constants/domain.constants';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface RoleSelectorProps {
  value: string;
  onChange: (rol: string) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roleHints: Record<string, string> = {
    [ROLES.BECARIO]: 'Prácticas, formación y tutores',
    [ROLES.TUTOR_EMPRESA]: 'Tutoría de empresa',
    [ROLES.TUTOR_ACADEMICO]: 'Seguimiento académico',
    [ROLES.ADMIN]: 'Gestión del sistema',
  };

  const roleIconName = (rol: string) => {
    if (rol === ROLES.BECARIO) return 'school';
    if (rol === ROLES.ADMIN) return 'badge';
    return 'group';
  };

  return (
    <div className={styles.roleSelectorGrid}>
      {ROL_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          className={`${styles.roleOption} ${
            value === option.value ? styles.roleOptionActive : ''
          }`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          <span className={styles.roleIcon}>
            <UsuarioEditIcon name={roleIconName(option.value)} />
          </span>
          <span className={styles.roleCopy}>
            <span className={styles.roleName}>{option.label}</span>
            <span className={styles.roleHint}>{roleHints[option.value]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
