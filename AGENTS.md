# AGENTS.md

## Alcance

Estas instrucciones se aplican a todo el repositorio PASP. Si en el futuro un
subdirectorio incorpora su propio `AGENTS.md` o `AGENTS.override.md`, sus reglas
más específicas prevalecen dentro de ese ámbito.

## Objetivo del proyecto

PASP es una aplicación web para administrar y seguir prácticas formativas. El
repositorio contiene dos proyectos Node.js independientes:

- `frontend/`: SPA con React 19, TypeScript, Vite, React Router, CSS Modules,
  Vitest, Testing Library y Playwright.
- `backend/`: API REST con Node.js 24, Express 5, TypeScript, Zod, Prisma y SQL
  Server.

El backend es la frontera de seguridad. El frontend mejora la experiencia de
uso, pero nunca sustituye la validación, autenticación ni autorización del
servidor.

## Fuentes de verdad y contexto

Antes de modificar una zona, consulta el código y la documentación mantenida
que corresponda:

- `README.md`: visión general, ejecución local y comandos habituales.
- `docs/ARCHITECTURE.md`: capas, flujos y responsabilidades.
- `docs/SECURITY.md`: autenticación, permisos, demo pública y secretos.
- `docs/DATABASE.md`: esquema, migraciones y semillas.
- `docs/TESTING.md`: estrategia, requisitos y comandos de verificación.
- `docs/UI_UX.md`: sistema visual, interacción, responsive y accesibilidad.
- `docs/USER_GUIDE.md`: comportamiento observable por perfil.
- `docs/AI-SDD.md`: metodología y gobierno del desarrollo asistido.
- `specs/`: requisitos y criterios de aceptación de cambios amplios.

Si la documentación contradice el código o la configuración efectiva, verifica
el comportamiento, informa de la discrepancia y actualiza la documentación
afectada dentro del mismo cambio cuando proceda.

`.clinerules/` y `.cline/memory/` conservan contexto histórico de otro agente.
Pueden ayudar a entender decisiones anteriores, pero contienen datos obsoletos
y no prevalecen sobre el código, este archivo ni la documentación mantenida. No
los actualices de forma rutinaria salvo que la tarea lo solicite expresamente.

## Forma de trabajar

- Inspecciona `git status` antes de editar y conserva los cambios ajenos o
  preexistentes.
- Mantén cada cambio limitado a la petición. Evita refactorizaciones,
  dependencias o modificaciones de formato no relacionadas.
- Para trabajo funcional no trivial, identifica primero el resultado
  observable, las restricciones y los criterios de aceptación. Usa o actualiza
  una especificación en `specs/` cuando el alcance lo justifique.
- Usa `npm` y los scripts de cada proyecto. No mezcles gestores de paquetes ni
  edites manualmente archivos de bloqueo.
- No añadas dependencias de producción sin justificar la necesidad y obtener
  aprobación.
- No debilites una validación o una prueba para conseguir que pase. Si cambia un
  comportamiento esperado, actualiza conjuntamente código, pruebas y
  documentación.
- No hagas commits, pushes, despliegues, migraciones remotas ni ejecutes semillas
  contra bases compartidas sin autorización explícita.

## Convenciones de implementación

### Frontend

- Respeta la organización por `features/` y reutiliza componentes, constantes,
  servicios API y tokens existentes antes de crear alternativas.
- Usa componentes funcionales, tipos explícitos y CSS Modules. Evita `any` sin
  una justificación concreta.
- Mantén estados de carga, error y vacío, navegación por teclado, foco visible,
  semántica accesible, diseño responsive y `prefers-reduced-motion` cuando haya
  animaciones.
- No dupliques reglas de permisos en la interfaz como si fueran una barrera de
  seguridad; la API debe aplicarlas también.
- La sesión se conserva en `sessionStorage`. No muevas tokens a
  `localStorage`.

### Backend

- Conserva la separación entre rutas, controladores, servicios, validación,
  middlewares y acceso a datos.
- Valida entradas en el servidor y centraliza las reglas de negocio en servicios
  o módulos de dominio, no en los controladores.
- Usa Prisma para el acceso ordinario a SQL Server y los mecanismos comunes de
  errores, respuestas, logging y manejo asíncrono ya presentes.
- Toda ruta protegida debe comprobar autenticación y autorización. Los tutores
  solo pueden acceder a becarios asignados.
- Las sesiones demo son de solo lectura. El bloqueo de escrituras y la
  protección del superadministrador deben mantenerse en el backend.
- Nunca registres ni devuelvas contraseñas, tokens, secretos, cadenas de conexión
  o datos personales innecesarios.

### Base de datos

- Trata `backend/prisma/schema.prisma` como definición técnica del modelo.
- Los cambios de esquema deben incluir una migración Prisma revisable; no alteres
  bases compartidas manualmente.
- Antes de ejecutar migraciones, bootstrap o semillas, confirma el entorno y la
  `DATABASE_URL`. Las operaciones de Azure y E2E requieren autorización y
  configuración específicas.

## Verificación

Ejecuta la comprobación proporcional al alcance desde el directorio afectado.

Frontend:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Backend:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Para cambios que atraviesen frontend, API o base de datos, verifica ambos
proyectos y ejecuta desde `frontend/`:

```bash
npm run test:e2e
```

Las pruebas E2E requieren la base exclusiva y las variables descritas en
`docs/TESTING.md`; no las ejecutes contra datos reales o compartidos. Para
cambios visuales o de interacción, añade una comprobación renderizada del flujo
afectado en escritorio y móvil cuando sea práctico.

## Documentación y entrega

- Actualiza la guía especializada cuando cambien arquitectura, seguridad,
  modelo de datos, pruebas, interfaz o recorridos de usuario.
- No presentes como implementada una capacidad que solo esté planificada.
- Al entregar, resume los archivos modificados, las verificaciones ejecutadas y
  cualquier riesgo o comprobación pendiente. Distingue claramente evidencia de
  inferencias.
