import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/styles/tokens.css';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './app/providers';
import { installDeploymentRecovery } from './shared/utils/deploymentRecovery';

installDeploymentRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
        <App />
    </AppProviders>
  </StrictMode>
);
