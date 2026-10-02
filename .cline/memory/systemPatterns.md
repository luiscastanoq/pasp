# System Patterns - PASP

> [!NOTE]
> Documento histórico del trabajo asistido con Cline. Conserva decisiones y
> patrones de etapas anteriores; no sustituye a `AGENTS.md` ni a la arquitectura
> y seguridad documentadas actualmente en `docs/`.

**Última actualización:** 2026-05-19 10:08

## 🏗️ Arquitectura General

### Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** SQL Server
- **ORM:** Prisma
- **Autenticación:** JWT + bcrypt

---

## 📂 Organización de Componentes Frontend

### Estructura por Flujos de Usuario

Los componentes están organizados por **flujos de usuario** en lugar de por tipo genérico:

```
frontend/src/components/
├── Becario/    # Componentes exclusivos del rol Becario
├── Tutor/      # Componentes exclusivos del rol Tutor/Responsable
└── Shared/     # Componentes compartidos entre roles
```

### Criterios de Clasificación

#### 📁 Becario/

Componentes que **solo** usa el rol Becario:

- `BecarioBanner.tsx` — Header con navegación y menú
- `BecarioProfile.tsx` — **Orquestador** de la vista principal del becario
- `sections/` — Sub-componentes de cada sección del perfil:
  - `fichaje/FichajeCard.tsx` — Card de control de fichaje
  - `fichaje/FichajeModal.tsx` — Modal para registrar entrada/salida
  - `TareasCard.tsx` — Card de tareas asignadas
  - `CorporativaCard.tsx` — Card de información corporativa y prácticas
  - `PersonalCard.tsx` — Card unificada: Contacto + Formación Académica
  - `TutoresCard.tsx` — Card de tutores asignados

#### 📁 Tutor/

Componentes que **solo** usa el rol Responsable_Empresa:

- `TutorBanner.tsx` — Header con navegación y menú
- `TutorDashboard.tsx` — Lista de becarios asignados
- `BecarioDetailView.tsx` — Vista detallada de un becario
- `BecarioEditModal.tsx` — Modal para editar datos del becario
- `TaskList.tsx` — Lista de tareas del becario
- `TaskForm.tsx` — Formulario para crear/editar tareas

#### 📁 Shared/

Componentes **compartidos** entre múltiples roles:

- `Login.tsx` — Pantalla de inicio de sesión
- `ChangePassword.tsx` — Formulario de cambio de contraseña
- `TokenExpiredModal.tsx` — Modal de sesión expirada
- `TareaDetailModal.tsx` — Modal de detalle e historial de una tarea

### Convenciones de Imports

```typescript
// Componentes en subcarpetas usan rutas relativas con ../../
// Ejemplo en Becario/sections/TareasCard.tsx:
import { becarioService } from "../../../services/becarioService";
import styles from "./TareasCard.module.css"; // CSS local siempre con ./
```

---

## 🎨 Patrones de UI

### Patrón Orquestador + Sub-componentes (BecarioProfile)

`BecarioProfile.tsx` sigue el patrón **orquestador delgado**:

- **Estado centralizado:** Todo el estado vive en el orquestador (perfil, tareas, fichaje, formulario).
- **Handlers centralizados:** Todas las funciones async (loaders, save, update) viven en el orquestador.
- **Props hacia abajo:** Los sub-componentes reciben datos y callbacks como props, sin estado propio de negocio.
- **CSS separado:** Cada sub-componente tiene su propio `*.module.css`. El CSS del orquestador solo cubre layout de página (container, main, mensajes globales, loading, error).

```
BecarioProfile (orquestador)
├── Estado: profile, tareas, fichaje, formData, validationErrors, loading flags
├── Handlers: loadProfile, loadTareas, loadFichajeActivo, handleSave, handleUpdateEstado...
└── Render:
    ├── <BecarioBanner />
    ├── <FichajeCard onOpenFichajeModal={...} fichajeActivo={...} />
    ├── <TareasCard tareas={...} onUpdateEstado={...} />
    ├── <CorporativaCard corporativo={...} practicas={...} />
    ├── <PersonalCard profile={...} formData={...} onSave={...} />
    ├── <TutoresCard tutores={...} />
    ├── <TareaDetailModal /> (condicional)
    └── <FichajeModal /> (condicional)
```

### Banners (Headers)

Ambos banners (`BecarioBanner` y `TutorBanner`) comparten:

1. **Estructura común:**
   - Logo a la izquierda
   - Botón Home
   - Avatar con iniciales
   - Nombre y rol del usuario
   - Menú desplegable con chevron animado

2. **Menú desplegable unificado:**

```typescript
<button className={`${styles.menuButton} ${menuOpen ? styles.menuButtonActive : ''}`}>
  <svg className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}>
    {/* SVG chevron que rota 180° cuando está abierto */}
  </svg>
</button>
```

3. **Dropdown con iconos:**

```typescript
<button className={styles.dropdownItem} onClick={onLogout}>
  <svg className={styles.dropdownIcon}>
    {/* Icono de logout */}
  </svg>
  Cerrar Sesión
</button>
```

### CSS Modules

**Convención de nombres:**

- Componentes: `PascalCase.tsx`
- CSS Modules: `PascalCase.module.css`
- Clases CSS: `camelCase`

