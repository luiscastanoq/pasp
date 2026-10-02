# PROJECT_RULES - PASP

> [!NOTE]
> Reglas históricas utilizadas con Cline. Se conservan como evidencia del
> proceso, pero ya no son instrucciones vigentes. `AGENTS.md`, el código y la
> documentación de `docs/` prevalecen ante cualquier contradicción.

# CRITICAL OPERATING RULES

- **OBLIGATORIO:** Antes de cualquier otra acción, DEBES leer y aplicar las reglas de gestión
  de memoria definidas en `.clinerules/memory-bank-rules.md`.
- No asumas el estado del proyecto sin haber consultado primero `activeContext.md` y `progres
s.md`.
- **Post-Task Action:** Cada respuesta que finalice una tarea DEBE terminar con la confirmaci
  ón de que el Memory Bank ha sido actualizado. Si no lo has hecho, hazlo antes de responder.

## 📋 Información General del Proyecto

**Nombre:** PASP (Plataforma de Administración y Seguimiento de Prácticas)  
**Tipo:** Aplicación web monorepo (Frontend + Backend)  
**Propósito:** Sistema interno de gestión de becarios con control de asistencia, evaluaciones y seguimiento

---

## 🏗️ Arquitectura y Estructura

### Estructura de Carpetas

```
pasp/
├── backend/          # API REST con Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/      # Configuración (DB, logger)
│   │   ├── controllers/ # Controladores de rutas
│   │   ├── middlewares/ # Middlewares (auth, error handling)
│   │   ├── routes/      # Definición de rutas
│   │   ├── services/    # Lógica de negocio
│   │   ├── types/       # Tipos TypeScript personalizados
│   │   └── utils/       # Utilidades (bcrypt, jwt)
│   ├── prisma/          # ORM Prisma (schema + migrations)
│   └── logs/            # Logs de Winston (auto-generados)
├── frontend/         # SPA con React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Context API (AuthContext)
│   │   ├── pages/       # Páginas/Vistas principales
│   │   └── services/    # Servicios API (axios)
│   └── public/          # Recursos estáticos
└── docs/             # Documentación del proyecto
```

---

## 🎯 Convenciones de Código

### Nomenclatura General

#### Variables y Funciones

- **TypeScript/JavaScript:** `camelCase`
  ```typescript
  const userName = "Juan";
  const getUserById = async (id: number) => {};
  ```

#### Archivos

- **Componentes React:** `PascalCase.tsx`
  ```
  Login.tsx, BecarioDashboard.tsx, FichajeModal.tsx
  ```
- **Módulos CSS:** `PascalCase.module.css`
  ```
  Login.module.css, Dashboard.module.css
  ```
- **Servicios/Utilidades:** `camelCase.ts`
  ```
  authService.ts, logger.ts, database.ts
  ```
- **Controladores Backend:** `camelCase.ts`
  ```
  authController.ts, fichajeController.ts
  ```

#### Tipos e Interfaces

- **Interfaces:** `PascalCase` con prefijo `I` opcional
  ```typescript
  interface User {}
  interface IAuthRequest extends Request {}
  ```
- **Types:** `PascalCase`
  ```typescript
  type Rol = "Administrador" | "Responsable_Empresa" | "Becario";
  ```
- **Enums:** `PascalCase`
  ```typescript
  enum EstadoTarea {
    Pendiente = "Pendiente",
    En_Progreso = "En_Progreso",
    Completada = "Completada",
  }
  ```

#### Constantes

- **Constantes globales:** `UPPER_SNAKE_CASE`
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET;
  const MAX_LOGIN_ATTEMPTS = 5;
  ```

#### Base de Datos (SQL Server)

- **Tablas:** `PascalCase` (singular)
  ```sql
  Usuarios, Becarios, Fichajes, Tareas
  ```
- **Columnas:** `snake_case`
  ```sql
  id_usuario, email, password_hash, created_at
  ```
- **Claves foráneas:** `FK_TablaOrigen_TablaDestino`
  ```sql
  FK_Becarios_Usuario, FK_Tareas_Becario
  ```
- **Índices:** `IX_Tabla_Campo` o `UQ_Tabla_Campo`
  ```sql
  IX_Usuarios_Rol_Activo, UQ_Usuarios_Email
  ```

---

## 🔒 Seguridad

### Autenticación y Autorización

1. **JWT Tokens:** Almacenados en `sessionStorage` y limitados a la pestaña actual
2. **Middleware de Autenticación:** Verificar token en todas las rutas protegidas
3. **Control de Roles (RBAC):**
   - Superadministrador privado: Acceso completo
   - Administrador: Gestión administrativa según permisos
   - Tutor_Empresa: Gestión de becarios asignados
   - Becario: Solo sus propios datos
   - Tutor_Academico: Consulta de becarios asignados
   - Sesiones demo: Solo lectura, con bloqueo aplicado en la API

### Passwords

- **Hashing:** bcrypt con factor de costo 10
- **Primer Acceso:** Forzar cambio de contraseña temporal
- **Validación:** Mínimo 8 caracteres, letras y números

### Validación de Datos

- **Backend:** Validar TODOS los inputs antes de procesarlos
- **Frontend:** Validación en tiempo real para UX, pero NO confiar solo en ella
- **SQL Injection:** Usar Prisma ORM (prepared statements automáticos)

---

## 📝 Logging

### Niveles de Log (Winston)

- **ERROR:** Errores críticos del sistema
- **WARN:** Advertencias (ej: login fallido)
- **INFO:** Eventos importantes (ej: login exitoso, CRUD operations)
- **DEBUG:** Información de desarrollo (no en producción)

### Qué Loguear

```typescript
// ✅ CORRECTO
logger.info("Login exitoso", {
  email: user.email,
  rol: user.rol,
  ip: req.ip,
});

