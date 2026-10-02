import { PrismaClient } from '@prisma/client';
import { ROLES, TIPO_TUTORIA } from '../shared/constants/domain.constants';

const prisma = new PrismaClient();
const E2E_DATABASE = 'PASP_E2E_DB';
const BECARIO_EMAIL = 'becario.e2e@pasp-demo.test';
const TUTOR_EMAIL = 'tutor.principal.e2e@pasp-demo.test';
const EVALUACION_E2E = '[E2E] Evaluación de desempeño';

function getDatabaseName(databaseUrl: string | undefined): string | null {
  const match = databaseUrl?.match(/(?:database|initial catalog)=([^;]+)/i);
  return match?.[1]?.trim() ?? null;
}

async function main(): Promise<void> {
  const databaseName = getDatabaseName(process.env.DATABASE_URL);

  // Esta doble guarda evita borrar datos de desarrollo por un error de comando.
  if (process.env.NODE_ENV !== 'test' || databaseName !== E2E_DATABASE) {
    throw new Error(
      `Limpieza E2E rechazada: entorno=${process.env.NODE_ENV}, base=${databaseName}`,
    );
  }

  const [becario, tutor] = await Promise.all([
    prisma.usuario.findUnique({
      where: { email: BECARIO_EMAIL },
      select: { rol: true, becario: { select: { idBecario: true } } },
    }),
    prisma.usuario.findUnique({
      where: { email: TUTOR_EMAIL },
      select: { idUsuario: true, rol: true },
    }),
  ]);

  if (becario?.rol !== ROLES.BECARIO || !becario.becario) {
    throw new Error(`No existe el becario E2E esperado: ${BECARIO_EMAIL}`);
  }
  if (tutor?.rol !== ROLES.TUTOR_EMPRESA) {
    throw new Error(`No existe el tutor E2E esperado: ${TUTOR_EMAIL}`);
  }

  const asignacion = await prisma.tutorBecario.findFirst({
    where: {
      idTutor: tutor.idUsuario,
      idBecario: becario.becario.idBecario,
      tipoTutor: TIPO_TUTORIA.EMPRESA_PRINCIPAL,
      activo: true,
    },
  });
  if (!asignacion) {
    throw new Error('La asignación E2E esperada entre tutor y becario no existe.');
  }

  const evaluaciones = await prisma.evaluacion.findMany({
    where: {
      titulo: EVALUACION_E2E,
      idBecario: becario.becario.idBecario,
      idTutorEvaluador: tutor.idUsuario,
    },
    select: { idEvaluacion: true },
  });

  if (evaluaciones.length > 1) {
    throw new Error(
      `Limpieza E2E rechazada: se encontraron ${evaluaciones.length} evaluaciones.`,
    );
  }
  if (evaluaciones.length === 0) {
    console.log('Limpieza E2E completada: 0 evaluación(es) eliminada(s).');
    return;
  }

  await prisma.evaluacion.delete({
    where: { idEvaluacion: evaluaciones[0].idEvaluacion },
  });
  console.log('Limpieza E2E completada: 1 evaluación(es) eliminada(s).');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
