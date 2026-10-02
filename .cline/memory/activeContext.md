# Active Context

> [!NOTE]
> Registro histórico del trabajo asistido con Cline. Puede describir un estado
> anterior del proyecto. Para el funcionamiento actual deben consultarse
> `AGENTS.md`, el código y la documentación de `docs/`.

## 🎯 Última Acción Realizada

**Fecha:** 2026-06-08  
**Contexto:** HU-5.5 y HU-5.6 — Búsqueda/filtrado y Paginación de la tabla de usuarios

---

## HU-5.5 — Búsqueda y filtrado de usuarios ✅

### Archivos creados

| Archivo                                                 | Descripción                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/components/Admin/UsersFilters.tsx`        | Barra unificada con searchbar + 3 dropdowns (Rol, Estado, Primer acceso)               |
| `frontend/src/components/Admin/UsersFilters.module.css` | Estilos: barra con borde continuo, botón azul corporativo (#145587), selects dinámicos |

### Archivos modificados

| Archivo                                            | Cambio                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `frontend/src/components/Admin/AdminDashboard.tsx` | Estado `appliedFilters`, `useMemo` para `usuariosFiltrados`, handlers de filtros |

### Características implementadas

- Búsqueda de texto en tiempo real (nombre, apellidos, email) — case-insensitive, parcial
- 3 dropdowns combinables: Rol / Estado / Primer acceso
- Botón ✕ interno para limpiar búsqueda
- Texto "✕ Limpiar" encima del searchbar (visible solo cuando hay filtros activos)
- Al cambiar cualquier filtro → reset automático a página 1
- Selects con ancho dinámico ajustado al texto seleccionado (canvas offscreen)

---

## HU-5.6 — Paginación de la tabla de usuarios ✅

### Archivos creados

| Archivo                                                    | Descripción                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/Admin/UsersPagination.tsx`        | Componente completo: contador "Mostrando X–Y de Z usuarios", botones `<`/`>`, páginas numeradas con elipsis               |
| `frontend/src/components/Admin/UsersPagination.module.css` | Estilos coherentes con el sistema: layout en fila (contador izq, botones der), azul corporativo #145587 para botón activo |

### Archivos modificados

| Archivo                                                    | Cambio                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/Admin/AdminDashboard.tsx`         | Estado `currentPage`, `PAGE_SIZE = 20`, `useMemo` para `usuariosPaginados`, `handlePageChange` con scroll, reset a página 1 al cambiar filtros |
| `frontend/src/components/Admin/UsersPagination.module.css` | Fase 2: layout `flex-direction: row`, color activo cambiado a `#145587`, responsive corregido                                                  |

### Criterios de aceptación verificados

| #   | Criterio                                        | Estado                           |
| --- | ----------------------------------------------- | -------------------------------- |
| 1   | Máximo 20 usuarios por página                   | ✅ `PAGE_SIZE = 20`              |
| 2   | Botones `<`/`>` y páginas numeradas con elipsis | ✅                               |
| 3   | Texto "Mostrando X–Y de Z usuarios"             | ✅ guión largo `–`               |
| 4   | No renderizar si ≤ 20 usuarios                  | ✅ `return null`                 |
| 5   | Scroll al top al cambiar página                 | ✅ `window.scrollTo`             |
| 6   | Reset a página 1 al cambiar filtros             | ✅ `useEffect([appliedFilters])` |

### Decisiones de diseño

- `paginationContainer` usa `flex-direction: row` + `justify-content: space-between` (contador a la izquierda, controles a la derecha) — patrón estándar de paginación
- Color del botón activo: `#145587` (azul corporativo) en lugar de `#3b82f6` (Tailwind genérico) — coherencia con `searchBtn`, `retryButton`, cabecera de tabla
- En `@media (max-width: 768px)`: vuelve a `flex-direction: column`, centrado

---

## Arquitectura del estado en AdminDashboard

```
usuarios[]                ← fetch completo al montar (getAllUsuarios)
  ↓
usuariosFiltrados[]       ← useMemo(usuarios, appliedFilters)
  ↓
usuariosPaginados[]       ← useMemo(usuariosFiltrados, currentPage, PAGE_SIZE)
  ↓
<UsersTable>              ← recibe solo la página actual
<UsersPagination>         ← recibe totalItems = usuariosFiltrados.length
```

---

## Próximo paso recomendado

**HU-5.7: Modal de detalles de usuario**

Al hacer clic en "Ver detalles" en cualquier fila de la tabla, abrir un modal con toda la información del usuario:

- Nombre, apellidos, email, rol, estado, primer acceso
- Fecha de creación de la cuenta
- (Posiblemente) acciones: activar/desactivar, resetear contraseña

El botón "Ver detalles" ya está presente en `UsersTable.tsx` pero actualmente solo hace `console.log`.

---

## Contexto previo relevante

### HU-5.4 — Tabla de usuarios (05/06/2026)

- `UsersTable.tsx`: 7 columnas, badges de rol/estado/primer acceso, ordenación por apellidos ASC
- `usuariosService.ts`: `getAllUsuarios()` → GET `/api/usuarios`
- Backend: `GET /api/usuarios` protegido con `authenticateToken` + `requireAdmin`

### HU-5.3 — Cabecera de sección (05/06/2026)

- `UsersTableHeader.tsx`: título + subtítulo + botón "+" (inerte)

### HU-5.2 — KPIs (01/06/2026)

- `KpiCard.tsx` + `adminService.ts` (frontend) + `GET /api/admin/stats` (backend)
- 4 tarjetas: Total, Activos, Inactivos, Pendientes primer acceso

### HU-5.1 — Layout base (01/06/2026)

- `AdminDashboard.tsx`: Header compartido, sin sidebar, max-width 1400px
