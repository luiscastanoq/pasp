import { PrismaClient } from '@prisma/client';
import {
  ROLES,
  TIPO_TUTORIA,
} from '../shared/constants/domain.constants';

const prisma = new PrismaClient();
const E2E_DATABASE = 'PASP_E2E_DB';
const BECARIO_EMAIL = 'becario.e2e@pasp-demo.test';
const TUTORES_PERMITIDOS = new Set([
  'tutor.principal.e2e@pasp-demo.test',
  'tutor.alternativo.e2e@pasp-demo.test',
]);

function getDatabaseName(databaseUrl: string | undefined): string | null {
  const match = databaseUrl?.match(/(?:database|initial catalog)=([^;]+)/i);
  return match?.[1]?.trim() ?? null;
}

async function main(): Promise<void> {
  const tutorEmail = process.argv[2];
  const databaseName = getDatabaseName(process.env.DATABASE_URL);

  // Esta utilidad solo puede modificar dos usuarios conocidos de PASP_E2E_DB.
  if (process.env.NODE_ENV !== 'test' || databaseName !== E2E_DATABASE) {
    throw new Error(`Cambio E2E rechazado: base=${databaseName}`);
  }
  if (!tutorEmail || !TUTORES_PERMITIDOS.has(tutorEmail)) {
    throw new Error(`Tutor E2E no permitido: ${tutorEmail ?? 'vacío'}`);
  }

  const [becario, tutor] = await Promise.all([
    prisma.usuario.findUnique({
      where: { email: BECARIO_EMAIL },
      select: { becario: { select: { idBecario: true } } },
    }),
    prisma.usuario.findUnique({
      where: { email: tutorEmail },
      select: { idUsuario: true, rol: true },
    }),
  ]);

  if (!becario?.becario) throw new Error('Becario E2E no encontrado');
  if (tutor?.rol !== ROLES.TUTOR_EMPRESA) {
    throw new Error('Tutor de empresa E2E no encontrado');
  }

  const asignacion = await prisma.tutorBecario.findUnique({
    where: {
      uq_becario_tipo_activo: {
        idBecario: becario.becario.idBecario,
        tipoTutor: TIPO_TUTORIA.EMPRESA_PRINCIPAL,
        activo: true,
      },
    },
  });
  if (!asignacion) throw new Error('Asignación principal E2E no encontrada');

  await prisma.tutorBecario.update({
    where: { id: asignacion.id },
    data: { idTutor: tutor.idUsuario },
  });
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
