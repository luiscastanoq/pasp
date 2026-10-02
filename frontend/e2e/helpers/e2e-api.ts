import { expect, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://127.0.0.1:3002/api/v1';
const ADMIN_EMAIL = 'admin.e2e@pasp-demo.test';
const ADMIN_PASSWORD = 'Admin1234!';

type LoginResponse = {
  data: { token: string };
};

type UsuarioResumen = {
  idUsuario: number;
  email: string;
};

type UsuariosResponse = {
  data: { usuarios: UsuarioResumen[] };
};

async function obtenerTokenAdmin(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  // Si no podemos autenticarnos, no es seguro intentar limpiar datos.
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as LoginResponse;
  return body.data.token;
}

export async function eliminarUsuarioE2EPorEmail(
  request: APIRequestContext,
  email: string,
): Promise<void> {
  const token = await obtenerTokenAdmin(request);
  const headers = { Authorization: `Bearer ${token}` };
  const listado = await request.get(`${API_URL}/usuarios`, { headers });

  expect(listado.ok()).toBeTruthy();
  const body = (await listado.json()) as UsuariosResponse;

  // La igualdad exacta evita borrar por accidente usuarios que no son del test.
  const usuario = body.data.usuarios.find(
    item => item.email.toLowerCase() === email.toLowerCase(),
  );

  if (!usuario) return;

  const eliminacion = await request.delete(
    `${API_URL}/usuarios/${usuario.idUsuario}`,
    { headers },
  );
  expect(eliminacion.ok()).toBeTruthy();
}
