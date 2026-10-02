import type { ReactNode } from 'react';
import styles from './ui.module.css';

interface DataTableProps {
  children: ReactNode;
}

export function DataTable({ children }: DataTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>{children}</table>
    </div>
  );
}
