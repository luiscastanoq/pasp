# Pruebas de PASP

Este documento explica cómo está organizada y cómo se ejecuta la verificación
actual de PASP. Distingue las pruebas automatizadas de las comprobaciones
manuales y deja constancia de las limitaciones conocidas.


## Resumen

El proyecto utiliza tres niveles principales:

| Nivel | Herramientas | Ubicación | Dependencias externas |
| --- | --- | --- | --- |
| Backend | Vitest y Supertest | `backend/src/**/*.test.ts` | Normalmente aisladas mediante dobles de prueba. |
| Frontend | Vitest, JSDOM y Testing Library | `frontend/src/**/*.test.ts(x)` | API simulada y navegador virtual. |
| Extremo a extremo | Playwright con Chromium | `frontend/e2e/**/*.spec.ts` | Frontend, backend y SQL Server E2E. |

Las pruebas unitarias y de integración rápida deben ejecutarse con frecuencia.
Las E2E deben reservarse para comprobar recorridos completos y requieren una
base de datos desechable preparada expresamente.

## Requisitos comunes

- Node.js 24.x.
- npm.
- Dependencias instaladas con `npm ci` en `backend/` y `frontend/`.
- Para E2E, una instancia de SQL Server con una base exclusiva llamada
  `PASP_E2E_DB`.
- Para E2E, Chromium instalado mediante Playwright.

En Windows, si PowerShell bloquea el script `npm.ps1`, puede ejecutarse
`npm.cmd` en lugar de `npm` sin modificar la política de ejecución del equipo.

## Pruebas del backend

### Configuración

`backend/vitest.config.ts` configura:

- Entorno Node.
- API global de Vitest.
- Archivos `src/**/*.test.ts`.
- Cobertura mediante V8.
- Informes de cobertura en texto y HTML.

`src/server.ts` queda excluido de la cobertura porque solo inicia el proceso
HTTP. Los propios archivos de prueba también quedan excluidos.

### Alcance actual

Las pruebas cubren partes de:

- Autenticación, JWT y contraseñas.
- Middlewares de autenticación, permisos y limitación de intentos.
- Controladores y rutas HTTP.
- Servicios de usuarios, tutores, fichajes, tareas y evaluaciones.
- Alta de becarios por tutores, incluido el tipo de tutoría elegido para el
  tutor creador y su valor principal por defecto.
- Validaciones Zod.
- Respuestas ante la disponibilidad transitoria de la base de datos.
- Preparación controlada de datos de demostración.

Supertest permite comprobar rutas Express sin iniciar manualmente un servidor
en un puerto. Los servicios o el acceso a datos se sustituyen cuando la prueba
necesita aislar la capa HTTP.

### Ejecución

Desde `backend/`:

```bash
npm test
```

Modo interactivo durante el desarrollo:

```bash
npm run test:watch
```

Cobertura:

```bash
npm run test:coverage
```

El informe HTML se genera en `backend/coverage`. Esa carpeta está ignorada por
Git y no debe versionarse.

## Pruebas del frontend

### Configuración

La sección `test` de `frontend/vite.config.ts` utiliza:

- JSDOM como navegador simulado.
- API global de Vitest.
- `frontend/src/test/setup.ts`.
- Extensiones de aserción de `@testing-library/jest-dom`.
- Procesamiento de CSS durante las pruebas.

La carpeta `e2e/` se excluye expresamente para que Vitest no intente ejecutar
los archivos de Playwright.

### Alcance actual

Las pruebas de frontend comprueban componentes, páginas, validaciones y
servicios. Entre otros casos existen pruebas para:

- Inicio de sesión y cambio de contraseña.
- Protección de rutas.
- Tablas, formularios y paginación de administración.
- Perfil y fichaje del becario.
- Tareas y evaluaciones.
- Paneles de tutores.
- Alta de becarios con el tutor creador no desasignable y su tipo de tutoría
  editable entre principal y secundario.
- Componentes compartidos y manejo básico de errores de API.

Testing Library debe utilizarse desde la perspectiva del usuario: consultas por
rol, texto o etiqueta y eventos equivalentes a la interacción real. Deben
evitarse aserciones sobre detalles internos de implementación.

### Ejecución

Desde `frontend/`:

```bash
npm test
```

Modo interactivo:

```bash
npm run test:watch
```

