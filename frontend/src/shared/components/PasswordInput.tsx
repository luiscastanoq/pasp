import { useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';

import styles from './PasswordInput.module.css';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({
  className = '',
  disabled,
  value,
  defaultValue,
  onChange,
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasUncontrolledValue, setHasUncontrolledValue] = useState(
    () => String(defaultValue ?? '').length > 0
  );
  const hasValue =
    value !== undefined ? String(value).length > 0 : hasUncontrolledValue;
  const isPasswordVisible = hasValue && isVisible;
  const actionLabel = isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHasValue = event.currentTarget.value.length > 0;

    if (value === undefined) {
      setHasUncontrolledValue(nextHasValue);
    }
    if (!hasValue || !nextHasValue) {
      setIsVisible(false);
    }
    onChange?.(event);
  };

  return (
    <div className={styles.passwordField}>
      <input
        {...inputProps}
        type={isPasswordVisible ? 'text' : 'password'}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={`${className} ${hasValue ? styles.inputWithAction : ''}`.trim()}
        disabled={disabled}
      />
      {hasValue ? (
        <button
          type="button"
          className={styles.visibilityButton}
          onClick={() => setIsVisible(visible => !visible)}
          aria-label={actionLabel}
          aria-pressed={isPasswordVisible}
          title={actionLabel}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
            <circle cx="12" cy="12" r="2.25" />
            {isPasswordVisible ? <path d="M5 5l14 14" /> : null}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
