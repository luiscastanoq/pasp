import type { ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <HashRouter>
      <AuthProvider>{children}</AuthProvider>
    </HashRouter>
  );
}