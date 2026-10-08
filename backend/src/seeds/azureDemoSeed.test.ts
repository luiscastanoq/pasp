import { describe, expect, it } from 'vitest';
import { isMarcosIntern } from './demoTaskHistory';
import {
  ESTADO_TAREA,
  ROLES,
  TIPO_FORMACION,
} from '../shared/constants/domain.constants';
import {
  DEMO_ACADEMIC_TUTORS,
  DEMO_ADMIN,
  DEMO_COMPANY_TUTORS,
  DEMO_DOMAIN,
  DEMO_EVALUATIONS,
  DEMO_EXPECTED_COUNTS,
  DEMO_INTERNS,
  DEMO_TASK_STATUS_PATTERN,
  DEMO_TASKS_BY_PRACTICE,
  DEMO_USERS,
  DEMO_WORKDAY_COUNT,
} from './azureDemoSeed.data';

const expectUnique = (values: readonly string[]) => {
  expect(new Set(values).size).toBe(values.length);
};

const expectNonEmpty = (value: string) => {
  expect(value.trim().length).toBeGreaterThan(0);
};

describe('azureDemoSeed.data', () => {
  it('contiene la cantidad prevista de usuarios por rol', () => {
    expect(DEMO_USERS).toHaveLength(DEMO_EXPECTED_COUNTS.users);
    expect(DEMO_COMPANY_TUTORS).toHaveLength(
      DEMO_EXPECTED_COUNTS.companyTutors
    );
    expect(DEMO_ACADEMIC_TUTORS).toHaveLength(
      DEMO_EXPECTED_COUNTS.academicTutors
    );
    expect(DEMO_INTERNS).toHaveLength(DEMO_EXPECTED_COUNTS.interns);
    expect(DEMO_ADMIN.rol).toBe(ROLES.ADMINISTRADOR);

    const roleCounts = DEMO_USERS.reduce<Record<string, number>>(
      (counts, user) => {
        counts[user.rol] = (counts[user.rol] ?? 0) + 1;
        return counts;
      },
      {}
    );

    expect(roleCounts).toEqual({
      [ROLES.ADMINISTRADOR]: DEMO_EXPECTED_COUNTS.admins,
      [ROLES.TUTOR_EMPRESA]: DEMO_EXPECTED_COUNTS.companyTutors,
      [ROLES.TUTOR_ACADEMICO]: DEMO_EXPECTED_COUNTS.academicTutors,
      [ROLES.BECARIO]: DEMO_EXPECTED_COUNTS.interns,
    });
  });

  it('usa claves y correos únicos del dominio reservado', () => {
    expectUnique(DEMO_USERS.map(user => user.key));
    expectUnique(DEMO_USERS.map(user => user.email));

    for (const user of DEMO_USERS) {
      expect(user.email.endsWith(`@${DEMO_DOMAIN}`)).toBe(true);
      expectNonEmpty(user.nombre);
      expectNonEmpty(user.apellidos);
      expectNonEmpty(user.practica);
      expectNonEmpty(user.cliente);
    }
  });

  it('mantiene exactamente cinco cuentas para probar el primer acceso', () => {
    const firstAccessKeys = DEMO_USERS.filter(user => user.primerAcceso)
      .map(user => user.key)
      .sort();

    expect(firstAccessKeys).toEqual(
      [
        'academico-miguel',
        'adriana-lozano',
        'alba-torres',
        'cultura-secondary',
        'olivia-campos',
      ].sort()
    );
    expect(firstAccessKeys).toHaveLength(DEMO_EXPECTED_COUNTS.firstAccessUsers);
    expect(DEMO_ADMIN.primerAcceso).toBe(false);
  });

  it('completa todos los campos aplicables de los becarios', () => {
    expectUnique(DEMO_INTERNS.map(intern => intern.telefonoPersonal));
    expectUnique(DEMO_INTERNS.map(intern => intern.emailPersonal));
    expectUnique(DEMO_INTERNS.map(intern => intern.linkedin));
    expectUnique(DEMO_INTERNS.map(intern => intern.equipoEnUso));

    for (const intern of DEMO_INTERNS) {
      expectNonEmpty(intern.telefonoPersonal);
      expect(intern.emailPersonal.endsWith(`@mail.${DEMO_DOMAIN}`)).toBe(true);
      expect(intern.linkedin.startsWith('https://www.linkedin.com/in/')).toBe(
        true
      );
      expectNonEmpty(intern.centroEstudios);
      expectNonEmpty(intern.equipoEnUso);
      expect(new Date(intern.fechaInicioPracticas).getTime()).toBeLessThan(
        new Date(intern.fechaFinPracticas).getTime()
      );
      expect(intern.horasContrato).toBeGreaterThan(0);
      expect(intern.ayudaEconomica).toBeGreaterThan(0);

      if (intern.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA) {
        expectNonEmpty(intern.nombreGradoUniversitario ?? '');
        expect(intern.nombreFormacionProfesional).toBeNull();
      } else {
        expect(intern.tipoFormacion).toBe(TIPO_FORMACION.FORMACION_PROFESIONAL);
        expect(intern.nombreGradoUniversitario).toBeNull();
        expectNonEmpty(intern.nombreFormacionProfesional ?? '');
      }
    }
  });

  it('asigna a cada becario dos tutores de empresa distintos y uno académico', () => {
    const companyTutorKeys = new Set(
      DEMO_COMPANY_TUTORS.map(tutor => tutor.key)
    );
    const academicTutorKeys = new Set(
      DEMO_ACADEMIC_TUTORS.map(tutor => tutor.key)
    );

    for (const intern of DEMO_INTERNS) {
      expect(companyTutorKeys.has(intern.tutorPrincipalKey)).toBe(true);
      expect(companyTutorKeys.has(intern.tutorSecundarioKey)).toBe(true);
      expect(intern.tutorPrincipalKey).not.toBe(intern.tutorSecundarioKey);
      expect(academicTutorKeys.has(intern.tutorAcademicoKey)).toBe(true);
    }

    expect(DEMO_INTERNS.length * 3).toBe(DEMO_EXPECTED_COUNTS.tutorAssignments);
  });

  it('asigna cinco becarios a los tutores de AeroNova y tres al resto', () => {
    const assignments = new Map<string, number>();

    for (const intern of DEMO_INTERNS) {
      assignments.set(
        intern.tutorPrincipalKey,
        (assignments.get(intern.tutorPrincipalKey) ?? 0) + 1
      );
      assignments.set(
        intern.tutorSecundarioKey,
        (assignments.get(intern.tutorSecundarioKey) ?? 0) + 1
      );
    }

    for (const tutor of DEMO_COMPANY_TUTORS) {
      expect(assignments.get(tutor.key)).toBe(
        tutor.key.startsWith('aeronova-') ? 5 : 3
      );
    }
  });

  it('reparte los becarios entre todos los tutores académicos', () => {
    const assignments = DEMO_INTERNS.reduce<Record<string, number>>(
      (counts, intern) => {
        counts[intern.tutorAcademicoKey] =
          (counts[intern.tutorAcademicoKey] ?? 0) + 1;
        return counts;
      },
      {}
    );

    expect(assignments).toEqual({
      'academico-julia': 6,
      'academico-andres': 6,
      'academico-beatriz': 4,
      'academico-miguel': 4,
    });
  });

  it('define ocho tareas completas para cada práctica', () => {
    const practices = new Set(DEMO_INTERNS.map(intern => intern.practica));

    expect(Object.keys(DEMO_TASKS_BY_PRACTICE).sort()).toEqual(
      [...practices].sort()
    );

    for (const templates of Object.values(DEMO_TASKS_BY_PRACTICE)) {
      expect(templates).toHaveLength(8);
      expectUnique(templates.map(template => template.nombre));

      for (const template of templates) {
        expectNonEmpty(template.nombre);
        expectNonEmpty(template.descripcion);
      }
    }

    expect(DEMO_INTERNS.length * 8).toBe(DEMO_EXPECTED_COUNTS.tasks);
  });

  it('mantiene el reparto previsto de estados e historiales de tareas', () => {
    expect(DEMO_TASK_STATUS_PATTERN).toHaveLength(8);
    expect(
      DEMO_TASK_STATUS_PATTERN.filter(
        estado => estado === ESTADO_TAREA.COMPLETADA
      )
    ).toHaveLength(4);
    expect(
      DEMO_TASK_STATUS_PATTERN.filter(
        estado => estado === ESTADO_TAREA.EN_PROGRESO
      )
    ).toHaveLength(2);
    expect(
      DEMO_TASK_STATUS_PATTERN.filter(
        estado => estado === ESTADO_TAREA.PENDIENTE
      )
    ).toHaveLength(2);

    const historyEntriesPerIntern = DEMO_TASK_STATUS_PATTERN.reduce(
      (total, estado) => {
        if (estado === ESTADO_TAREA.COMPLETADA) return total + 2;
        if (estado === ESTADO_TAREA.EN_PROGRESO) return total + 1;
        return total;
      },
      0
    );

    const marcosInterns = DEMO_INTERNS.filter(isMarcosIntern).length;
    expect(
      historyEntriesPerIntern * (DEMO_INTERNS.length - marcosInterns) +
        marcosInterns * 30
    ).toBe(DEMO_EXPECTED_COUNTS.taskHistoryEntries);
  });

  it('define evaluaciones válidas y suficientes para todos los becarios', () => {
    expect(DEMO_EVALUATIONS).toHaveLength(3);

    for (const evaluation of DEMO_EVALUATIONS) {
      expectNonEmpty(evaluation.titulo);
      expectNonEmpty(evaluation.comentarios);
      expect(['principal', 'secundario']).toContain(evaluation.evaluador);
      expect(evaluation.puntuaciones).toHaveLength(5);

      for (const score of evaluation.puntuaciones) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
      }
    }

    expect(DEMO_EVALUATIONS.length * DEMO_INTERNS.length).toBe(
      DEMO_EXPECTED_COUNTS.evaluations
    );
  });

  it('define veinticinco fichajes por becario', () => {
    expect(DEMO_WORKDAY_COUNT).toBe(25);
    expect(DEMO_WORKDAY_COUNT * DEMO_INTERNS.length).toBe(
      DEMO_EXPECTED_COUNTS.workLogs
    );
  });
});
