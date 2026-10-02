import { expect, test } from '@playwright/test';

test('un becario no puede abrir el panel de administración', async ({ page }) => {
  await page.goto('/login');

  // Iniciamos sesión con un becario estable creado por el seed E2E.
  await page.getByLabel('Email').fill('becario.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Becario123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/becario$/);

  // Simulamos que alguien escribe manualmente una ruta de otro rol.
  await page.goto('/admin');

  // La aplicación bloquea el acceso devolviendo al becario a su propio panel.
  await expect(page).toHaveURL(/\/becario$/);
  await expect(
    page.getByRole('heading', { name: 'Becario Ejemplo E2E' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Panel de Administrador' }),
  ).not.toBeVisible();
});
