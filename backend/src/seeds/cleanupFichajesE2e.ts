import { PrismaClient } from '@prisma/client';
import { ROLES } from '../shared/constants/domain.constants';

const prisma = new PrismaClient();
const E2E_DATABASE = 'PASP_E2E_DB';
const BECARIO_EMAIL = 'becario.e2e@pasp-demo.test';

function getDatabaseName(databaseUrl: string | undefined): string | null {
  const match = databaseUrl?.match(/(?:database|initial catalog)=([^;]+)/i);
  return match?.[1]?.trim() ?? null;
}

function getMadridDateOnly(): Date {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return new Date(`${dateKey}T00:00:00.000Z`);
}

async function main(): Promise<void> {
  const databaseName = getDatabaseName(process.env.DATABASE_URL);

  // Esta doble guarda impide utilizar el script sobre la base habitual.
  if (process.env.NODE_ENV !== 'test' || databaseName !== E2E_DATABASE) {
    throw new Error(
      `Limpieza E2E rechazada: entorno=${process.env.NODE_ENV}, base=${databaseName}`,
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: BECARIO_EMAIL },
    select: { rol: true, becario: { select: { idBecario: true } } },
  });

  if (usuario?.rol !== ROLES.BECARIO || !usuario.becario) {
    throw new Error(`No existe el becario E2E esperado: ${BECARIO_EMAIL}`);
  }

  const where = {
    idBecario: usuario.becario.idBecario,
    fecha: getMadridDateOnly(),
  };
  const cantidad = await prisma.fichaje.count({ where });

  if (cantidad > 1) {
    throw new Error(`Limpieza E2E rechazada: se encontraron ${cantidad} fichajes.`);
  }

  // Conservamos el historial: solo se elimina el fichaje de hoy creado por el test.
  const resultado = await prisma.fichaje.deleteMany({
    where,
  });

  console.log(`Limpieza E2E completada: ${resultado.count} fichaje(s) eliminado(s).`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
