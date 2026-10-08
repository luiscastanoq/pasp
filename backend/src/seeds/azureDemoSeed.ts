import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDemoTaskHistory, isMarcosIntern } from './demoTaskHistory';
import {
  ESTADO_TAREA,
  TIPO_TUTORIA,
} from '../shared/constants/domain.constants';
import {
  DEMO_DOMAIN,
  DEMO_EVALUATIONS,
  DEMO_EXPECTED_COUNTS,
  DEMO_INTERNS,
  DEMO_TASK_STATUS_PATTERN,
  DEMO_TASKS_BY_PRACTICE,
  DEMO_USERS,
  DEMO_WORKDAY_COUNT,
  DEMO_WORKDAY_START,
  DemoInternData,
  DemoUserData,
} from './azureDemoSeed.data';

type SeedMode = 'plan' | 'apply' | 'verify';

interface DatabaseTarget {
  host: string;
  database: string;
}

interface VerificationResult {
  users: number;
  firstAccessUsers: number;
  interns: number;
  tutorAssignments: number;
  tasks: number;
  taskHistoryEntries: number;
  workLogs: number;
  evaluations: number;
}

const APPLY_CONFIRMATION = 'CREAR_DATOS_DEMO_AZURE';
const REPORT_RELATIVE_PATH = path.join(
  '.seed-private',
  'USUARIOS_DEMO_AZURE.md'
);
const prisma = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}.`);
  }
  return value;
}

function parseDatabaseTarget(databaseUrl: string): DatabaseTarget {
  const hostMatch = databaseUrl.match(/^sqlserver:\/\/([^;]+)/i);
  const databaseMatch = databaseUrl.match(/(?:^|;)database=([^;]+)/i);

  if (!hostMatch || !databaseMatch) {
    throw new Error(
      'DATABASE_URL no tiene el formato esperado para SQL Server.'
    );
  }

  return {
    host: hostMatch[1].replace(/:1433$/i, '').toLowerCase(),
    database: decodeURIComponent(databaseMatch[1]).toLowerCase(),
  };
}

function getDatabaseTarget(): DatabaseTarget {
  return parseDatabaseTarget(requiredEnv('DATABASE_URL'));
}

function assertSafeApplyTarget(target: DatabaseTarget): void {
  if (process.env.PASP_SEED_CONFIRM !== APPLY_CONFIRMATION) {
    throw new Error(
      `Ejecución bloqueada. PASP_SEED_CONFIRM debe valer exactamente ${APPLY_CONFIRMATION}.`
    );
  }

  const expectedHost = requiredEnv('PASP_SEED_EXPECTED_HOST').toLowerCase();
  const expectedDatabase = requiredEnv(
    'PASP_SEED_EXPECTED_DATABASE'
  ).toLowerCase();

  if (target.host !== expectedHost || target.database !== expectedDatabase) {
    throw new Error(
      [
        'Ejecución bloqueada porque el destino no coincide con el autorizado.',
        `Destino real: ${target.host} / ${target.database}`,
        `Destino esperado: ${expectedHost} / ${expectedDatabase}`,
      ].join('\n')
    );
  }
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateAtContractFraction(
  intern: DemoInternData,
  fraction: number
): Date {
  const start = toDate(intern.fechaInicioPracticas).getTime();
  const end = toDate(intern.fechaFinPracticas).getTime();
  return new Date(start + (end - start) * fraction);
}

function minDate(first: Date, second: Date): Date {
  return first.getTime() <= second.getTime() ? first : second;
}

function getWorkdays(startValue: string, count: number): Date[] {
  const dates: Date[] = [];
  let candidate = toDate(startValue);

  while (dates.length < count) {
    const weekday = candidate.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.push(new Date(candidate));
    }
    candidate = addUtcDays(candidate, 1);
  }

  return dates;
}

function toMadridSummerInstant(
  date: Date,
  localHour: number,
  localMinute: number
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      localHour - 2,
      localMinute
    )
  );
}

function average(scores: readonly number[]): number {
  return Number(
    (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(
      2
    )
  );
}

function adjustedScores(
  baseScores: readonly number[],
  internIndex: number,
  evaluationIndex: number
): [number, number, number, number, number] {
  const variation = ((internIndex + evaluationIndex) % 3) - 1;
  return baseScores.map(score =>
    Math.min(5, Math.max(3, score + variation))
  ) as [number, number, number, number, number];
}

function userMutationData(user: DemoUserData, passwordHash: string) {
  return {
    email: user.email,
    passwordHash,
    rol: user.rol,
    nombre: user.nombre,
    apellidos: user.apellidos,
    practica: user.practica,
    cliente: user.cliente,
    primerAcceso: user.primerAcceso,
    esSuperAdmin: false,
    activo: true,
  };
}

async function createPasswordHashes(): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();

  for (const user of DEMO_USERS) {
    const password = randomBytes(32).toString('base64url');
    hashes.set(user.key, await bcrypt.hash(password, 10));
  }

  return hashes;
}

async function showPlan(target: DatabaseTarget): Promise<void> {
  const existingDemoUsers = await prisma.usuario.count({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
  });

  console.log('\nPLAN DE DATOS DE DEMOSTRACIÓN PASP');
  console.log('==================================');
  console.log(`Servidor: ${target.host}`);
  console.log(`Base de datos: ${target.database}`);
  console.log(`Usuarios demo que ya existen: ${existingDemoUsers}`);
  console.log(`Usuarios demo previstos: ${DEMO_EXPECTED_COUNTS.users}`);
  console.log(`Becarios previstos: ${DEMO_EXPECTED_COUNTS.interns}`);
  console.log(
    `Asignaciones de tutores previstas: ${DEMO_EXPECTED_COUNTS.tutorAssignments}`
  );
  console.log(`Tareas previstas: ${DEMO_EXPECTED_COUNTS.tasks}`);
  console.log(
    `Historiales de tarea previstos: ${DEMO_EXPECTED_COUNTS.taskHistoryEntries}`
  );
  console.log(`Fichajes previstos: ${DEMO_EXPECTED_COUNTS.workLogs}`);
  console.log(`Evaluaciones previstas: ${DEMO_EXPECTED_COUNTS.evaluations}`);
  console.log('\nEste modo solo ha realizado lecturas.');
}

async function applyDemoSeed(target: DatabaseTarget): Promise<void> {
  assertSafeApplyTarget(target);
  const passwordHashes = await createPasswordHashes();
  const workdays = getWorkdays(DEMO_WORKDAY_START, DEMO_WORKDAY_COUNT);

  console.log('\nAPLICANDO DATOS DE DEMOSTRACIÓN PASP');
  console.log('====================================');
  console.log(`Servidor autorizado: ${target.host}`);
  console.log(`Base autorizada: ${target.database}`);
  console.log(
    `Ámbito exclusivo: usuarios cuyo correo termina en @${DEMO_DOMAIN}`
  );

  await prisma.$transaction(
    async transaction => {
      const userIdsByKey = new Map<string, number>();

      for (const user of DEMO_USERS) {
        const passwordHash = passwordHashes.get(user.key);
        if (!passwordHash) {
          throw new Error(`No existe hash para el usuario ${user.key}.`);
        }

        const data = userMutationData(user, passwordHash);
        const storedUser = await transaction.usuario.upsert({
          where: { email: user.email },
          update: data,
          create: data,
        });
        userIdsByKey.set(user.key, storedUser.idUsuario);
      }

      const internIdsByKey = new Map<string, number>();

      for (const intern of DEMO_INTERNS) {
        const userId = userIdsByKey.get(intern.key);
        if (!userId) {
          throw new Error(`No se ha creado el usuario ${intern.key}.`);
        }

        const profileData = {
          telefonoPersonal: intern.telefonoPersonal,
          emailPersonal: intern.emailPersonal,
          linkedin: intern.linkedin,
          tipoFormacion: intern.tipoFormacion,
          nombreGradoUniversitario: intern.nombreGradoUniversitario,
          nombreFormacionProfesional: intern.nombreFormacionProfesional,
          centroEstudios: intern.centroEstudios,
          fechaInicioPracticas: toDate(intern.fechaInicioPracticas),
          fechaFinPracticas: toDate(intern.fechaFinPracticas),
          horasContrato: new Prisma.Decimal(intern.horasContrato),
          ayudaEconomica: intern.ayudaEconomica,
          equipoEnUso: intern.equipoEnUso,
        };

        const storedIntern = await transaction.becario.upsert({
          where: { idUsuario: userId },
          update: profileData,
          create: {
            idUsuario: userId,
            ...profileData,
          },
        });
        internIdsByKey.set(intern.key, storedIntern.idBecario);
      }

      const internIds = [...internIdsByKey.values()];

      await transaction.tarea.deleteMany({
        where: { idBecario: { in: internIds } },
      });
      await transaction.evaluacion.deleteMany({
        where: { idBecario: { in: internIds } },
      });
      await transaction.fichaje.deleteMany({
        where: { idBecario: { in: internIds } },
      });
      await transaction.tutorBecario.deleteMany({
        where: { idBecario: { in: internIds } },
      });

      await transaction.tutorBecario.createMany({
        data: DEMO_INTERNS.flatMap(intern => {
          const internId = internIdsByKey.get(intern.key);
          const principalId = userIdsByKey.get(intern.tutorPrincipalKey);
          const secondaryId = userIdsByKey.get(intern.tutorSecundarioKey);
          const academicId = userIdsByKey.get(intern.tutorAcademicoKey);

          if (!internId || !principalId || !secondaryId || !academicId) {
            throw new Error(`Tutorías incompletas para ${intern.key}.`);
          }

          const assignmentDate = toDate(intern.fechaInicioPracticas);
          return [
            {
              idBecario: internId,
              idTutor: principalId,
              tipoTutor: TIPO_TUTORIA.EMPRESA_PRINCIPAL,
              fechaAsignacion: assignmentDate,
              activo: true,
            },
            {
              idBecario: internId,
              idTutor: secondaryId,
              tipoTutor: TIPO_TUTORIA.EMPRESA_SECUNDARIO,
              fechaAsignacion: assignmentDate,
              activo: true,
            },
            {
              idBecario: internId,
              idTutor: academicId,
              tipoTutor: TIPO_TUTORIA.ACADEMICO,
              fechaAsignacion: assignmentDate,
              activo: true,
            },
          ];
        }),
      });

      for (const [internIndex, intern] of DEMO_INTERNS.entries()) {
        const internId = internIdsByKey.get(intern.key);
        if (!internId) {
          throw new Error(`No existe el perfil ${intern.key}.`);
        }

        const templates = DEMO_TASKS_BY_PRACTICE[intern.practica];
        if (!templates) {
          throw new Error(`No existen tareas para ${intern.practica}.`);
        }

        for (const [taskIndex, template] of templates.entries()) {
          const tutorKey =
            taskIndex % 2 === 0
              ? intern.tutorPrincipalKey
              : intern.tutorSecundarioKey;
          const tutorId = userIdsByKey.get(tutorKey);
          if (!tutorId) {
            throw new Error(`No existe el tutor ${tutorKey}.`);
          }

          const estado = DEMO_TASK_STATUS_PATTERN[taskIndex];
          const startFraction = 0.03 + taskIndex * 0.12;
          const dueFraction = Math.min(0.98, startFraction + 0.1);
          const taskStart = dateAtContractFraction(intern, startFraction);
          const taskDue = dateAtContractFraction(intern, dueFraction);
          const completedAt =
            estado === ESTADO_TAREA.COMPLETADA
              ? new Date(
                  taskStart.getTime() +
                    (taskDue.getTime() - taskStart.getTime()) * 0.75
                )
              : null;

          let history: {
            estadoAnterior: string | null;
            estadoNuevo: string;
            idUsuarioModificador: number;
            fechaCambio: Date;
          }[] =
            estado === ESTADO_TAREA.COMPLETADA
              ? [
                  {
                    estadoAnterior: ESTADO_TAREA.PENDIENTE,
                    estadoNuevo: ESTADO_TAREA.EN_PROGRESO,
                    idUsuarioModificador: tutorId,
                    fechaCambio: addUtcDays(taskStart, 1),
                  },
                  {
                    estadoAnterior: ESTADO_TAREA.EN_PROGRESO,
                    estadoNuevo: ESTADO_TAREA.COMPLETADA,
                    idUsuarioModificador: tutorId,
                    fechaCambio: completedAt ?? taskDue,
                  },
                ]
              : estado === ESTADO_TAREA.EN_PROGRESO
                ? [
                    {
                      estadoAnterior: ESTADO_TAREA.PENDIENTE,
                      estadoNuevo: ESTADO_TAREA.EN_PROGRESO,
                      idUsuarioModificador: tutorId,
                      fechaCambio: addUtcDays(taskStart, 1),
                    },
                  ]
                : [];

          if (isMarcosIntern(intern)) {
            const internUserId = userIdsByKey.get(intern.key);
            if (!internUserId)
              throw new Error(`No existe el usuario ${intern.key}.`);
            history = createDemoTaskHistory(
              {
                estado,
                fechaInicio: taskStart,
                fechaFinEstimada: taskDue,
                fechaCompletada: completedAt,
                idTutorAsignador: tutorId,
              },
              internUserId
            );
          }

          await transaction.tarea.create({
            data: {
              idBecario: internId,
              idTutorAsignador: tutorId,
              nombreTarea: template.nombre,
              descripcion: `${template.descripcion} Caso de demostración asignado a ${intern.nombre} ${intern.apellidos}.`,
              estado,
              fechaInicio: taskStart,
              fechaFinEstimada: taskDue,
              fechaCompletada: completedAt,
              historial: {
                create: history,
              },
            },
          });
        }

        await transaction.fichaje.createMany({
          data: workdays.map((workday, workdayIndex) => {
            const entryOffset = (internIndex * 7 + workdayIndex * 11) % 49;
            const workedMinutes =
              450 + ((internIndex * 13 + workdayIndex * 17) % 46);
            const entry = toMadridSummerInstant(workday, 8, entryOffset);
            const exit = new Date(entry.getTime() + workedMinutes * 60_000);
            const workedHours = Number((workedMinutes / 60).toFixed(2));
            const nonProjectTime = workdayIndex % 7 === 0 ? 0.5 : 0.25;
            const imputedHours = Number(
              Math.max(0, workedHours - nonProjectTime).toFixed(2)
            );

            let justification =
              'Jornada ordinaria registrada como dato de demostración.';
            if (workdayIndex === 6) {
              justification =
                'Jornada adaptada por asistencia a formación interna.';
            } else if (workdayIndex === 17) {
              justification =
                'Jornada adaptada por compromiso académico programado.';
            }

            return {
              idBecario: internId,
              fecha: workday,
              horaEntrada: entry,
              horaSalida: exit,
              horasTrabajadas: new Prisma.Decimal(workedHours),
              horas_imputadas: new Prisma.Decimal(imputedHours),
              justificacion: justification,
            };
          }),
        });

        await transaction.evaluacion.createMany({
          data: DEMO_EVALUATIONS.map((evaluationTemplate, evaluationIndex) => {
            const tutorKey =
              evaluationTemplate.evaluador === 'principal'
                ? intern.tutorPrincipalKey
                : intern.tutorSecundarioKey;
            const evaluatorId = userIdsByKey.get(tutorKey);
            if (!evaluatorId) {
              throw new Error(`No existe el evaluador ${tutorKey}.`);
            }

            const scores = adjustedScores(
              evaluationTemplate.puntuaciones,
              internIndex,
              evaluationIndex
            );
            const plannedDate = dateAtContractFraction(
              intern,
              [0.18, 0.45, 0.7][evaluationIndex]
            );
            const evaluationDate = minDate(plannedDate, toDate('2026-07-18'));

            return {
              idBecario: internId,
              idTutorEvaluador: evaluatorId,
              titulo: evaluationTemplate.titulo,
              fechaEvaluacion: evaluationDate,
              puntuacionPuntualidad: scores[0],
              puntuacionCalidad: scores[1],
              puntuacionActitud: scores[2],
              puntuacionAutonomia: scores[3],
              puntuacionComunicacion: scores[4],
              puntuacionMedia: average(scores),
              comentarios: `${evaluationTemplate.comentarios} Evaluación de demostración de ${intern.nombre} ${intern.apellidos}.`,
            };
          }),
        });
      }
    },
    {
      maxWait: 20_000,
      timeout: 300_000,
    }
  );

  const result = await verifyDemoSeed();
  const reportPath = await writePrivateReport();

  console.log('\nDatos creados y verificados correctamente.');
  printVerification(result);
  console.log(`Informe privado: ${reportPath}`);
}

function expectedVerification(): VerificationResult {
  return {
    users: DEMO_EXPECTED_COUNTS.users,
    firstAccessUsers: DEMO_EXPECTED_COUNTS.firstAccessUsers,
    interns: DEMO_EXPECTED_COUNTS.interns,
    tutorAssignments: DEMO_EXPECTED_COUNTS.tutorAssignments,
    tasks: DEMO_EXPECTED_COUNTS.tasks,
    taskHistoryEntries: DEMO_EXPECTED_COUNTS.taskHistoryEntries,
    workLogs: DEMO_EXPECTED_COUNTS.workLogs,
    evaluations: DEMO_EXPECTED_COUNTS.evaluations,
  };
}

async function verifyDemoSeed(): Promise<VerificationResult> {
  const demoUsers = await prisma.usuario.findMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
    select: {
      idUsuario: true,
      email: true,
      rol: true,
      primerAcceso: true,
      esSuperAdmin: true,
      becario: { select: { idBecario: true } },
    },
  });
  const internIds = demoUsers.flatMap(user =>
    user.becario ? [user.becario.idBecario] : []
  );
  const taskIds = (
    await prisma.tarea.findMany({
      where: { idBecario: { in: internIds } },
      select: { idTarea: true },
    })
  ).map(task => task.idTarea);

  const [tutorAssignments, tasks, taskHistoryEntries, workLogs, evaluations] =
    await Promise.all([
      prisma.tutorBecario.count({
        where: { idBecario: { in: internIds }, activo: true },
      }),
      prisma.tarea.count({ where: { idBecario: { in: internIds } } }),
      prisma.tareaHistorial.count({
        where: { idTarea: { in: taskIds } },
      }),
      prisma.fichaje.count({ where: { idBecario: { in: internIds } } }),
      prisma.evaluacion.count({ where: { idBecario: { in: internIds } } }),
    ]);

  const result: VerificationResult = {
    users: demoUsers.length,
    firstAccessUsers: demoUsers.filter(user => user.primerAcceso).length,
    interns: internIds.length,
    tutorAssignments,
    tasks,
    taskHistoryEntries,
    workLogs,
    evaluations,
  };
  const expected = expectedVerification();

  for (const [name, expectedValue] of Object.entries(expected)) {
    const actualValue = result[name as keyof VerificationResult];
    if (actualValue !== expectedValue) {
      throw new Error(
        `Verificación fallida para ${name}: esperado ${expectedValue}, obtenido ${actualValue}.`
      );
    }
  }

  if (demoUsers.some(user => user.esSuperAdmin)) {
    throw new Error(
      'Una cuenta de demostración no puede ser superadministradora.'
    );
  }

  const assignments = await prisma.tutorBecario.findMany({
    where: { idBecario: { in: internIds }, activo: true },
    select: { idBecario: true, tipoTutor: true },
  });
  const assignmentsByIntern = new Map<number, Set<string>>();

  for (const assignment of assignments) {
    const types =
      assignmentsByIntern.get(assignment.idBecario) ?? new Set<string>();
    types.add(assignment.tipoTutor);
    assignmentsByIntern.set(assignment.idBecario, types);
  }

  const requiredTypes = new Set<string>([
    TIPO_TUTORIA.EMPRESA_PRINCIPAL,
    TIPO_TUTORIA.EMPRESA_SECUNDARIO,
    TIPO_TUTORIA.ACADEMICO,
  ]);

  for (const internId of internIds) {
    const types = assignmentsByIntern.get(internId);
    if (
      !types ||
      types.size !== requiredTypes.size ||
      [...requiredTypes].some(type => !types.has(type))
    ) {
      throw new Error(
        `El becario ${internId} no tiene exactamente sus tres tipos de tutoría.`
      );
    }
  }

  return result;
}

function printVerification(result: VerificationResult): void {
  console.log('\nVERIFICACIÓN');
  console.log('============');
  console.log(`Usuarios demo: ${result.users}`);
  console.log(`Usuarios con primer acceso: ${result.firstAccessUsers}`);
  console.log(`Becarios: ${result.interns}`);
  console.log(`Tutorías activas: ${result.tutorAssignments}`);
  console.log(`Tareas: ${result.tasks}`);
  console.log(`Historiales: ${result.taskHistoryEntries}`);
  console.log(`Fichajes: ${result.workLogs}`);
  console.log(`Evaluaciones: ${result.evaluations}`);
}

function fullName(user: DemoUserData): string {
  return `${user.nombre} ${user.apellidos}`;
}

async function writePrivateReport(): Promise<string> {
  const usersByKey = new Map(DEMO_USERS.map(user => [user.key, user]));
  const absolutePath = path.resolve(process.cwd(), REPORT_RELATIVE_PATH);
  const lines: string[] = [
    '# Usuarios de demostración de Azure',
    '',
    '> Archivo local ignorado por Git. No contiene la conexión de SQL Server, secretos JWT ni hashes.',
    '',
    'Las contraseñas se generan aleatoriamente al aplicar la seed, no se guardan y no permiten el acceso manual. Las cuentas de demo se abren desde los accesos por rol de la aplicación.',
    '',
    '## Usuarios',
    '',
    '| Nombre | Email | Rol | Cliente | Práctica | Primer acceso |',
    '|---|---|---|---|---|---|',
    ...DEMO_USERS.map(
      user =>
        `| ${fullName(user)} | ${user.email} | ${user.rol} | ${user.cliente} | ${user.practica} | ${user.primerAcceso ? 'Sí' : 'No'} |`
    ),
    '',
    '## Relaciones de los becarios',
    '',
    '| Becario | Email | Tutor principal | Tutor secundario | Tutor académico |',
    '|---|---|---|---|---|',
    ...DEMO_INTERNS.map(intern => {
      const principal = usersByKey.get(intern.tutorPrincipalKey);
      const secondary = usersByKey.get(intern.tutorSecundarioKey);
      const academic = usersByKey.get(intern.tutorAcademicoKey);
      if (!principal || !secondary || !academic) {
        throw new Error(`No se puede documentar la tutoría de ${intern.key}.`);
      }
      return `| ${fullName(intern)} | ${intern.email} | ${fullName(principal)} | ${fullName(secondary)} | ${fullName(academic)} |`;
    }),
    '',
  ];

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${lines.join('\n')}\n`, 'utf8');
  return absolutePath;
}

function getMode(): SeedMode {
  const mode = process.argv[2];
  if (mode === 'plan' || mode === 'apply' || mode === 'verify') {
    return mode;
  }
  throw new Error('Modo inválido. Utiliza plan, apply o verify.');
}

async function main(): Promise<void> {
  const mode = getMode();
  const target = getDatabaseTarget();

  if (mode === 'plan') {
    await showPlan(target);
    return;
  }

  if (mode === 'apply') {
    await applyDemoSeed(target);
    return;
  }

  const result = await verifyDemoSeed();
  console.log(`Destino verificado: ${target.host} / ${target.database}`);
  printVerification(result);
  console.log('\nLa seed de demostración está completa y es coherente.');
}

main()
  .catch(error => {
    console.error('\nERROR EN LA SEED DE DEMOSTRACIÓN');
    console.error(
      error instanceof Error ? error.message : 'Error desconocido en la seed.'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
