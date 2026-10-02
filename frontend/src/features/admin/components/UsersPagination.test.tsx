import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import UsersPagination from './UsersPagination';

describe('UsersPagination', () => {
  it('bloquea retroceder desde la primera pagina', () => {
    // El control no debe pedir una pagina cero que el backend no entiende.
    render(
      <UsersPagination totalItems={30} currentPage={1} pageSize={10} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /P.gina anterior/ })).toBeDisabled();
  });

  it('avanza y permite elegir una pagina concreta', async () => {
    // Comprobamos las dos formas habituales de moverse por un listado largo.
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <UsersPagination totalItems={100} currentPage={3} pageSize={10} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole('button', { name: /P.gina siguiente/ }));
    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
  });
});
