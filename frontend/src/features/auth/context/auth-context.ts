import { createContext } from 'react';
import type { User, AccessCredentials } from '../services/authService';

export type LoginStatus = 'idle' | 'authenticating' | 'waking-database';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginStatus: LoginStatus;
  showTokenExpired: boolean;
  login: (credentials: AccessCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  handleTokenExpired: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
