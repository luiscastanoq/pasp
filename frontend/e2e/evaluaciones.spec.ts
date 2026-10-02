import { expect, test } from '@playwright/test';
import {
  cambiarTutorEmpresaBecarioE2E,
  limpiarEvaluacionesE2E,
} from './helpers/e2e-database';

const TITULO = '[E2E] Evaluación de desempeño';
const DESCRIPCION = 'Evaluación temporal creada por el recorrido de Playwright.';

test.beforeEach(async () => {
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await limpiarEvaluacionesE2E();
});

test.afterEach(async () => {
  // Dejamos la base igual incluso si una comprobación del navegador falla.
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await limpiarEvaluacionesE2E();
});

test('un tutor crea una evaluación completa para su becario', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('tutor.principal.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Tutor123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/tutor$/);

  // El email identifica al becario sin depender de nombres que puedan repetirse.
  await page
    .getByRole('textbox', {
      name: 'Buscar becarios por nombre, apellidos o email',
    })
    .fill('becario.e2e@pasp-demo.test');
  await page
    .getByRole('row', { name: 'Ver detalles de Becario Ejemplo E2E' })
    .click();
  await page.getByRole('button', { name: 'Evaluar' }).click();

  await expect(page.getByText('Evaluaciones', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'EVALUAR', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Nueva Evaluación');

  await page.getByLabel('Título').fill(TITULO);
  await page.getByLabel('Descripción').fill(DESCRIPCION);

  // Marcamos las cinco competencias para comprobar el formulario completo.
  for (const selector of [
    '#eval-puntualidad',
    '#eval-calidad',
    '#eval-actitud',
    '#eval-autonomia',
    '#eval-comunicacion',
  ]) {
    await page
      .locator(selector)
      .getByRole('button', { name: 'Puntuación 4' })
      .click();
  }

  await expect(page.getByRole('dialog')).toContainText('4.00');

  // El backend debe detectar que el tutor ha dejado de estar asignado.
  await cambiarTutorEmpresaBecarioE2E('tutor.alternativo.e2e@pasp-demo.test');
  await page.getByRole('button', { name: 'Guardar evaluación' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'No tienes permisos para gestionar evaluaciones de este becario'
  );

  // El formulario conserva sus datos y permite reintentar al restaurar la relación.
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await page.getByRole('button', { name: 'Guardar evaluación' }).click();

  // La papelera pertenece al elemento recién creado y evita un selector ambiguo.
  await expect(page.getByLabel(`Eliminar ${TITULO}`)).toBeVisible();
  await expect(page.getByText(DESCRIPCION, { exact: true })).toBeVisible();
  await expect(page.getByText('4.0', { exact: true })).toBeVisible();
});
