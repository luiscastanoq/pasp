import { expect, test } from '@playwright/test';
import {
  cambiarTutorEmpresaBecarioE2E,
  limpiarTareasE2E,
} from './helpers/e2e-database';

const TAREA_E2E = '[E2E] Preparar prueba de tareas';

test.beforeEach(async () => {
  // Restauramos primero la relación por si una ejecución anterior se interrumpió.
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await limpiarTareasE2E();
});

test.afterEach(async () => {
  // El historial asociado se elimina en cascada junto con la tarea temporal.
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await limpiarTareasE2E();
});

test('tutor y becario comparten el estado y el historial de una tarea', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('tutor.principal.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Tutor123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/tutor$/);

  // Localizamos al becario por su email único para evitar problemas con acentos.
  await page
    .getByRole('textbox', {
      name: 'Buscar becarios por nombre, apellidos o email',
    })
    .fill('becario.e2e@pasp-demo.test');
  await page
    .getByRole('row', { name: 'Ver detalles de Becario Ejemplo E2E' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Becario Ejemplo E2E' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Asignar Tarea' }).click();
  await expect(
    page.getByRole('heading', { name: 'Crear Nueva Tarea' }),
  ).toBeVisible();

  // Las fechas no se tocan: el formulario ya propone hoy como fecha de inicio.
  await page
    .getByPlaceholder('Ej: Implementar módulo de autenticación')
    .fill(TAREA_E2E);
  await page
    .getByPlaceholder('Descripción detallada de la tarea...')
    .fill('Tarea temporal creada por el recorrido de Playwright.');

  // Simulamos que la asignación cambia mientras el formulario permanece abierto.
  await cambiarTutorEmpresaBecarioE2E('tutor.alternativo.e2e@pasp-demo.test');
  await page.getByRole('button', { name: 'Crear Tarea' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'No tienes permisos para gestionar tareas de este becario'
  );

  // Al restaurar el permiso, los mismos datos deben poder enviarse sin reabrir el modal.
  await cambiarTutorEmpresaBecarioE2E('tutor.principal.e2e@pasp-demo.test');
  await page.getByRole('button', { name: 'Crear Tarea' }).click();

  await expect(
    page.getByRole('heading', { name: TAREA_E2E, exact: true }),
  ).toBeVisible();

  // Cambiar el estado comprueba también la escritura del historial de la tarea.
  const estado = page.getByRole('button', {
    name: `Cambiar estado de ${TAREA_E2E}`,
    exact: true,
  });
  await expect(estado).toContainText('Pendiente');
  await estado.click();
  await page.getByRole('menuitem', { name: 'En Progreso', exact: true }).click();
  await expect(estado).toContainText('En Progreso');

  // Cambiamos de rol para comprobar la mitad del recorrido que antes faltaba.
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill('becario.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Becario123!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/becario$/);

  // Abrir la tarea debe solicitar el historial mediante la API del becario.
  await page.getByRole('heading', { name: TAREA_E2E, exact: true }).click();
  const historial = page
    .getByRole('heading', { name: 'Historial de cambios' })
    .locator('..');
  await expect(historial).toBeVisible();
  await expect(historial.getByText('Pendiente', { exact: true })).toBeVisible();
  await expect(
    historial.getByText('En Progreso', { exact: true }),
  ).toBeVisible();
});
