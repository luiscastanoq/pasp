# Tech Context - PASP

> [!NOTE]
> Contexto técnico histórico generado durante el desarrollo con Cline. Las
> versiones, tareas pendientes y ejemplos pueden haber quedado obsoletos. Las
> fuentes vigentes son `AGENTS.md`, el código y la documentación de `docs/`.

## 🛠️ Stack Tecnológico Completo

### Backend

| Tecnología                    | Versión | Propósito                        |
| ----------------------------- | ------- | -------------------------------- |
| **Node.js**                   | 20.x    | Runtime de JavaScript            |
| **TypeScript**                | 6.0.2   | Lenguaje con tipado estático     |
| **Express**                   | 5.2.1   | Framework web minimalista        |
| **Prisma**                    | 6.19.3  | ORM moderno para SQL Server      |
| **bcrypt**                    | 6.0.0   | Hashing de contraseñas           |
| **jsonwebtoken**              | 9.0.3   | Generación y verificación de JWT |
| **Winston**                   | 3.19.0  | Sistema de logging robusto       |
| **winston-daily-rotate-file** | 5.0.0   | Rotación automática de logs      |
| **dotenv**                    | 17.4.1  | Gestión de variables de entorno  |
| **cors**                      | 2.8.6   | Middleware para CORS             |

### Frontend

| Tecnología       | Versión | Propósito                            |
| ---------------- | ------- | ------------------------------------ |
| **React**        | 19.2.4  | Librería UI declarativa              |
| **TypeScript**   | 6.0.2   | Lenguaje con tipado estático         |
| **Vite**         | 8.0.4   | Build tool y dev server ultrarrápido |
| **React Router** | 7.14.1  | Navegación (planificado expandir)    |
| **CSS Modules**  | Native  | Estilos encapsulados por componente  |

### Base de Datos

| Tecnología            | Versión | Propósito                       |
| --------------------- | ------- | ------------------------------- |
| **SQL Server**        | 2019+   | Base de datos relacional        |
| **Prisma Migrations** | 6.19.3  | Control de versiones del schema |

### Herramientas de Desarrollo

| Herramienta  | Versión | Propósito                          |
| ------------ | ------- | ---------------------------------- |
| **ESLint**   | 10.2.0  | Linter para JavaScript/TypeScript  |
| **Prettier** | 3.8.1   | Formateador de código              |
| **nodemon**  | 3.1.14  | Hot reload para desarrollo backend |
| **ts-node**  | 10.9.2  | Ejecución directa de TypeScript    |

---

## 📦 Configuraciones Clave

### TypeScript (Backend)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  }
}
```

**Características clave:**

- Modo `strict` activado para máxima seguridad de tipos
- Target ES2020 para aprovechar características modernas
- CommonJS para compatibilidad con Node.js

### TypeScript (Frontend)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

**Características clave:**

- JSX con nueva transformación de React 17+
- Module resolution "bundler" para Vite
- Tipos de DOM incluidos

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

**Convenciones:**

- Nombres de modelos en PascalCase (ej: `Usuario`, `Becario`)
- Nombres de campos en camelCase (ej: `idUsuario`, `emailPersonal`)
- Mapeo a snake_case en DB con `@map("nombre_campo")`
- Relaciones explícitas con `@relation`

### Variables de Entorno (.env)

```bash
# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=SUSTITUIR_POR_UN_SECRETO_LARGO_Y_ALEATORIO
JWT_EXPIRES_IN=2h
DEMO_JWT_EXPIRES_IN=30m
PASP_DEMO_MODE=false

# Base de Datos
DATABASE_URL="sqlserver://SERVIDOR:1433;database=PASP;user=USUARIO;password=CONTRASENA;encrypt=true;trustServerCertificate=true"
```

---

## 🔐 Seguridad Implementada

### Autenticación

**JWT (JSON Web Tokens)**

- Algoritmo: HS256 (HMAC with SHA-256)
- Expiración privada predeterminada: 2 horas
- Expiración demo predeterminada: 30 minutos
- Payload: identidad, rol, superadministración y marca demo cuando corresponde
- Almacenamiento: `sessionStorage` (frontend)

**Bcrypt**

- Factor de costo: 10 (2^10 iteraciones)
- Salt automático generado por bcrypt
- Validación: mínimo 8 caracteres, letras y números

### Validación de Datos

**Backend:**

- Validación manual en controllers
- Sanitización de inputs
- Mensajes de error genéricos para prevenir enumeración de usuarios

**Frontend:**

- Validación en tiempo real para UX
- Regex para formato de email
- Validación de longitud de contraseñas

### CORS

```typescript
app.use(cors()); // Solo como ejemplo de desarrollo local
```

**Nota:** En producción, PASP exige orígenes explícitos mediante `FRONTEND_URL`
y se niega a arrancar si no están configurados.

```typescript
app.use(
  cors({
    origin: "https://frontend.example.com",
    credentials: true,
  }),
);
```

---

## 📝 Sistema de Logging

### Configuración Winston

**Transports:**

1. **DailyRotateFile** para combined.log
2. **DailyRotateFile** para auth.log
3. **DailyRotateFile** para error.log
4. **Console** (solo en desarrollo)

**Formato:**

```
[YYYY-MM-DD HH:mm:ss] [LEVEL]: message | {metadata}
```

**Retención:**

- Archivos rotados diariamente
- Retención de 30 días
- Tamaño máximo por archivo: 20MB

**Niveles utilizados:**

- `error`: Errores críticos del sistema
- `warn`: Advertencias (login fallido, validaciones)
- `info`: Eventos importantes (login exitoso, CRUD)
- `debug`: Información de desarrollo (no en producción)

---

## 🗄️ Base de Datos

### SQL Server

**Configuración de Conexión:**

- Autenticación integrada de Windows
- TrustServerCertificate: true (desarrollo)
- Encrypt: true

**Schema v2.0:**

- 6 tablas principales
- Normalización 3FN
- Índices estratégicos para optimización
- Constraints de integridad referencial

**Tablas:**

1. `Usuarios` - Autenticación y datos personales
2. `Becarios` - Perfil extendido de becarios
3. `Tutor_Becario` - Relación N:M tutores-becarios
4. `Tareas` - Asignaciones de trabajo
5. `Fichajes` - Control de asistencia
6. `Evaluaciones` - Evaluaciones de desempeño

---

## 🚀 Scripts de Desarrollo

### Backend

```json
{
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "migrate:create": "prisma migrate dev --create-only",
  "migrate:deploy": "prisma migrate deploy"
}
```

### Frontend

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "preview": "vite preview"
}
```