logger.warn("Intento de login fallido", {
  email: req.body.email,
  ip: req.ip,
});

logger.error("Error en base de datos", {
  error: error.message,
  stack: error.stack,
});

// ❌ INCORRECTO - No loguear contraseñas
logger.info("Login", { password: req.body.password }); // ¡NUNCA!
```

### Rotación de Logs

- **Frecuencia:** Diaria
- **Retención:** 30 días
- **Archivos:** `logs/combined-%DATE%.log`, `logs/error-%DATE%.log`

---

## 🎨 Frontend - React + TypeScript

### Componentes

#### Estructura de Componente Funcional

```typescript
import React from 'react';
import styles from './MiComponente.module.css';

interface MiComponenteProps {
  titulo: string;
  onAccion?: () => void;
}

const MiComponente: React.FC<MiComponenteProps> = ({ titulo, onAccion }) => {
  return (
    <div className={styles.container}>
      <h1>{titulo}</h1>
    </div>
  );
};

export default MiComponente;
```

#### CSS Modules

- **Usar siempre:** CSS Modules para evitar colisiones de estilos
- **Nomenclatura de clases:** `camelCase`
  ```css
  .loginContainer {
  }
  .submitButton {
  }
  .errorMessage {
  }
  ```

### Estado y Context

- **useState:** Para estado local del componente
- **Context API:** Para estado global (ej: `AuthContext`)
- **NO usar Redux:** El proyecto usa Context API

### Servicios API (Axios)

```typescript
// authService.ts
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};
```

### Manejo de Errores

```typescript
try {
  const data = await authService.login(email, password);
  // Manejar éxito
} catch (error: any) {
  if (error.response?.data?.message) {
    alert(error.response.data.message); // Mostrar mensaje del backend
  } else {
    alert("Error de conexión");
  }
}
```

---

## 🔧 Backend - Node.js + Express + TypeScript

### Estructura de Rutas

```typescript
// routes/fichajeRoutes.ts
import { Router } from "express";
import * as fichajeController from "../controllers/fichajeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/entrada", authMiddleware, fichajeController.ficharEntrada);
router.post("/salida", authMiddleware, fichajeController.ficharSalida);

export default router;
```

### Estructura de Controladores

```typescript
// controllers/fichajeController.ts
import { Response } from "express";
import { IAuthRequest } from "../types/express";
import * as fichajeService from "../services/fichajeService";
import logger from "../config/logger";

export const ficharEntrada = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.id_usuario;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const fichaje = await fichajeService.registrarEntrada(userId);

    logger.info("Fichaje de entrada registrado", {
      userId,
      fichajeId: fichaje.id_fichaje,
    });

    return res.status(201).json({
      message: "Entrada registrada correctamente",
      fichaje,
    });
  } catch (error: any) {
    logger.error("Error al fichar entrada", {
      error: error.message,
      userId: req.user?.id_usuario,
    });
    return res.status(500).json({
      message: error.message || "Error al registrar entrada",
    });
  }
};
```

### Estructura de Servicios

```typescript
// services/fichajeService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registrarEntrada = async (userId: number) => {
  // 1. Obtener becario
  const becario = await prisma.becarios.findUnique({
    where: { id_usuario: userId }
  });

  if (!becario) {
    throw new Error('Becario no encontrado');
  }

  // 2. Verificar si ya fichó hoy
  const hoy = new Date().toISOString().split('T')[0];
  const fichajeExistente = await prisma.fichajes.findFirst({
    where: {
      id_becario: becario.id_becario,
      fecha: new Date(hoy)
    }
  });

  if (fichajeExistente) {
    throw new Error('Ya has fichado la entrada hoy');
  }

  // 3. Crear fichaje
  const fichaje = await prisma.fichajes.create({
     {
      id_becario: becario.id_becario,
      fecha: new Date(hoy),
      hora_entrada: new Date(),
      estado: 'Normal'
    }
  });

  return fichaje;
};
```

### Prisma ORM

- **Tipos automáticos:** Usar tipos generados por Prisma
  ```typescript
  import { Usuarios, Becarios } from "@prisma/client";
  ```
- **Relaciones:** Usar `include` para cargar relaciones
  ```typescript
  const becario = await prisma.becarios.findUnique({
    where: { id_becario: 1 },
    include: {
      usuario: true,
      tareas: true,
    },
  });
  ```

---

## 🚫 Qué EVITAR

### Backend

- ❌ **NO** exponer stack traces al cliente en producción
- ❌ **NO** loguear contraseñas o tokens
- ❌ **NO** confiar en validaciones solo del frontend
- ❌ **NO** usar `SELECT *` en queries (aunque Prisma lo gestiona)
- ❌ **NO** hardcodear credenciales (usar `.env`)
- ❌ **NO** hacer queries SQL directas (usar Prisma)

### Frontend

- ❌ **NO** almacenar contraseñas en localStorage
- ❌ **NO** confiar en que el usuario tiene permisos sin verificar en backend
- ❌ **NO** usar `any` en TypeScript sin justificación
- ❌ **NO** mutar el estado directamente (usar setters)
- ❌ **NO** hacer llamadas API sin manejo de errores

### General

- ❌ **NO** commitear
