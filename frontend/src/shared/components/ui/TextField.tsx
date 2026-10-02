import type { InputHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  requiredLabel?: boolean;
}

export function TextField({ label, error, requiredLabel, id, ...props }: TextFieldProps) {
  return (
    <div className={styles.formField}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {requiredLabel && <span className={styles.required}>*</span>}
      </label>
      <input
        id={id}
        className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className={styles.errorMessage} role="alert">
          !  {error}
        </p>
      )}
    </div>
  );
}
