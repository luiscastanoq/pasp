import { prisma } from '../database/prisma';
import { ROLES } from '../shared/constants/domain.constants';
import { hashPassword } from '../utils/password.util';

function requireValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable obligatoria ${name}`);
  }
  return value;
}

function validateEmail(email: string): void {
  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailPattern.test(email)) {
    throw new Error('PASP_BOOTSTRAP_ADMIN_EMAIL no tiene un formato valido');
  }
}

function validatePassword(password: string): void {
  const isStrong =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!isStrong) {
    throw new Error(
      'La contraseña temporal debe tener al menos 12 caracteres, mayuscula, minuscula, numero y simbolo',
    );
  }
}

async function bootstrapAdmin(): Promise<void> {
  const email = requireValue('PASP_BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const password = requireValue('PASP_BOOTSTRAP_ADMIN_PASSWORD');
  const nombre = requireValue('PASP_BOOTSTRAP_ADMIN_NAME');
  const apellidos = requireValue('PASP_BOOTSTRAP_ADMIN_SURNAMES');

  validateEmail(email);
  validatePassword(password);

  const existingSuperAdmin = await prisma.usuario.findFirst({
    where: { esSuperAdmin: true },
    select: { email: true },
  });

  if (existingSuperAdmin) {
    throw new Error(
      `Ya existe un superadministrador (${existingSuperAdmin.email}); no se ha modificado`,
    );
  }

  const existingEmail = await prisma.usuario.findUnique({
    where: { email },
    select: { email: true },
  });

  if (existingEmail) {
    throw new Error(`Ya existe un usuario con el email ${email}`);
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      rol: ROLES.ADMINISTRADOR,
      nombre,
      apellidos,
      practica: null,
      cliente: null,
      primerAcceso: true,
      esSuperAdmin: true,
      activo: true,
    },
    select: {
      idUsuario: true,
      email: true,
      primerAcceso: true,
      esSuperAdmin: true,
    },
  });

  console.log('Superadministrador creado correctamente', admin);
}

bootstrapAdmin()
  .catch(error => {
    console.error(
      'No se pudo crear el superadministrador:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