Cobertura:

```bash
npm run test:coverage
```

El informe HTML se genera en `frontend/coverage` y no debe versionarse.

## Pruebas extremo a extremo

### Qué comprueban

Playwright contiene actualmente ocho recorridos:

| Archivo | Recorrido principal |
| --- | --- |
| `smoke.spec.ts` | Visualización del formulario de acceso. |
| `auth.spec.ts` | Inicio de sesión de un administrador. |
| `permissions.spec.ts` | Rechazo del acceso de un becario al panel de administración. |
| `admin.spec.ts` | Creación, edición y desactivación de un usuario. |
| `tareas.spec.ts` | Flujo compartido de una tarea entre tutor y becario. |
| `fichaje.spec.ts` | Conflictos de fichaje y cierre de jornada. |
| `evaluaciones.spec.ts` | Creación de una evaluación por un tutor. |
| `tutor-academico.spec.ts` | Consulta académica en modo de solo lectura. |

Las pruebas se ejecutan de forma secuencial, con un único worker y sin
reintentos. Esta configuración reduce conflictos entre recorridos que comparten
datos y evita ocultar fallos intermitentes.

Solo está configurado Chromium con un perfil equivalente a Desktop Chrome.

### Preparar el entorno E2E

La preparación modifica datos. Debe utilizarse exclusivamente una base
desechable llamada `PASP_E2E_DB`.

1. Crear `backend/.env.e2e` con:

   ```dotenv
   PORT=3002
   NODE_ENV=test
   JWT_SECRET=SUSTITUIR_POR_UN_SECRETO_SOLO_PARA_E2E
   JWT_EXPIRES_IN=2h
   DEMO_JWT_EXPIRES_IN=30m
   PASP_DEMO_MODE=false
   DATABASE_URL="sqlserver://SERVIDOR:1433;database=PASP_E2E_DB;user=USUARIO;password=CONTRASENA;encrypt=true;trustServerCertificate=true"
   ```

2. Instalar las dependencias:

   ```bash
   cd backend
   npm ci
   cd ../frontend
   npm ci
   ```

3. Aplicar las migraciones desde `backend/`:

   ```bash
   npm run e2e:db:migrate
   ```

   La antigua semilla E2E fue retirada. Antes de retomar estos recorridos deberá
   prepararse un nuevo conjunto de datos completamente ficticio.

4. Instalar Chromium la primera vez, desde `frontend/`:

   ```bash
   npx playwright install chromium
   ```

`backend/.env.e2e` contiene un secreto y una cadena de conexión, está ignorado
por Git y no debe compartirse sin un canal autorizado.

### Ejecutar Playwright

Desde `frontend/`:

```bash
npm run test:e2e
```

Playwright inicia automáticamente:

- La API en `http://127.0.0.1:3002`, usando `backend/.env.e2e`.
- Vite en `http://127.0.0.1:5173`.

Ambos puertos deben estar libres. `reuseExistingServer` está desactivado para
evitar que las pruebas usen por accidente servidores iniciados con otra
configuración.

Para trabajar de forma interactiva:

```bash
npm run test:e2e:ui
```

Para abrir el último informe:

```bash
npm run test:e2e:report
```

Los informes se guardan en `frontend/playwright-report`. Las trazas, capturas y
vídeos de los fallos se conservan en `frontend/test-results`. Ambas carpetas
están ignoradas por Git.

### Limpieza y aislamiento

Algunos recorridos ejecutan utilidades de `backend/src/seeds` para eliminar
únicamente fichajes, tareas o evaluaciones conocidas. Esos scripts se niegan a
actuar salvo que:

- `NODE_ENV` sea `test`.
- La base se llame exactamente `PASP_E2E_DB`.

Hay además una utilidad que modifica únicamente dos tutores conocidos del
conjunto E2E. Estas protecciones reducen el riesgo, pero antes de ejecutar las
pruebas siempre debe comprobarse la cadena `DATABASE_URL`.

Si el contenido de la base deja de ser fiable, la opción más segura es
recrear la base E2E, aplicar las migraciones y volver a preparar sus datos
ficticios.

## Estado verificado

Instantánea obtenida el 3 de agosto de 2026:

| Suite | Archivos | Pruebas | Resultado |
| --- | ---: | ---: | --- |
| Backend Vitest | 23 | 129 | Todas superadas |
| Frontend Vitest | 30 | 87 | Todas superadas |

