import { expect, test } from '@playwright/test';

test('un administrador inicia sesión y llega a su panel', async ({ page }) => {
  await page.goto('/login');

  // Primero provocamos un 401 real y comprobamos que la pantalla sigue siendo útil.
  await page.getByLabel('Email').fill('admin.e2e@pasp-demo.test');
  const contrasena = page.getByRole('textbox', {
    name: 'Contraseña',
    exact: true,
  });
  await contrasena.fill('clave-incorrecta');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Credenciales inválidas'
  );
  await expect(page).toHaveURL(/\/login$/);

  // Utilizamos un usuario conocido creado por el seed de la base E2E.
  await page.getByLabel('Email').fill('admin.e2e@pasp-demo.test');
  await contrasena.fill('Admin1234!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // La URL y el título confirman que frontend, backend y base funcionan juntos.
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole('heading', { name: 'Panel de Administrador' }),
  ).toBeVisible();
});