```css
/* BecarioBanner.module.css */
.banner {
}
.userSection {
}
.menuButton {
}
.chevronOpen {
}
```

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

1. **Login:** Usuario ingresa email y contraseña
2. **Validación Backend:** bcrypt verifica contraseña hash
3. **Token JWT:** Se genera con la identidad, el rol y las propiedades de la sesión
4. **Almacenamiento actual:** Token guardado en `sessionStorage`
5. **Interceptor Axios:** Agrega token en header `Authorization: Bearer <token>`

### Context API para Estado Global

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}
```

### Protección de Rutas

```typescript
// App.tsx
{ user?.rol === 'Becario' && <BecarioProfile /> }
{ user?.rol === 'Responsable_Empresa' && <TutorDashboard /> }
{ user?.primerAcceso && <ChangePassword isFirstAccess /> }
```

---

## 📡 Servicios API

### Estructura de Servicios

Cada servicio maneja un dominio específico:

```
frontend/src/services/
├── api.ts              # Cliente Axios base + interceptores
├── authService.ts      # Login, cambio contraseña
├── becarioService.ts   # Perfil, tareas del becario
├── fichajeService.ts   # Operaciones de fichaje
└── tutorService.ts     # Gestión de becarios y tareas
```

### Patrón de Respuesta API

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```

### Manejo de Errores

```typescript
// api.ts - Interceptor de respuesta
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado -> logout
    }
    throw new ApiError(error.response?.data?.message || "Error");
  },
);
```

---

## 🗄️ Gestión de Estado

### Estado Local (useState)

Para estado específico del componente:

```typescript
const [menuOpen, setMenuOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);
```

### Estado Global (Context API)

Para estado compartido entre componentes:

- **AuthContext:** Usuario autenticado, funciones login/logout
- **NO se usa Redux** en este proyecto

### Estado del Servidor

Datos del backend se manejan con:

1. Llamadas directas a servicios
2. Estado local para almacenar respuesta
3. Re-fetch cuando sea necesario

```typescript
const [profile, setProfile] = useState<BecarioProfile | null>(null);

useEffect(() => {
  const loadProfile = async () => {
    const data = await becarioService.getProfile();
    setProfile(data);
  };
  loadProfile();
}, []);
```

---

## � Patrones de Badges y Estados Visuales

### Badges Reutilizables (AdminDashboard)

Los badges se implementan como spans con clases CSS combinadas para máxima flexibilidad:

```typescript
// Patrón de badge con variantes de color
<span className={`${styles.badge} ${styles.badgeBlue}`}>
  Becario
</span>
```

**Variantes de color disponibles:**

- `.badgeBlue` - Azul claro (Becario)
- `.badgePurple` - Morado (Tutor/Responsable_Empresa)
- `.badgeOrange` - Naranja (Administrador)
- `.badgeGray` - Gris (Responsable_Estudios)
- `.badgeGreen` - Verde (Activo)
- `.badgeRed` - Rojo (Inactivo)
- `.badgeWarning` - Naranja claro (Pendiente)
- `.badgeSuccess` - Verde claro (Completado)

**CSS Base del Badge:**

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  line-height: 1.2;
}
```

### Funciones de Mapeo de Badges

Para mantener consistencia, se usan funciones que mapean valores a badges:

```typescript
const getRolBadge = (rol: string) => {
  switch (rol) {
    case 'Becario':
      return <span className={`${styles.badge} ${styles.badgeBlue}`}>Becario</span>;
    case 'Responsable_Empresa':
      return <span className={`${styles.badge} ${styles.badgePurple}`}>Tutor</span>;
    // ...más casos
  }
};
```

---

## �🎯 Patrones de Formularios

### Validación en Tiempo Real

```typescript
const [validationErrors, setValidationErrors] = useState<{
  newPassword?: string;
  confirmPassword?: string;
}>({});

const handleChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
  // Limpiar error cuando el usuario empieza a escribir
  if (validationErrors[field]) {
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  }
};
```

### Submit con Manejo de Errores

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    setIsLoading(true);
    setError(null);
    await service.doSomething(formData);
    onSuccess();
  } catch (err) {
    const errorMessage =
      err instanceof ApiError ? err.message : "Error genérico";
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🔄 Patrones de Actualización de UI

### Actualización Optimista (Fichaje)

```typescript
// sections/fichaje/FichajeModal.tsx
const [localFichajeActivo, setLocalFichajeActivo] = useState(fichajeActivo);

const handleFicharEntrada = async () => {
  const response = await fichajeService.ficharEntrada();
  if (response.success && response.data) {
    // Actualizar estado local inmediatamente
    setLocalFichajeActivo(response.data);
    // Notificar al padre para refetch
    onFichajeCompleted();
  }
};
```

### Sincronización de Props

```typescript
// Sincronizar estado local cuando cambia la prop externa
useEffect(() => {
  setLocalState(propFromParent);
}, [propFromParent]);
```

---

## 🎨 Patrones CSS

### Uso de CSS Modules

Todos los estilos usan CSS Modules para evitar colisiones:

```typescript
import styles from './Component.module.css';

<div className={styles.container}>
```
