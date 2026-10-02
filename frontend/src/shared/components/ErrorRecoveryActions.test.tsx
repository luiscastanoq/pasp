import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorRecoveryActions } from './ErrorRecoveryActions';

describe('ErrorRecoveryActions', () => {
  it('permite reintentar o reiniciar la sesión', async () => {
    const onRetry = vi.fn();
    const onResetSession = vi.fn();
    const user = userEvent.setup();

    render(
      <ErrorRecoveryActions
        hasRetried={false}
        onRetry={onRetry}
        onResetSession={onResetSession}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await user.click(screen.getByRole('button', { name: 'Reiniciar sesión' }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(onResetSession).toHaveBeenCalledOnce();
  });

  it('recomienda reiniciar la sesión después de un reintento fallido', () => {
    render(
      <ErrorRecoveryActions
        hasRetried={true}
        onRetry={vi.fn()}
        onResetSession={vi.fn()}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Si el error continúa, reinicia la sesión para volver a empezar.'
    );
  });
});
