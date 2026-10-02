# Frontend PASP

Aplicacion frontend de PASP construida con React, TypeScript y Vite.

## Gestor de paquetes

El gestor oficial del frontend es `npm`.

Este proyecto mantiene `package-lock.json`, por lo que no se debe usar `pnpm`, `yarn` u otro gestor salvo que se haga una migracion explicita de todo el proyecto.

## Requisitos

- Node.js compatible con Vite.
- npm disponible en el `PATH`.

## Instalacion

Para una instalacion reproducible:

```txt
npm ci
```

Usa `npm install` solo cuando sea necesario modificar dependencias y actualizar `package-lock.json`.

## Desarrollo

Arrancar el servidor local:

```txt
npm run dev
```

Generar build de produccion:

```txt
npm run build
```

Previsualizar el build:

```txt
npm run preview
```

## Calidad de codigo

Ejecutar ESLint:

```txt
npm run lint
```

Corregir problemas compatibles con autofix:

```txt
npm run lint:fix
```

Formatear codigo fuente:

```txt
npm run format
```

Comprobar formato sin escribir cambios:

```txt
npm run format:check
```

## Flujo recomendado antes de abrir cambios

```txt
npm ci
npm run lint
npm run build
```

Si `node_modules` fue generado con otro gestor de paquetes, elimina esa instalacion local y vuelve a ejecutar `npm ci`.