Playwright no se ejecutó durante esta revisión documental porque sus recorridos
modifican `PASP_E2E_DB`.

Última cobertura V8 registrada, obtenida el 30 de julio de 2026:

| Proyecto | Sentencias | Ramas | Funciones | Líneas |
| --- | ---: | ---: | ---: | ---: |
| Backend | 33,84 % | 25,33 % | 30,66 % | 34,82 % |
| Frontend | 59,77 % | 49,91 % | 48,83 % | 61,59 % |

Estas cifras son una referencia fechada, no un objetivo ni una garantía. Deben
actualizarse cuando cambie de forma significativa el conjunto de pruebas.

## Automatización existente

Los flujos de GitHub Actions existentes ejecutan antes de sus trabajos
posteriores:

- Instalación reproducible con `npm ci`.
- ESLint.
- Vitest.
- Build de TypeScript y de la aplicación correspondiente.

Actualmente no ejecutan Playwright. Un fallo E2E puede, por tanto, pasar
inadvertido aunque las comprobaciones automatizadas existentes sean correctas.

## Flujo recomendado antes de entregar cambios

### Cambio limitado al backend

Desde `backend/`:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

### Cambio limitado al frontend

Desde `frontend/`:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

### Cambio que atraviesa frontend, API o base de datos

1. Ejecutar las comprobaciones del backend.
2. Ejecutar las comprobaciones del frontend.
3. Preparar de nuevo la base E2E si cambió el esquema o la semilla.
4. Ejecutar `npm run test:e2e`.
5. Revisar manualmente el recorrido afectado.

No debe corregirse una prueba debilitando una regla válida o reemplazando una
aserción útil por otra menos precisa. Si cambia el comportamiento esperado,
deben actualizarse juntos el código, la prueba y la documentación funcional.

## Comprobación manual recomendada

Antes de considerar la aplicación preparada para una demostración o validación
con usuarios, conviene comprobar:

- Acceso y cierre de sesión de los cuatro roles.
- Cambio obligatorio de contraseña en el primer acceso.
- Bloqueo visual y rechazo HTTP de operaciones no autorizadas.
- Creación, edición, desactivación y eliminación controlada de usuarios.
- Asignación de tutores y becarios.
- Creación y evolución de tareas, incluido su historial.
- Entrada, salida, conflictos y cálculo de horas de fichaje.
- Creación y consulta de evaluaciones.
- Comportamiento al caducar el JWT.
- Mensajes cuando la API o la base de datos no están disponibles.
- Navegación con teclado, etiquetas de formularios y contraste.
- Presentación en los tamaños de pantalla previstos.
- Ausencia de datos personales o secretos en consola, red e informes.

## Limitaciones conocidas

- Tras retirar la semilla histórica, queda pendiente un generador reproducible
  del conjunto E2E. La semilla pública de Azure genera contraseñas aleatorias y
  no prepara los accesos por contraseña que utiliza Playwright.
- Los recorridos E2E y sus utilidades usan ahora identidades ficticias bajo
  `pasp-demo.test`: `becario.e2e`, `becaria.e2e`, `tutor.principal.e2e`,
  `tutor.alternativo.e2e`, `academico.e2e` y `admin.e2e`. El becario principal
  se presenta como `Becario Ejemplo E2E`. La base E2E anterior debe adaptarse o
  recrearse antes de ejecutar estos recorridos. Este cambio no migra bases.

- No hay umbrales mínimos de cobertura configurados en Vitest.
- La cobertura del backend es baja en varios controladores y en los módulos de
  becarios, tutores y creación de usuarios.
- En el frontend existen formularios, modales, mapeadores y partes de la capa de
  API sin cobertura suficiente.
- Las pruebas E2E cubren recorridos principales, pero no todas las variantes,
  errores y límites de permisos.
- Playwright solo prueba Chromium de escritorio.
- Los E2E no forman parte de la automatización actual.
- No hay una batería específica de rendimiento, carga, accesibilidad o
  seguridad.
- No se ha documentado una validación formal con usuarios finales.

Una cobertura alta no sustituye la calidad de los casos. La prioridad debe ser
proteger reglas de negocio, permisos, transformaciones de datos y recorridos
con impacto real.
