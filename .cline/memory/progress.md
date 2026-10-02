# 📊 PROGRESS TRACKER - PASP

> [!NOTE]
> Registro histórico del trabajo asistido con Cline. Los porcentajes y tareas
> reflejan el momento de su última actualización. El estado vigente se define en
> el código, `README.md` y la documentación de `docs/`.

**Última actualización**: 2026-06-01 12:25

---

## 🎯 Estado General del Proyecto

**Progreso Global**: 74% (17/23 historias de usuario completadas)

---

## ✅ MÓDULOS COMPLETADOS

### 🔐 MÓDULO 1: Autenticación y Acceso (100%)

**Estado**: ✅ Completado  
**Fecha de finalización**: 14/04/2026

**Historias completadas**:

- ✅ HU-01: Iniciar sesión (Login)
- ✅ HU-02: Cerrar sesión (Logout)
- ✅ HU-04: Primer acceso y cambio de contraseña inicial
- ✅ HU-04b: Registro de intentos de autenticación en logs
- ✅ HU-04c: Persistencia de sesión tras recarga de página
- ✅ HU-04d: Actualización de contexto de usuario sin destruir sesión

**Funcionalidades implementadas**:

- Sistema completo de autenticación con JWT
- Gestión de roles (Administrador, Responsable_Empresa, Becario, Responsable_Estudios)
- Persistencia de sesión implementada inicialmente en `localStorage` y migrada
  posteriormente a `sessionStorage`
- Logging completo de intentos de autenticación
- Cambio obligatorio de contraseña en primer acceso
- Protección de rutas según rol

---

### ⏱️ MÓDULO 2: Gestión de Asistencia y Fichaje (100%)

**Estado**: ✅ Completado  
**Fecha de finalización**: 20/05/2026

**Historias completadas**:

- ✅ HU-05: Fichar entrada de jornada
- ✅ HU-06: Fichar salida de jornada e imputar tiempo
- ✅ HU-07: Consultar fichaje activo del día
- ✅ HU-08a: Endpoint de consulta de historial de fichajes
- ✅ HU-08b: Vista de historial de fichajes

**Funcionalidades implementadas**:

- Modal de fichaje con entrada/salida
- Validación de fichaje único por día
- Cálculo automático de horas trabajadas
- Historial completo con paginación
- Filtros por rango de fechas
- Estados de fichaje (Completo, En curso, Incompleto)
- Vista de historial para Becario
- Vista de historial de becarios para Tutor

---

### 👤 MÓDULO 3: Gestión de Perfil y Panel Principal (100%)

**Estado**: ✅ Completado  
**Fecha de finalización**: 05/05/2026

**Historias completadas**:

- ✅ HU-09: Ver y editar perfil de usuario
- ✅ HU-10: Cambiar contraseña desde perfil
- ✅ HU-11: Dashboard del Becario

**Funcionalidades implementadas**:

- Edición de perfil personal
- Cambio de contraseña con validaciones
- Dashboard del Becario con:
  - Tarjeta de bienvenida
  - Tarjeta de fichaje rápido
  - Resumen de horas del mes
  - Acceso a evaluaciones
- Actualización en tiempo real del contexto de usuario
- Diseño responsive

---

### 📊 MÓDULO 4: Evaluación y Feedback (100%)

**Estado**: ✅ Completado  
**Fecha de finalización**: 26/05/2026

**Historias completadas**:

- ✅ HU-12: Crear nueva evaluación (Tutor)
- ✅ HU-13: Ver historial de evaluaciones (Tutor)
- ✅ HU-14: Ver detalle de evaluación
- ✅ HU-15: Ver mis evaluaciones (Becario)
- ✅ HU-16: Dashboard del Tutor con vista de becarios

**Funcionalidades implementadas**:

#### Backend:

- Endpoint POST `/api/tutor/evaluaciones` - Crear evaluación
- Endpoint GET `/api/tutor/becarios/:id/evaluaciones` - Historial de evaluaciones
- Endpoint GET `/api/tutor/evaluaciones/:id` - Detalle de evaluación
- Validaciones completas de datos de entrada
- Cálculo automático de puntuación global
- Logging de operaciones

#### Frontend:

- **NuevaEvaluacionModal**: Formulario completo de evaluación con:
  - Selector de periodo (fecha inicio/fin)
  - ScoreSelector visual para competencias (1-10)
  - Campo de comentarios generales
  - Validaciones en tiempo real
  - Cálculo automático de puntuación global
- **EvaluacionView**: Vista de historial con:
  - Tabla de evaluaciones ordenadas por fecha
  - Botón "Nueva Evaluación"
  - Estados visuales (puntuación con colores)
  - Mensaje cuando no hay evaluaciones
- **EvaluacionDetalleModal**: Vista detallada con:
  - Información completa de la evaluación
  - Desglose de competencias con barras de progreso
  - Diseño claro y profesional
- **TutorDashboard**: Panel completo con:
  - Tabla de becarios asignados
  - Información resumida (horas, última evaluación)
  - Acceso a vista detallada de cada becario
- **BecarioDetailView**: Vista completa del becario con:
  - Pestañas de navegación (Información, Fichajes, Evaluaciones)
  - Integración de todas las vistas
  - Navegación fluida

**Componentes reutilizables**:

- ScoreSelector: Selector visual de puntuación 1-10

---

## ⏳ MÓDULOS PENDIENTES

