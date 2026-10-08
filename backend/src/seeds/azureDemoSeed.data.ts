import {
  ESTADO_TAREA,
  EstadoTarea,
  ROLES,
  RolUsuario,
  TIPO_FORMACION,
  TipoFormacion,
} from '../shared/constants/domain.constants';

export const DEMO_DOMAIN = 'pasp-demo.test';

export interface DemoUserData {
  key: string;
  email: string;
  rol: RolUsuario;
  nombre: string;
  apellidos: string;
  practica: string;
  cliente: string;
  primerAcceso: boolean;
}

export interface DemoInternData extends DemoUserData {
  rol: typeof ROLES.BECARIO;
  telefonoPersonal: string;
  emailPersonal: string;
  linkedin: string;
  tipoFormacion: TipoFormacion;
  nombreGradoUniversitario: string | null;
  nombreFormacionProfesional: string | null;
  centroEstudios: string;
  fechaInicioPracticas: string;
  fechaFinPracticas: string;
  horasContrato: number;
  ayudaEconomica: number;
  equipoEnUso: string;
  tutorPrincipalKey: string;
  tutorSecundarioKey: string;
  tutorAcademicoKey: string;
}

export interface DemoTaskTemplate {
  nombre: string;
  descripcion: string;
}

export interface DemoEvaluationTemplate {
  titulo: string;
  evaluador: 'principal' | 'secundario';
  puntuaciones: readonly [number, number, number, number, number];
  comentarios: string;
}

export const DEMO_ADMIN: DemoUserData = {
  key: 'admin-elena-robles',
  email: `elena.robles@${DEMO_DOMAIN}`,
  rol: ROLES.ADMINISTRADOR,
  nombre: 'Elena',
  apellidos: 'Robles Vidal',
  practica: 'Administración PASP',
  cliente: 'Interno',
  primerAcceso: false,
};

export const DEMO_COMPANY_TUTORS: readonly DemoUserData[] = [
  {
    key: 'aeronova-primary',
    email: `marcos.vidal@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Marcos',
    apellidos: 'Vidal Ortega',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
  },
  {
    key: 'aeronova-secondary',
    email: `lucia.montes@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Lucía',
    apellidos: 'Montes Roldán',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
  },
  {
    key: 'ecogrid-primary',
    email: `irene.calvo@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Irene',
    apellidos: 'Calvo Serrano',
    practica: 'Data & Analytics',
    cliente: 'EcoGrid',
    primerAcceso: false,
  },
  {
    key: 'ecogrid-secondary',
    email: `alvaro.soria@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Álvaro',
    apellidos: 'Soria Ponce',
    practica: 'Data & Analytics',
    cliente: 'EcoGrid',
    primerAcceso: false,
  },
  {
    key: 'financia-primary',
    email: `daniel.paredes@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Daniel',
    apellidos: 'Paredes Mena',
    practica: 'Cybersecurity',
    cliente: 'Financia Norte',
    primerAcceso: false,
  },
  {
    key: 'financia-secondary',
    email: `teresa.gallego@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Teresa',
    apellidos: 'Gallego Mora',
    practica: 'Cybersecurity',
    cliente: 'Financia Norte',
    primerAcceso: false,
  },
  {
    key: 'clinica-primary',
    email: `natalia.ferrer@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Natalia',
    apellidos: 'Ferrer Lozano',
    practica: 'Digital Experience',
    cliente: 'Clínica Horizonte',
    primerAcceso: false,
  },
  {
    key: 'clinica-secondary',
    email: `oscar.beltran@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Óscar',
    apellidos: 'Beltrán Cruz',
    practica: 'Digital Experience',
    cliente: 'Clínica Horizonte',
    primerAcceso: false,
  },
  {
    key: 'logistica-primary',
    email: `sergio.molina@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Sergio',
    apellidos: 'Molina Crespo',
    practica: 'Business Automation',
    cliente: 'Logística Atlas',
    primerAcceso: false,
  },
  {
    key: 'logistica-secondary',
    email: `raquel.gimeno@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Raquel',
    apellidos: 'Gimeno Pastor',
    practica: 'Business Automation',
    cliente: 'Logística Atlas',
    primerAcceso: false,
  },
  {
    key: 'cultura-primary',
    email: `clara.ibanez@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Clara',
    apellidos: 'Ibáñez Roca',
    practica: 'Quality Engineering',
    cliente: 'Cultura 360',
    primerAcceso: false,
  },
  {
    key: 'cultura-secondary',
    email: `javier.segura@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_EMPRESA,
    nombre: 'Javier',
    apellidos: 'Segura Olmedo',
    practica: 'Quality Engineering',
    cliente: 'Cultura 360',
    primerAcceso: true,
  },
];

