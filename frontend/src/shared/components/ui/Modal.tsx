import type { ReactNode } from 'react';
import styles from './ui.module.css';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
