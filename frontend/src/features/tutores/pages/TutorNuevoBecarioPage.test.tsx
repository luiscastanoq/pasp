import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../auth/context/useAuth';
import { TIPO_TUTORIA } from '../../../shared/constants/domain.constants';
import { TutorNuevoBecarioPage } from './TutorNuevoBecarioPage';

vi.mock('../../auth/context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/tutorService', () => ({
  createBecarioAsignado: vi.fn(),
  getTutoresDisponibles: vi.fn(),
}));
vi.mock('../../../shared/components/Header', () => ({
  Header: () => <header>Cabecera del tutor</header>,
}));
vi.mock('../../admin/components/SeleccionarTutoresModal', () => ({
  SeleccionarTutoresModal: () => null,
}));
vi.mock('../../admin/components/usuario-form/DatosBasicosUsuarioForm', () => ({
  DatosBasicosUsuarioForm: () => <form id="nuevo-usuario-form" />,
}));
vi.mock('../../admin/components/usuario-form/DatosBecarioForm', () => ({
  DatosBecarioForm: () => <div>Datos del becario</div>,
}));
vi.mock('../../admin/components/usuario-form/FeedbackMessages', () => ({
  FeedbackMessages: () => null,
}));

describe('TutorNuevoBecarioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        idUsuario: 7,
        nombre: 'Ana',
        apellidos: 'Tutor',
        email: 'ana.tutor@pasp.com',
      },
      logout: vi.fn(),
    } as never);
  });

  it('permite cambiar a secundario el tipo del tutor creador sin desasignarlo', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TutorNuevoBecarioPage />
      </MemoryRouter>
    );

    const tipoTutoria = screen.getByRole('combobox', {
      name: 'Tipo de tutoría de Ana Tutor',
    });

    expect(tipoTutoria).toBeEnabled();
    expect(tipoTutoria).toHaveValue(TIPO_TUTORIA.EMPRESA_PRINCIPAL);

    await user.selectOptions(tipoTutoria, TIPO_TUTORIA.EMPRESA_SECUNDARIO);

    expect(tipoTutoria).toHaveValue(TIPO_TUTORIA.EMPRESA_SECUNDARIO);

    const tutorActual = screen.getByRole('button', { name: 'yo' });
    expect(tutorActual).toHaveAttribute(
      'title',
      'Tu propia tutoría no se puede desasignar desde aquí'
    );

    await user.click(tutorActual);

    expect(tipoTutoria).toBeInTheDocument();
  });
});