export const DEMO_ACADEMIC_TUTORS: readonly DemoUserData[] = [
  {
    key: 'academico-julia',
    email: `julia.bernal@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_ACADEMICO,
    nombre: 'Julia',
    apellidos: 'Bernal Soto',
    practica: 'Seguimiento académico',
    cliente: 'Universidad Rey Juan Carlos',
    primerAcceso: false,
  },
  {
    key: 'academico-andres',
    email: `andres.cifuentes@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_ACADEMICO,
    nombre: 'Andrés',
    apellidos: 'Cifuentes Vega',
    practica: 'Seguimiento académico',
    cliente: 'Universidad Politécnica de Madrid',
    primerAcceso: false,
  },
  {
    key: 'academico-beatriz',
    email: `beatriz.navas@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_ACADEMICO,
    nombre: 'Beatriz',
    apellidos: 'Navas Prieto',
    practica: 'Seguimiento académico',
    cliente: 'Universidad de Alcalá',
    primerAcceso: false,
  },
  {
    key: 'academico-miguel',
    email: `miguel.llorente@${DEMO_DOMAIN}`,
    rol: ROLES.TUTOR_ACADEMICO,
    nombre: 'Miguel',
    apellidos: 'Llorente Gil',
    practica: 'Seguimiento académico',
    cliente: 'Universidad Carlos III de Madrid',
    primerAcceso: true,
  },
];

export const DEMO_INTERNS: readonly DemoInternData[] = [
  {
    key: 'alba-torres',
    email: `alba.torres@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Alba',
    apellidos: 'Torres Nieto',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: true,
    telefonoPersonal: '+34 600 700 001',
    emailPersonal: `alba.torres@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-alba-torres',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería Informática',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Rey Juan Carlos',
    fechaInicioPracticas: '2026-02-02',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'AN-CLD-001',
    tutorPrincipalKey: 'aeronova-primary',
    tutorSecundarioKey: 'aeronova-secondary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'hugo-salas',
    email: `hugo.salas@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Hugo',
    apellidos: 'Salas Vera',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 002',
    emailPersonal: `hugo.salas@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-hugo-salas',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería del Software',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Politécnica de Madrid',
    fechaInicioPracticas: '2026-03-02',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 600,
    ayudaEconomica: 900,
    equipoEnUso: 'AN-CLD-002',
    tutorPrincipalKey: 'aeronova-primary',
    tutorSecundarioKey: 'aeronova-secondary',
    tutorAcademicoKey: 'academico-andres',
  },
  {
    key: 'noa-pena',
    email: `noa.pena@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Noa',
    apellidos: 'Peña Carmona',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 003',
    emailPersonal: `noa.pena@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-noa-pena',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Desarrollo de Aplicaciones Web',
    centroEstudios: 'IES Clara del Rey',
    fechaInicioPracticas: '2026-04-01',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'AN-CLD-003',
    tutorPrincipalKey: 'aeronova-secondary',
    tutorSecundarioKey: 'aeronova-primary',
    tutorAcademicoKey: 'academico-beatriz',
  },
  {
    key: 'leo-munoz',
    email: `leo.munoz@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Leo',
    apellidos: 'Muñoz Caballero',
    practica: 'Data & Analytics',
    cliente: 'EcoGrid',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 004',
    emailPersonal: `leo.munoz@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-leo-munoz',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ciencia e Ingeniería de Datos',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Carlos III de Madrid',
    fechaInicioPracticas: '2026-01-15',
    fechaFinPracticas: '2026-07-31',
    horasContrato: 600,
    ayudaEconomica: 900,
    equipoEnUso: 'EG-DAT-001',
    tutorPrincipalKey: 'ecogrid-primary',
    tutorSecundarioKey: 'ecogrid-secondary',
    tutorAcademicoKey: 'academico-miguel',
  },
  {
    key: 'emma-blanco',
    email: `emma.blanco@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Emma',
    apellidos: 'Blanco Rey',
    practica: 'Data & Analytics',
    cliente: 'EcoGrid',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 005',
    emailPersonal: `emma.blanco@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-emma-blanco',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Matemáticas y Estadística',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Autónoma de Madrid',
    fechaInicioPracticas: '2026-02-01',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'EG-DAT-002',
    tutorPrincipalKey: 'ecogrid-primary',
    tutorSecundarioKey: 'ecogrid-secondary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'pablo-esteban',
    email: `pablo.esteban@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Pablo',
    apellidos: 'Esteban Rivas',
    practica: 'Data & Analytics',
    cliente: 'EcoGrid',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 006',
    emailPersonal: `pablo.esteban@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-pablo-esteban',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Administración de Sistemas Informáticos en Red',
    centroEstudios: 'IES Virgen de la Paloma',
    fechaInicioPracticas: '2026-03-01',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'EG-DAT-003',
    tutorPrincipalKey: 'ecogrid-secondary',
    tutorSecundarioKey: 'ecogrid-primary',
    tutorAcademicoKey: 'academico-andres',
  },
  {
    key: 'carla-dominguez',
    email: `carla.dominguez@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Carla',
    apellidos: 'Domínguez Soler',
    practica: 'Cybersecurity',
    cliente: 'Financia Norte',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 007',
    emailPersonal: `carla.dominguez@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-carla-dominguez',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ciberseguridad',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Rey Juan Carlos',
    fechaInicioPracticas: '2026-02-01',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 600,
    ayudaEconomica: 950,
    equipoEnUso: 'FN-CYS-001',
    tutorPrincipalKey: 'financia-primary',
    tutorSecundarioKey: 'financia-secondary',
    tutorAcademicoKey: 'academico-beatriz',
  },
  {
    key: 'bruno-herrera',
    email: `bruno.herrera@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Bruno',
    apellidos: 'Herrera Cano',
    practica: 'Cybersecurity',
    cliente: 'Financia Norte',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 008',
    emailPersonal: `bruno.herrera@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-bruno-herrera',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario:
      'Grado en Ingeniería de Tecnologías de Telecomunicación',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Politécnica de Madrid',
    fechaInicioPracticas: '2026-02-16',
    fechaFinPracticas: '2026-09-15',
    horasContrato: 600,
    ayudaEconomica: 900,
    equipoEnUso: 'FN-CYS-002',
    tutorPrincipalKey: 'financia-primary',
    tutorSecundarioKey: 'financia-secondary',
    tutorAcademicoKey: 'academico-miguel',
  },
  {
    key: 'vega-santos',
    email: `vega.santos@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Vega',
    apellidos: 'Santos Martín',
    practica: 'Cybersecurity',
    cliente: 'Financia Norte',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 009',
    emailPersonal: `vega.santos@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-vega-santos',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Administración de Sistemas Informáticos en Red',
    centroEstudios: 'IES Luis Vives',
    fechaInicioPracticas: '2026-04-01',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 480,
    ayudaEconomica: 700,
    equipoEnUso: 'FN-CYS-003',
    tutorPrincipalKey: 'financia-secondary',
    tutorSecundarioKey: 'financia-primary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'sara-prieto',
    email: `sara.prieto@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Sara',
    apellidos: 'Prieto Galán',
    practica: 'Digital Experience',
    cliente: 'Clínica Horizonte',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 010',
    emailPersonal: `sara.prieto@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-sara-prieto',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería Multimedia',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad de Alcalá',
    fechaInicioPracticas: '2026-01-12',
    fechaFinPracticas: '2026-07-31',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'CH-DEX-001',
    tutorPrincipalKey: 'clinica-primary',
    tutorSecundarioKey: 'clinica-secondary',
    tutorAcademicoKey: 'academico-andres',
  },
  {
    key: 'gael-navarro',
    email: `gael.navarro@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Gael',
    apellidos: 'Navarro Rubio',
    practica: 'Digital Experience',
    cliente: 'Clínica Horizonte',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 011',
    emailPersonal: `gael.navarro@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-gael-navarro',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Diseño Digital',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Europea de Madrid',
    fechaInicioPracticas: '2026-03-01',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 600,
    ayudaEconomica: 800,
    equipoEnUso: 'CH-DEX-002',
    tutorPrincipalKey: 'clinica-primary',
    tutorSecundarioKey: 'clinica-secondary',
    tutorAcademicoKey: 'academico-beatriz',
  },
  {
    key: 'olivia-campos',
    email: `olivia.campos@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Olivia',
    apellidos: 'Campos León',
    practica: 'Digital Experience',
    cliente: 'Clínica Horizonte',
    primerAcceso: true,
    telefonoPersonal: '+34 600 700 012',
    emailPersonal: `olivia.campos@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-olivia-campos',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Desarrollo de Aplicaciones Multiplataforma',
    centroEstudios: 'IES Juan de la Cierva',
    fechaInicioPracticas: '2026-03-15',
    fechaFinPracticas: '2026-09-15',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'CH-DEX-003',
    tutorPrincipalKey: 'clinica-secondary',
    tutorSecundarioKey: 'clinica-primary',
    tutorAcademicoKey: 'academico-miguel',
  },
  {
    key: 'mateo-crespo',
    email: `mateo.crespo@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Mateo',
    apellidos: 'Crespo Arias',
    practica: 'Business Automation',
    cliente: 'Logística Atlas',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 013',
    emailPersonal: `mateo.crespo@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-mateo-crespo',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería en Tecnologías Industriales',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Politécnica de Madrid',
    fechaInicioPracticas: '2026-02-01',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 600,
    ayudaEconomica: 900,
    equipoEnUso: 'LA-AUT-001',
    tutorPrincipalKey: 'logistica-primary',
    tutorSecundarioKey: 'logistica-secondary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'ines-fuentes',
    email: `ines.fuentes@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Inés',
    apellidos: 'Fuentes Pastor',
    practica: 'Business Automation',
    cliente: 'Logística Atlas',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 014',
    emailPersonal: `ines.fuentes@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-ines-fuentes',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería del Software',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Complutense de Madrid',
    fechaInicioPracticas: '2026-02-16',
    fechaFinPracticas: '2026-09-15',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'LA-AUT-002',
    tutorPrincipalKey: 'logistica-primary',
    tutorSecundarioKey: 'logistica-secondary',
    tutorAcademicoKey: 'academico-andres',
  },
  {
    key: 'lucas-mendez',
    email: `lucas.mendez@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Lucas',
    apellidos: 'Méndez Valle',
    practica: 'Business Automation',
    cliente: 'Logística Atlas',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 015',
    emailPersonal: `lucas.mendez@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-lucas-mendez',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Desarrollo de Aplicaciones Multiplataforma',
    centroEstudios: 'IES Alonso de Avellaneda',
    fechaInicioPracticas: '2026-04-01',
    fechaFinPracticas: '2026-10-31',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'LA-AUT-003',
    tutorPrincipalKey: 'logistica-secondary',
    tutorSecundarioKey: 'logistica-primary',
    tutorAcademicoKey: 'academico-beatriz',
  },
  {
    key: 'daniela-ortiz',
    email: `daniela.ortiz@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Daniela',
    apellidos: 'Ortiz Merino',
    practica: 'Quality Engineering',
    cliente: 'Cultura 360',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 016',
    emailPersonal: `daniela.ortiz@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-daniela-ortiz',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería Informática',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad de Alcalá',
    fechaInicioPracticas: '2026-02-01',
    fechaFinPracticas: '2026-08-31',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'C3-QAE-001',
    tutorPrincipalKey: 'cultura-primary',
    tutorSecundarioKey: 'cultura-secondary',
    tutorAcademicoKey: 'academico-miguel',
  },
  {
    key: 'martin-cabrera',
    email: `martin.cabrera@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Martín',
    apellidos: 'Cabrera Sanz',
    practica: 'Quality Engineering',
    cliente: 'Cultura 360',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 017',
    emailPersonal: `martin.cabrera@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-martin-cabrera',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería del Software',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad Rey Juan Carlos',
    fechaInicioPracticas: '2026-03-01',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'C3-QAE-002',
    tutorPrincipalKey: 'cultura-primary',
    tutorSecundarioKey: 'cultura-secondary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'adriana-lozano',
    email: `adriana.lozano@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Adriana',
    apellidos: 'Lozano Pardo',
    practica: 'Quality Engineering',
    cliente: 'Cultura 360',
    primerAcceso: true,
    telefonoPersonal: '+34 600 700 018',
    emailPersonal: `adriana.lozano@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-adriana-lozano',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Desarrollo de Aplicaciones Web',
    centroEstudios: 'IES Clara del Rey',
    fechaInicioPracticas: '2026-04-01',
    fechaFinPracticas: '2026-10-31',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'C3-QAE-003',
    tutorPrincipalKey: 'cultura-secondary',
    tutorSecundarioKey: 'cultura-primary',
    tutorAcademicoKey: 'academico-andres',
  },
  {
    key: 'sara-rios',
    email: `sara.rios@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Sara',
    apellidos: 'Ríos Molina',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 019',
    emailPersonal: `sara.rios@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-sara-rios',
    tipoFormacion: TIPO_FORMACION.UNIVERSITARIA,
    nombreGradoUniversitario: 'Grado en Ingeniería Informática',
    nombreFormacionProfesional: null,
    centroEstudios: 'Universidad de Málaga',
    fechaInicioPracticas: '2026-03-02',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 600,
    ayudaEconomica: 850,
    equipoEnUso: 'AN-CLD-004',
    tutorPrincipalKey: 'aeronova-primary',
    tutorSecundarioKey: 'aeronova-secondary',
    tutorAcademicoKey: 'academico-julia',
  },
  {
    key: 'mateo-vega',
    email: `mateo.vega@${DEMO_DOMAIN}`,
    rol: ROLES.BECARIO,
    nombre: 'Mateo',
    apellidos: 'Vega Santos',
    practica: 'Cloud Platforms',
    cliente: 'AeroNova',
    primerAcceso: false,
    telefonoPersonal: '+34 600 700 020',
    emailPersonal: `mateo.vega@mail.${DEMO_DOMAIN}`,
    linkedin: 'https://www.linkedin.com/in/pasp-demo-mateo-vega',
    tipoFormacion: TIPO_FORMACION.FORMACION_PROFESIONAL,
    nombreGradoUniversitario: null,
    nombreFormacionProfesional:
      'Técnico Superior en Administración de Sistemas Informáticos en Red',
    centroEstudios: 'IES Campanillas',
    fechaInicioPracticas: '2026-04-01',
    fechaFinPracticas: '2026-09-30',
    horasContrato: 480,
    ayudaEconomica: 650,
    equipoEnUso: 'AN-CLD-005',
    tutorPrincipalKey: 'aeronova-primary',
    tutorSecundarioKey: 'aeronova-secondary',
    tutorAcademicoKey: 'academico-andres',
  },
];

export const DEMO_TASKS_BY_PRACTICE: Readonly<
  Record<string, readonly DemoTaskTemplate[]>
> = {
  'Cloud Platforms': [
    {
      nombre: 'Preparar el entorno cloud de desarrollo',
      descripcion:
        'Configurar herramientas, accesos y variables del entorno siguiendo la guía técnica de la práctica.',
    },
    {
      nombre: 'Analizar el flujo de despliegue',
      descripcion:
        'Documentar las etapas del despliegue y detectar dependencias entre compilación, pruebas y publicación.',
    },
    {
      nombre: 'Implementar una mejora del pipeline CI/CD',
      descripcion:
        'Añadir una comprobación automatizada al pipeline y validar su comportamiento con un despliegue controlado.',
    },
    {
      nombre: 'Crear comprobaciones de salud del servicio',
      descripcion:
        'Definir y probar indicadores básicos que permitan comprobar la disponibilidad de la aplicación.',
    },
    {
      nombre: 'Construir un panel de observabilidad',
      descripcion:
        'Preparar un panel con métricas de uso, errores y tiempos de respuesta relevantes para el equipo.',
    },
    {
      nombre: 'Documentar la respuesta ante incidencias',
      descripcion:
        'Redactar un procedimiento reproducible para detectar, registrar y escalar incidencias técnicas.',
    },
    {
      nombre: 'Revisar oportunidades de optimización cloud',
      descripcion:
        'Analizar consumo, configuración y costes para proponer mejoras justificadas y medibles.',
    },
    {
      nombre: 'Presentar la solución cloud desarrollada',
      descripcion:
        'Preparar una demostración final con arquitectura, decisiones tomadas, resultados y próximos pasos.',
    },
  ],
  'Data & Analytics': [
    {
      nombre: 'Preparar el entorno de análisis de datos',
      descripcion:
        'Configurar las herramientas y validar el acceso seguro a los conjuntos de datos de demostración.',
    },
    {
      nombre: 'Documentar el origen y estructura de los datos',
      descripcion:
        'Crear un inventario de fuentes, campos, formatos y reglas de calidad utilizadas por el equipo.',
    },
    {
      nombre: 'Implementar un proceso de transformación',
      descripcion:
        'Construir una transformación reproducible que limpie y normalice un conjunto de datos de prueba.',
    },
    {
      nombre: 'Añadir controles automáticos de calidad',
      descripcion:
        'Comprobar valores obligatorios, duplicados y rangos esperados mediante validaciones automatizadas.',
    },
    {
      nombre: 'Crear un informe de indicadores',
      descripcion:
        'Diseñar un informe claro con métricas relevantes y filtros útiles para el seguimiento del cliente.',
    },
    {
      nombre: 'Optimizar una consulta de análisis',
      descripcion:
        'Medir una consulta representativa, identificar el cuello de botella y documentar la mejora aplicada.',
    },
    {
      nombre: 'Revisar trazabilidad y gobierno del dato',
      descripcion:
        'Proponer medidas para conocer el origen, uso, responsables y tratamiento de los datos analizados.',
    },
    {
      nombre: 'Presentar los resultados del análisis',
      descripcion:
        'Preparar una demostración final que explique método, indicadores, conclusiones y limitaciones.',
    },
  ],
  Cybersecurity: [
    {
      nombre: 'Preparar el laboratorio de seguridad',
      descripcion:
        'Configurar un entorno aislado y documentar las herramientas autorizadas para las pruebas.',
    },
    {
      nombre: 'Elaborar un modelo básico de amenazas',
      descripcion:
        'Identificar activos, amenazas, controles existentes y riesgos principales del caso de estudio.',
    },
    {
      nombre: 'Aplicar medidas de endurecimiento',
      descripcion:
        'Implementar configuraciones seguras y justificar cada cambio con el riesgo que pretende reducir.',
    },
    {
      nombre: 'Automatizar comprobaciones de seguridad',
      descripcion:
        'Crear verificaciones repetibles para detectar configuraciones débiles o dependencias vulnerables.',
    },
    {
      nombre: 'Diseñar un panel de alertas',
      descripcion:
        'Organizar eventos de seguridad, niveles de gravedad y acciones recomendadas para su seguimiento.',
    },
    {
      nombre: 'Documentar un procedimiento de respuesta',
      descripcion:
        'Definir pasos de contención, análisis, recuperación y comunicación para un incidente simulado.',
    },
    {
      nombre: 'Realizar una revisión de accesos',
      descripcion:
        'Comprobar permisos, privilegios y cuentas activas, proponiendo correcciones basadas en mínimo privilegio.',
    },
    {
      nombre: 'Presentar el informe de seguridad',
      descripcion:
        'Exponer hallazgos, evidencias, riesgos, medidas aplicadas y recomendaciones priorizadas.',
    },
  ],
  'Digital Experience': [
    {
      nombre: 'Preparar el entorno de experiencia digital',
      descripcion:
        'Configurar el proyecto, dependencias y herramientas de inspección utilizadas por el equipo.',
    },
    {
      nombre: 'Analizar un recorrido de usuario',
      descripcion:
        'Documentar pasos, necesidades, fricciones y criterios de éxito de un recorrido representativo.',
    },
    {
      nombre: 'Implementar un componente reutilizable',
      descripcion:
        'Construir un componente coherente con el sistema visual y documentar sus variantes y estados.',
    },
    {
      nombre: 'Añadir pruebas de interacción',
      descripcion:
        'Automatizar los comportamientos principales del componente y verificar casos correctos y de error.',
    },
    {
      nombre: 'Revisar la accesibilidad de una pantalla',
      descripcion:
        'Comprobar teclado, contraste, etiquetas y estructura, dejando evidencias de las mejoras realizadas.',
    },
    {
      nombre: 'Medir y mejorar el rendimiento',
      descripcion:
        'Analizar carga y recursos de una vista, aplicar una optimización y comparar los resultados.',
    },
    {
      nombre: 'Documentar decisiones de diseño',
      descripcion:
        'Registrar los criterios funcionales y visuales para facilitar el mantenimiento por otros equipos.',
    },
    {
      nombre: 'Presentar la mejora de experiencia',
      descripcion:
        'Preparar una demostración final con el problema inicial, solución implementada y resultados.',
    },
  ],
  'Business Automation': [
    {
      nombre: 'Preparar el entorno de automatización',
      descripcion:
        'Configurar herramientas, credenciales de prueba y convenciones utilizadas en los flujos.',
    },
    {
      nombre: 'Analizar un proceso empresarial',
      descripcion:
        'Representar pasos, responsables, entradas, salidas y excepciones del proceso seleccionado.',
    },
    {
      nombre: 'Implementar un flujo automatizado',
      descripcion:
        'Construir una primera versión funcional del flujo utilizando datos y servicios de demostración.',
    },
    {
      nombre: 'Añadir tratamiento de errores',
      descripcion:
        'Gestionar reintentos, validaciones y notificaciones para que el flujo falle de forma controlada.',
    },
    {
      nombre: 'Crear indicadores del proceso',
      descripcion:
        'Definir tiempos, volúmenes y errores que permitan medir el resultado de la automatización.',
    },
    {
      nombre: 'Integrar un servicio complementario',
      descripcion:
        'Conectar el flujo con un servicio de prueba y documentar entradas, salidas y autenticación.',
    },
    {
      nombre: 'Revisar controles y permisos',
      descripcion:
        'Comprobar que accesos, datos y acciones del flujo respetan las reglas de mínimo privilegio.',
    },
    {
      nombre: 'Presentar la automatización desarrollada',
      descripcion:
        'Demostrar el proceso original, el flujo automatizado, las métricas y las mejoras obtenidas.',
    },
  ],
  'Quality Engineering': [
    {
      nombre: 'Preparar el entorno de pruebas',
      descripcion:
        'Configurar dependencias, datos de prueba y comandos necesarios para ejecutar la suite.',
    },
    {
      nombre: 'Diseñar un plan de pruebas',
      descripcion:
        'Definir alcance, riesgos, casos prioritarios, datos necesarios y criterios de aceptación.',
    },
    {
      nombre: 'Automatizar casos funcionales',
      descripcion:
        'Implementar pruebas repetibles para un flujo principal y documentar los resultados esperados.',
    },
    {
      nombre: 'Añadir pruebas de casos de error',
      descripcion:
        'Validar entradas incorrectas, permisos insuficientes y respuestas controladas del sistema.',
    },
    {
      nombre: 'Preparar una suite de regresión',
      descripcion:
        'Agrupar las comprobaciones críticas que deben ejecutarse antes de cada publicación.',
    },
    {
      nombre: 'Analizar cobertura y resultados',
      descripcion:
        'Revisar áreas cubiertas, fallos detectados y riesgos que todavía no están comprobados.',
    },
    {
      nombre: 'Integrar las pruebas en CI',
      descripcion:
        'Configurar la ejecución automática y documentar cómo interpretar errores y evidencias.',
    },
    {
      nombre: 'Presentar la estrategia de calidad',
      descripcion:
        'Exponer alcance, automatización, resultados, limitaciones y siguientes mejoras recomendadas.',
    },
  ],
};

export const DEMO_TASK_STATUS_PATTERN: readonly EstadoTarea[] = [
  ESTADO_TAREA.COMPLETADA,
  ESTADO_TAREA.COMPLETADA,
  ESTADO_TAREA.COMPLETADA,
  ESTADO_TAREA.COMPLETADA,
  ESTADO_TAREA.EN_PROGRESO,
  ESTADO_TAREA.EN_PROGRESO,
  ESTADO_TAREA.PENDIENTE,
  ESTADO_TAREA.PENDIENTE,
];

export const DEMO_EVALUATIONS: readonly DemoEvaluationTemplate[] = [
  {
    titulo: 'Seguimiento inicial de prácticas',
    evaluador: 'principal',
    puntuaciones: [4, 3, 4, 3, 4],
    comentarios:
      'La incorporación ha sido positiva. Comprende los objetivos, consulta las dudas y mantiene una actitud colaborativa.',
  },
  {
    titulo: 'Evaluación intermedia de competencias',
    evaluador: 'secundario',
    puntuaciones: [4, 4, 4, 4, 4],
    comentarios:
      'La evolución es constante. Entrega trabajo revisado, comunica el avance y aplica adecuadamente las indicaciones recibidas.',
  },
  {
    titulo: 'Revisión de progreso y autonomía',
    evaluador: 'principal',
    puntuaciones: [5, 4, 5, 4, 5],
    comentarios:
      'Ha ganado autonomía y participa activamente en el equipo. Se recomienda continuar reforzando la planificación técnica.',
  },
];

export const DEMO_WORKDAY_START = '2026-06-22';
export const DEMO_WORKDAY_COUNT = 25;

export const DEMO_USERS: readonly DemoUserData[] = [
  DEMO_ADMIN,
  ...DEMO_COMPANY_TUTORS,
  ...DEMO_ACADEMIC_TUTORS,
  ...DEMO_INTERNS,
];

export const DEMO_EXPECTED_COUNTS = {
  users: 37,
  admins: 1,
  companyTutors: 12,
  academicTutors: 4,
  interns: 20,
  firstAccessUsers: 5,
  tutorAssignments: 60,
  tasks: 160,
  taskHistoryEntries: 300,
  workLogs: 500,
  evaluations: 60,
} as const;
