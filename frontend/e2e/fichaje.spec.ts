import { expect, test } from '@playwright/test';
import { limpiarFichajesE2E } from './helpers/e2e-database';

test.setTimeout(45_000);

test.beforeEach(async () => {
  // El becario comienza el recorrido sin ningún fichaje anterior.
  await limpiarFichajesE2E();
});

test.afterEach(async () => {
  // También limpiamos si una aserción falla después de registrar la entrada.
  await limpiarFichajesE2E();
});

test('un becario recibe conflictos reales y completa su jornada', async ({
  context,
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('becario.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Becario123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/becario$/);

  await page.getByRole('button', { name: 'Fichar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Fichaje', exact: true }),
  ).toBeVisible();

  // Al comenzar el día solo debe estar disponible la entrada.
  const entrada = page.getByRole('button', { name: 'Fichar Entrada' });
  const salida = page.getByRole('button', { name: 'Fichar Salida' });
  await expect(entrada).toBeEnabled();
  await expect(salida).toBeDisabled();

  // Una segunda pestaña conserva el estado anterior para reproducir un conflicto real.
  const paginaDesactualizada = await context.newPage();
  // Las pestañas comparten la sesión, como ocurriría en un navegador normal.
  await paginaDesactualizada.goto('/becario');
  await expect(paginaDesactualizada).toHaveURL(/\/becario$/);
  await paginaDesactualizada.getByRole('button', { name: 'Fichar', exact: true }).click();
  await expect(
    paginaDesactualizada.getByRole('button', { name: 'Fichar Entrada' })
  ).toBeEnabled();

  await entrada.click();
  await expect(page.getByText('Entrada registrada correctamente')).toBeVisible();
  await expect(salida).toBeEnabled();

  await paginaDesactualizada
    .getByRole('button', { name: 'Fichar Entrada' })
    .click();
  await expect(paginaDesactualizada.getByRole('alert')).toContainText(
    'Ya has fichado la entrada hoy'
  );
  await paginaDesactualizada.close();

  // Ocho horas es un valor válido dentro del rango permitido de 0.5 a 16.
  await page.getByLabel('Horas a imputar').fill('8');
  await salida.click();
  await expect(page.getByText('Salida registrada correctamente')).toBeVisible();

  // Tras cerrar la jornada, el modal desaparece y el resumen muestra el registro.
  await expect(
    page.getByRole('heading', { name: 'Fichaje', exact: true }),
  ).not.toBeVisible();
  await expect(page.getByText('Sin fichaje activo')).toBeVisible();

  const ultimosFichajes = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Últimos Fichajes' }) });
  await expect(ultimosFichajes).toContainText('8h');
});
