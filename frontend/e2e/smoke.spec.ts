import { expect, test } from '@playwright/test';

test('muestra el formulario de inicio de sesión', async ({ page }) => {
  // Abrimos una ruta real de la aplicación en Chromium.
  await page.goto('/login');

  // Comprobamos lo que una persona necesita ver para poder iniciar sesión.
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar Sesión' }),
  ).toBeVisible();
});
