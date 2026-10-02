import React from 'react';
import styles from './UsersTableHeader.module.css';

interface UsersTableHeaderProps {
  onAddUser?: () => void;
}

const UsersTableHeader: React.FC<UsersTableHeaderProps> = ({ onAddUser }) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>Usuarios</h2>
        <p className={styles.subtitle}>Todos los usuarios del sistema</p>
      </div>
      <button
        className={styles.addButton}
        onClick={onAddUser}
        title="Añadir nuevo usuario"
        type="button"
      >
        +
      </button>
    </div>
  );
};

export default UsersTableHeader;
