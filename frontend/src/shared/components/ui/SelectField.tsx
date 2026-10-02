import type { SelectHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  requiredLabel?: boolean;
}

export function SelectField({
  label,
  error,
  requiredLabel,
  id,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={styles.formField}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {requiredLabel && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.selectWrapper}>
        <select
          id={id}
          className={`${styles.select}${error ? ` ${styles.inputError}` : ''}`}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && (
        <p className={styles.errorMessage} role="alert">
          !  {error}
        </p>
      )}
    </div>
  );
}