### 👥 MÓDULO 5: Gestión de Usuarios (Administrador) (~4%)

**Estado**: 🔄 En progreso  
**Prioridad**: 🔴 Alta  
**Enfoque actual**: Dashboard del administrador (HU-5.1 a HU-5.6) — solo interfaz frontend

**HU-5.1 y HU-5.2 completadas (01/06/2026)**:

- ✅ Componente `Header` compartido creado en `Shared/` (refactorizado de `TutorBanner`)
- ✅ `AdminDashboard` con layout base: Header + 3 bloques (kpiArea, tableHeader, tableArea)
- ✅ Sin sidebar, contenido a ancho completo (max 1400px), responsive
- ✅ Routing en `App.tsx` separado: `Administrador` → `AdminDashboard`
- ✅ `TutorDashboard` actualizado para usar `Header` compartido

**Historias completadas**:

- ✅ HU-5.1: Dashboard base del administrador (01/06/2026)
- ✅ HU-5.2: Área de KPIs de usuarios (01/06/2026)
- ✅ HU-5.3: Cabecera de la sección de tabla de usuarios (05/06/2026)
- ✅ HU-5.4: Tabla de todos los usuarios del sistema (05/06/2026)
- ✅ HU-5.5: Búsqueda y filtrado de usuarios (08/06/2026)
- ✅ HU-5.6: Paginación de la tabla de usuarios (08/06/2026)

**Historias pendientes del módulo**:

- ⏳ HU-5.7: Modal de detalles de usuario
- ⏳ HU-5.8: Modal de crear/editar usuario

---

## � NOTAS TÉCNICAS

### Arquitectura Implementada

**Backend**:

- Express.js + TypeScript
- Prisma ORM con SQL Server
- JWT para autenticación
- Winston para logging
- Middleware de autenticación y autorización

**Frontend**:

- React + TypeScript + Vite
- Context API para estado global
- CSS Modules para estilos
- Axios para peticiones HTTP
- Diseño responsive

### Patrones de Diseño Utilizados

1. **Separación de responsabilidades**:
   - Controllers: Manejo de peticiones HTTP
   - Services: Lógica de negocio
   - Routes: Definición de endpoints

2. **Componentes reutilizables**:
   - Modales genéricos
   - Selectores personalizados
   - Tablas con paginación

3. **Validaciones en dos capas**:
   - Frontend: UX inmediata
   - Backend: Seguridad y consistencia

### Próximos Pasos Recomendados

1. **Implementar CRUD de Usuarios (HU-17)**:
   - Crear endpoints backend
   - Diseñar panel de administración
   - Implementar validaciones

2. **Sistema de Asignación (HU-18)**:
   - Endpoint de asignación tutor-becario
   - Vista de gestión de asignaciones
   - Actualización automática de relaciones

3. **Sistema de Auditoría (HU-19)**:
   - Endpoint de consulta de logs
   - Vista de logs con filtros
   - Exportación a CSV

---

## 🐛 ERRORES CONOCIDOS

Ninguno reportado actualmente.

---

## 🔧 CAMBIOS TÉCNICOS APLICADOS

### Super Admin: campo `es_super_admin` en `Usuarios` (28/05/2026)

- **Descripción**: Añadida lógica de Super Admin en la capa de autenticación
- **Migración**: `20260528103250_add_super_admin` aplicada en SQL Server
- **Archivos**: `schema.prisma`, `jwt.util.ts`, `authService.ts`
- **Efecto**: `req.user.esSuperAdmin` disponible en todas las rutas protegidas

---

## � CORRECCIONES APLICADAS

### Bug: `horasImputadas` siempre `null` en vistas de fichajes (27/05/2026)

- **Causa**: `fichajeService.getHistorialFichajes()` devolvía objetos Prisma crudos con `horas_imputadas` (snake_case). El frontend esperaba `horasImputadas` (camelCase).
- **Fix**: Añadido `FichajeDTO` y función `toFichajeDTO()` en `fichajeService.ts`. Corregido `fichajeController.ts` `getHistorial()`.
- **Archivos**: `backend/src/services/fichajeService.ts`, `backend/src/controllers/fichajeController.ts`

---

## �🔄 MEJORAS FUTURAS

1. **Notificaciones en tiempo real**: WebSockets para notificaciones push
2. **Sistema de tareas**: Asignación y seguimiento de tareas a becarios
3. **Reportes y estadísticas**: Generación de informes PDF
4. **Integración con email**: Envío automático de credenciales y notificaciones
5. **Aplicación móvil**: App nativa para fichaje desde móvil
6. **Geolocalización**: Validación de ubicación en fichaje
7. **Firma digital**: Firma de documentos y evaluaciones

---

## 📊 MÉTRICAS DEL PROYECTO

- **Historias completadas**: 17/20 (85%)
- **Puntos completados**: 59/77 (77%)
- **Módulos completados**: 4/5 (80%)
- **Tiempo de desarrollo**: ~6 semanas
- **Archivos creados**: ~80
- **Líneas de código**: ~8,200

### 🆕 Última HU completada: HU-16b

- **Descripción**: Barra de búsqueda en TutorDashboard
- **Fecha**: 26/05/2026
- **Archivos modificados**: `TutorDashboard.tsx`, `TutorDashboard.module.css`
- **Sin cambios en backend**: filtrado 100% frontend con `useMemo`

---

**Última revisión**: 2026-05-26 12:44  
**Próxima revisión**: Inicio de HU-17
