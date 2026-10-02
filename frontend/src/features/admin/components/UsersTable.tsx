import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { UsuarioAdmin } from '../services/usuariosService';
import { ROLES } from '../../../shared/constants/domain.constants';
import type { RolUsuario } from '../../../shared/constants/domain.constants';
import { Button, DataTable } from '../../../shared/components/ui';
import styles from '../../../shared/components/ui/ui.module.css';

interface UsersTableProps {
  usuarios: UsuarioAdmin[];
  isLoading: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ usuarios, isLoading }) => {
  const navigate = useNavigate();

  // La ordenación y paginación se manejan en AdminDashboard
  // Este componente solo renderiza el array que recibe

  // Función para obtener el badge de rol
  const getRolBadge = (rol: RolUsuario) => {
    switch (rol) {
      case ROLES.BECARIO:
        return (
          <span className={`${styles.badge} ${styles.badgeBlue}`}>Becario</span>
        );
      case ROLES.TUTOR_EMPRESA:
        return (
          <span className={`${styles.badge} ${styles.badgePurple}`}>
            Tutor de empresa
          </span>
        );
      case ROLES.ADMIN:
        return (
          <span className={`${styles.badge} ${styles.badgeOrange}`}>Admin</span>
        );
      case ROLES.TUTOR_ACADEMICO:
        return (
          <span className={`${styles.badge} ${styles.badgeGray}`}>
            Tutor académico
          </span>
        );
      default:
        return (
          <span className={`${styles.badge} ${styles.badgeGray}`}>{rol}</span>
        );
    }
  };

  // Función para obtener el texto de estado (sin badge)
  const getEstadoText = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  // Función para obtener el texto de primer acceso (sin badge ni emojis)
  const getPrimerAccesoText = (primerAcceso: boolean) => {
    return primerAcceso ? 'Pendiente' : 'Completado';
  };

  // Estado de carga
  if (isLoading) {
    return (
      <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Primer acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <span>Cargando usuarios...</span>
                </div>
              </td>
            </tr>
          </tbody>
      </DataTable>
    );
  }

  // Estado vacío
  if (usuarios.length === 0) {
    return (
      <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Primer acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                No hay usuarios registrados
              </td>
            </tr>
          </tbody>
      </DataTable>
    );
  }

  // Tabla con datos
  return (
    <DataTable>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Primer acceso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(usuario => (
            <tr key={usuario.idUsuario} className={styles.tableRow}>
              <td>{usuario.nombre}</td>
              <td className={styles.apellidosCell}>{usuario.apellidos}</td>
              <td className={styles.emailCell}>{usuario.email}</td>
              <td>{getRolBadge(usuario.rol)}</td>
              <td>{getEstadoText(usuario.activo)}</td>
              <td>{getPrimerAccesoText(usuario.primerAcceso)}</td>
              <td>
                {usuario.rol === ROLES.ADMIN ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(`/admin/usuario/${usuario.idUsuario}/editar`)
                    }
                    title="Ver detalles del usuario"
                    type="button"
                  >
                    Ver detalles
                  </Button>
                ) : usuario.rol === ROLES.TUTOR_ACADEMICO ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(`/admin/editar-tutor-academico/${usuario.idUsuario}`)
                    }
                    title="Ver detalles del Tutor académico"
                    type="button"
                  >
                    Ver detalles
                  </Button>
                ) : usuario.rol === ROLES.TUTOR_EMPRESA ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(
                        `/admin/editar-tutor-empresa/${usuario.idUsuario}`
                      )
                    }
                    title="Ver detalles del Tutor de empresa"
                    type="button"
                  >
                    Ver detalles
                  </Button>
                ) : usuario.rol === ROLES.BECARIO ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(`/admin/editar-becario/${usuario.idUsuario}`)
                    }
                    title="Ver y editar perfil del becario"
                    type="button"
                  >
                    Ver detalles
                  </Button>
                ) : (
                  <span className={styles.actionDisabled}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
    </DataTable>
  );
};

export default UsersTable;
