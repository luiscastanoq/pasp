# Despliegue de la demo pública

Los workflows publican los cambios de `main` que afectan a cada proyecto.
La ejecución manual también limita el despliegue a `main`. Las Actions están
fijadas a commits oficiales y Dependabot propone sus actualizaciones.

## Configuración del repositorio nuevo

1. Activar GitHub Pages con GitHub Actions como origen.
2. Restringir los entornos `github-pages` y `production` a la rama `main`.
   No exigir aprobación manual si se desean despliegues automáticos.
3. En el entorno `production`, configurar `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`
   y `AZURE_SUBSCRIPTION_ID` con los identificadores de la identidad de despliegue.
4. Configurar en Azure una credencial federada OIDC con estos valores:
   - Emisor: `https://token.actions.githubusercontent.com`.
   - Sujeto: `repo:luiscastanoq/pasp:environment:production`.
   - Audiencia: `api://AzureADTokenExchange`.
5. Comprobar los permisos efectivos de esa identidad, incluidos los heredados:
   limitar el rol de despliegue al App Service de PASP, sin acceso general a la
   suscripción ni permisos de SQL. Una identidad dedicada facilita ese aislamiento.
6. Conservar las credenciales de SQL y JWT exclusivamente en la configuración
   privada de Azure. Ninguna debe añadirse al YAML ni al paquete de despliegue.
7. Proteger `main` contra borrado y force push; restringir el acceso de escritura
   a personas de confianza. Los cambios incorporados a `main` pueden desplegarse.
8. Activar alertas de seguridad y Dependabot. Habilitar Issues y deshabilitar Wiki
   y Discussions, conforme a las decisiones de publicación.

La identidad de Azure debe confiar en el repositorio nuevo y en su entorno;
copiar los YAML no configura esa confianza. Los nombres anteriores generados
automáticamente para los secretos ya no se utilizan. Completar estos pasos antes
de incorporar el workflow actualizado a una rama con despliegue activo.

El backend serializa los despliegues para evitar que se pisen. Su paquete se
construye con `dist`, dependencias, Prisma y manifiestos; no incluye archivos de
entorno locales. Revisar los logs y artefactos publicados para evitar secretos.

La etiqueta prevista es `v1.0.0-demo-publica`. El repositorio nuevo se llama
`pasp` y conserva la base `/pasp/` del frontend.
