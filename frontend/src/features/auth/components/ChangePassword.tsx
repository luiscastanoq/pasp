/**
 * Componente de Cambio de Contraseña
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { authService } from '../services/authService';
import type { ChangePasswordRequest } from '../services/authService';
import { ApiError } from '../../../shared/api/api';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import styles from './ChangePassword.module.css';

interface ChangePasswordProps {
  isFirstAccess?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ChangePassword({
  isFirstAccess = false,
  onSuccess,
  onCancel,
}: ChangePasswordProps) {
  const [passwords, setPasswords] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Validar requisitos de la contraseña
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validar nueva contraseña
    const passwordError = validatePassword(passwords.newPassword);
    if (passwordError) {
      setValidationErrors({ newPassword: passwordError });
      return;
    }

    // Validar que las contraseñas coincidan
    if (passwords.newPassword !== confirmPassword) {
      setValidationErrors({
        confirmPassword: 'Las contraseñas no coinciden',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(passwords);
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Error al cambiar la contraseña';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (
    field: keyof ChangePasswordRequest,
    value: string
  ) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar errores cuando el usuario empiece a escribir
    if (field === 'newPassword' && validationErrors.newPassword) {
      setValidationErrors(prev => ({ ...prev, newPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Limpiar error de confirmación cuando el usuario empiece a escribir
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isFirstAccess && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div>
              <strong>Primer acceso detectado</strong>
              <p>
                Por seguridad, debes cambiar tu contraseña antes de continuar.
              </p>
            </div>
          </div>
        )}

        <div className={styles.logoContainer}>
          <img
            src={`${import.meta.env.BASE_URL}pasp-logo.svg`}
            alt="PASP"
            className={styles.logo}
          />
        </div>

        <h2 className={styles.title}>
          {isFirstAccess
            ? 'Cambio de Contraseña Obligatorio'
            : 'Cambiar Contraseña'}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>
              Contraseña Actual
            </label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={e =>
                handlePasswordChange('currentPassword', e.target.value)
              }
              placeholder="Ingresa tu contraseña actual"
              required
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              Nueva Contraseña
            </label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={e =>
                handlePasswordChange('newPassword', e.target.value)
              }
              placeholder="Ingresa tu nueva contraseña"
              required
              className={`${styles.input} ${validationErrors.newPassword ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {validationErrors.newPassword && (
              <div className={styles.fieldError}>
                {validationErrors.newPassword}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar Nueva Contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => handleConfirmPasswordChange(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              required
              className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <div className={styles.fieldError}>
                {validationErrors.confirmPassword}
              </div>
            )}
          </div>

          <div className={styles.requirements}>
            <p className={styles.requirementsTitle}>
              <strong>Requisitos de la contraseña:</strong>
            </p>
            <ul className={styles.requirementsList}>
              <li
                className={
                  passwords.newPassword.length >= 8 ? styles.valid : ''
                }
              >
                Mínimo 8 caracteres
              </li>
              <li
                className={
                  /[A-Z]/.test(passwords.newPassword) ? styles.valid : ''
                }
              >
                Al menos una letra mayúscula
              </li>
              <li
                className={
                  /[a-z]/.test(passwords.newPassword) ? styles.valid : ''
                }
              >
                Al menos una letra minúscula
              </li>
              <li
                className={
                  /[0-9]/.test(passwords.newPassword) ? styles.valid : ''
                }
              >
                Al menos un número
              </li>
              <li
                className={
                  /[!@#$%^&*]/.test(passwords.newPassword) ? styles.valid : ''
                }
              >
                Al menos un carácter especial (!@#$%^&*)
              </li>
            </ul>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className={styles.cancelButton}
              >
                {isFirstAccess ? 'Volver al login' : 'Cancelar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
