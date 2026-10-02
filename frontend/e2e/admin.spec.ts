import { expect, test } from '@playwright/test';
import { eliminarUsuarioE2EPorEmail } from './helpers/e2e-api';

const E2E_EMAIL = 'admin.e2e.playwright@pasp.test';

test.beforeEach(async ({ request }) => {
  // Dejamos un estado conocido aunque una ejecución anterior se interrumpiera.
  await eliminarUsuarioE2EPorEmail(request, E2E_EMAIL);
});

test.afterEach(async ({ request }) => {
  // El usuario temporal no debe permanecer en PASP_E2E_DB.
  await eliminarUsuarioE2EPorEmail(request, E2E_EMAIL);
});

test('un administrador crea, edita y deshabilita un usuario', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin.e2e@pasp-demo.test');
  await page.getByLabel('Contraseña').fill('Admin1234!');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Recorremos la misma navegación que utilizaría una persona administradora.
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page).toHaveURL(/\/admin\/nuevo-usuario$/);
  await page.getByRole('button', { name: /Administrador/ }).click();

  await page.getByLabel('Nombre').fill('E2E');
  await page.getByLabel('Apellidos').fill('Administrador');
  await page.getByLabel('Email interno').fill('admin.e2e@pasp-demo.test');
  await page.getByRole('button', { name: 'Crear usuario' }).click();

  // El email del seed provoca un 409 real; el formulario debe explicarlo y continuar abierto.
  await expect(page.getByRole('alert')).toContainText(
    'email introducido ya existe'
  );
  await expect(page).toHaveURL(/\/admin\/nuevo-usuario$/);

  await page.getByLabel('Email interno').fill(E2E_EMAIL);
  await page.getByRole('button', { name: 'Crear usuario' }).click();

  // El mensaje confirma que el backend aceptó y guardó el alta.
  await expect(page.getByRole('status')).toContainText('creado correctamente');
  await expect(page.getByRole('status')).toContainText(E2E_EMAIL);

  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Filtrar por email evita depender de la página concreta de la tabla.
  await page
    .getByLabel('Buscar usuarios por nombre, apellidos o email')
    .fill(E2E_EMAIL);
  const fila = page.getByRole('link', { name: 'Editar E2E Administrador' });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText(E2E_EMAIL);
  await expect(fila).toContainText('Administrador');
  await expect(fila).toContainText('Activo');

  // Entramos en la edición real y comprobamos que el cambio persiste al volver.
  await fila.click();
  await expect(page).toHaveURL(/\/admin\/usuario\/\d+\/editar$/);
  await page.getByLabel('Nombre').fill('E2E Editado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page
    .getByLabel('Buscar usuarios por nombre, apellidos o email')
    .fill(E2E_EMAIL);
  const filaEditada = page.getByRole('link', {
    name: 'Editar E2E Editado Administrador',
  });
  await expect(filaEditada).toBeVisible();
  await expect(filaEditada).toContainText('E2E Editado');

  // Deshabilitamos desde la ficha y verificamos el estado tras recargar el listado.
  await filaEditada.click();
  await page.getByRole('button', { name: 'Deshabilitar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Deshabilitar Usuario' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('status')).toContainText(
    'deshabilitado correctamente'
  );

  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page
    .getByLabel('Buscar usuarios por nombre, apellidos o email')
    .fill(E2E_EMAIL);
  await expect(
    page.getByRole('link', { name: 'Editar E2E Editado Administrador' })
  ).toContainText('Deshabilitado');
});
