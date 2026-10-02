import { expect, test } from '@playwright/test';

test('un tutor académico consulta su becario y sus evaluaciones en solo lectura', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('academico.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Academico123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/tutor-academico$/);

  await expect(
    page.getByRole('heading', { name: 'Panel de Tutor Académico' }),
  ).toBeVisible();

  // El conjunto E2E solo asigna al becario principal; la segunda becaria no debe aparecer.
  await expect(
    page.getByRole('button', { name: 'Becario Ejemplo E2E' }),
  ).toBeVisible();
  await expect(page.getByText('becaria.e2e@pasp-demo.test')).not.toBeVisible();

  await page
    .getByRole('button', { name: 'Becario Ejemplo E2E' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Becario Ejemplo E2E' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Asignar Tarea' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Modificar' })).not.toBeVisible();

  await page.getByRole('button', { name: 'Evaluaciones' }).click();
  await expect(page).toHaveURL(/\/tutor-academico\/becario\/\d+\/evaluaciones$/);
  await expect(
    page.getByRole('heading', { name: 'Evaluaciones registradas' }),
  ).toBeVisible();

  // La vista académica puede leer, pero nunca crear ni eliminar evaluaciones.
  await expect(page.getByRole('button', { name: 'EVALUAR', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: /^Eliminar / })).toHaveCount(0);
});
