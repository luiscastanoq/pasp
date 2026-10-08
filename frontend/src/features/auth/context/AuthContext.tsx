/**
 * Context de autenticación
 * Maneja el estado global del usuario autenticado
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, AccessCredentials } from '../services/authService';
import {
  setUser as saveUserToStorage,
  setAuthErrorHandler,
  isTokenExpiredOrInvalid,
} from '../../../shared/api/api';
import { ApiError } from '../../../shared/api/api';
import { AuthContext } from './auth-context';
import type { AuthContextType, LoginStatus } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showTokenExpired, setShowTokenExpired] = useState(false);

  // Configurar el handler de errores de autenticación
  useEffect(() => {
    setAuthErrorHandler(() => {
      authService.logout();

      // Mostrar modal de token expirado
      setShowTokenExpired(true);

      // Limpiar usuario del estado
      setUser(null);
      setError(null);
    });
  }, []);

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getToken();
      const storedUser = authService.getStoredUser();

      if (token && isTokenExpiredOrInvalid(token)) {
        authService.logout();
        setUser(null);
        setShowTokenExpired(true);
        setIsLoading(false);
        return;
      }

      if (token && storedUser) {
        // Restaurar el usuario durante la sesión de la pestaña
        setUser(storedUser);
        setIsLoading(false);
      } else {
        // Si no hay token o usuario, limpiar todo
        if (!token || !storedUser) {
          authService.logout(); // Esto limpiará el usuario también
        }
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: AccessCredentials) => {
    try {
      setIsLoading(true);
      setLoginStatus('authenticating');
      setError(null);

      const response = await authService.login(credentials, {
        onDatabaseWaking: () => {
          setLoginStatus('waking-database');
        },
        onDatabaseReady: () => {
          setLoginStatus('authenticating');
        },
      });

      if (response.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión');
      }
      throw err;
    } finally {
      setIsLoading(false);
      setLoginStatus('idle');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
    setShowTokenExpired(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);

    // También actualizar el almacenamiento de la sesión
    if (authService.getToken()) {
      saveUserToStorage(updatedUser);
    }
  };

  const handleTokenExpired = () => {
    // Limpiar todo y ocultar el modal
    authService.logout();
    setUser(null);
    setShowTokenExpired(false);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginStatus,
    showTokenExpired,
    login,
    logout,
    updateUser,
    handleTokenExpired,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