---

## 🔄 Flujo de Desarrollo

### Desarrollo Local

1. **Iniciar Backend:**

   ```bash
   cd backend
   npm run dev
   # Servidor en http://localhost:3000
   ```

2. **Iniciar Frontend:**

   ```bash
   cd frontend
   npm run dev
   # Vite en http://localhost:5173
   ```

3. **Prisma Studio (opcional):**
   ```bash
   cd backend
   npx prisma studio
   # GUI en http://localhost:5555
   ```

### Migraciones de Base de Datos

```bash
# Crear migración
npm run migrate:create

# Aplicar migraciones
npm run migrate:deploy

# Regenerar cliente Prisma
npx prisma generate
```

---

## 📊 Rendimiento

### Backend

**Optimizaciones:**

- Prisma con queries optimizadas automáticamente
- Índices en columnas frecuentemente consultadas
- Logging asíncrono con Winston
- Middleware de compresión (futuro)

**Métricas objetivo:**

- Tiempo de respuesta API: < 200ms (p95)
- Throughput: > 100 req/s
- Memory usage: < 512MB

### Frontend

**Optimizaciones:**

- Vite con HMR ultrarrápido
- Code splitting automático
- Tree shaking de CSS Modules
- Lazy loading de componentes (futuro)

**Métricas objetivo:**

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 500KB

---

## 🧪 Testing (Planificado)

### Backend

**Framework:** Jest + Supertest

```bash
npm install --save-dev jest @types/jest supertest @types/supertest
```

**Cobertura objetivo:**

- Controllers: 80%
- Services: 90%
- Utils: 95%

### Frontend

**Framework:** Vitest + React Testing Library

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Cobertura objetivo:**

- Componentes: 70%
- Services: 85%
- Context: 90%

---

## 🐳 Despliegue (Futuro)

### Docker

**Backend Dockerfile:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📚 Recursos y Documentación

### Documentación Oficial

- **Node.js**: https://nodejs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Express**: https://expressjs.com
- **Prisma**: https://www.prisma.io/docs
- **React**: https://react.dev
- **Vite**: https://vitejs.dev

### Guías Internas

- `docs/BACKLOG.md` - Product backlog completo
- `docs/DATABASE_SCHEMA.md` - Esquema de base de datos
- `.clinerules/default-rules.md` - Convenciones del proyecto

---

## 🔧 Herramientas Recomendadas

### VS Code Extensions

- **ESLint** - Linting en tiempo real
- **Prettier** - Formateo automático
- **Prisma** - Syntax highlighting para schema
- **TypeScript** - Soporte mejorado de TS
- **Error Lens** - Errores inline
- **GitLens** - Git avanzado

### Configuración VS Code

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 🚨 Limitaciones Conocidas

1. **Sesión del navegador**: El JWT fue migrado de `localStorage` a
   `sessionStorage`; ambos requieren mantener las defensas frente a XSS.
2. **Sin rate limiting**: Implementar en producción para prevenir ataques de fuerza bruta.
3. **CORS abierto**: Configurar origins específicas en producción.
4. **Sin HTTPS**: Implementar certificados SSL en producción.
5. **Logs en disco**: Considerar servicio centralizado de logs en producción (ej: ELK Stack).

---

## 🎯 Próximas Mejoras Técnicas

1. **Implementar React Query** para cache y sincronización de datos
2. **Añadir rate limiting** con express-rate-limit
3. **Implementar refresh tokens** para mayor seguridad
4. **Configurar CI/CD** con GitHub Actions
5. **Añadir monitoreo** con Prometheus + Grafana
6. **Implementar testing** con Jest y Vitest
7. **Optimizar bundle** con análisis de Vite
8. **Añadir Swagger** para documentación de API
