import { useEffect, useRef, useState } from 'react';
import styles from './DemoNotice.module.css';

export function DemoNotice() {
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const showNotice = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      dialog.current?.showModal();
    };
    window.addEventListener('pasp:demo-write-blocked', showNotice);
    return () =>
      window.removeEventListener('pasp:demo-write-blocked', showNotice);
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="demo-notice-title"
      aria-describedby="demo-notice-message"
    >
      <h2 id="demo-notice-title">Versión de demostración</h2>
      <p id="demo-notice-message">{message}</p>
      <button type="button" onClick={() => dialog.current?.close()}>
        Entendido
      </button>
    </dialog>
  );
}
