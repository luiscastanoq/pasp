# Guía de usuario de PASP

Esta guía describe las funciones visibles en la interfaz actual de PASP. La
versión pública es una demostración pública con datos completamente
ficticios y no está destinada al tratamiento de información personal real.

## Perfiles de usuario

| Perfil           | Función principal                                                  |
| ---------------- | ------------------------------------------------------------------ |
| Administrador    | Gestionar usuarios, perfiles y asignaciones.                       |
| Tutor de empresa | Gestionar y realizar el seguimiento de sus becarios.               |
| Tutor académico  | Consultar la información y evaluaciones de sus becarios asignados. |
| Becario          | Consultar su perfil, gestionar tareas y registrar su jornada.      |

Después de identificarse, cada usuario es dirigido automáticamente al panel que
corresponde a su rol.

## Acceso

### Explorar la demostración pública

1. Abrir `https://luiscastanoq.github.io/pasp/`.
2. Pulsar **Explora la aplicación (demo) →**.
3. Elegir Administrador, Tutor de empresa, Tutor académico o Becario.
4. Pulsar el botón de acceso del perfil elegido.

No es necesario introducir credenciales. La sesión permite consultar datos
ficticios y recorrer los formularios. Si se intenta crear, editar o eliminar
información, la API rechaza la operación y la interfaz explica que el cambio no
se ha aplicado por tratarse de la versión demo.

### Iniciar sesión con credenciales

1. Abrir la dirección de PASP facilitada para el entorno privado.
2. Introducir el correo y la contraseña.
3. Pulsar **Iniciar sesión**.

En la base pública, las cuentas ordinarias que intenten acceder con contraseña
quedan también en modo de solo lectura. La cuenta privada de superadministración
conserva todos sus permisos.

En determinados momentos la pantalla puede indicar que está preparando el
sistema o la conexión. PASP esperará a que la base de datos responda y volverá a
intentar el acceso durante un tiempo limitado. No es necesario recargar la
página mientras se muestre ese estado.

Si el sistema tarda más de lo esperado, se mostrará un mensaje para volver a
intentarlo más tarde. Tras varios intentos de acceso fallidos también puede
aplicarse un bloqueo temporal.

La aplicación no ofrece actualmente recuperación de contraseña. Si el usuario
no conoce su contraseña, será necesaria la intervención de un administrador para que se la reestablezca.

### Primer acceso

Las cuentas nuevas reciben una contraseña temporal y quedan marcadas como
pendientes de primer acceso. Después de identificarse, el usuario no podrá
entrar en su panel hasta cambiarla.

El mismo cambio obligatorio se aplica cuando un administrador restablece la
contraseña de una cuenta existente a una nueva contraseña temporal. En ese
caso, la cuenta vuelve a quedar pendiente de primer acceso hasta que el usuario
establezca una contraseña personal.

La nueva contraseña debe contener:

- Un mínimo de ocho caracteres.
- Al menos una letra mayúscula.
- Al menos una letra minúscula.
- Al menos un número.
- Al menos uno de estos caracteres: `! @ # $ % ^ & *`.

Para completar el cambio:

1. Introducir la contraseña temporal en **Contraseña actual**.
2. Escribir la nueva contraseña.
3. Repetirla exactamente en el campo de confirmación.
4. Pulsar **Cambiar contraseña**.

La opción **Volver al login** cancela el proceso y cierra la sesión. PASP no
muestra actualmente una opción general para cambiar de nuevo la contraseña
después de completar el primer acceso.

### Cabecera y cierre de sesión

La cabecera muestra el nombre, las iniciales y el rol del usuario.

- El icono de inicio vuelve al panel principal.
- El menú situado junto al nombre contiene **Cerrar sesión**.

El cierre de sesión elimina del navegador el token y los datos de la sesión. Al
terminar de utilizar un equipo compartido debe cerrarse la sesión y comprobarse
que vuelve a aparecer la pantalla de acceso. La sesión se almacena únicamente en
la pestaña actual y también desaparece al cerrarla.

## Administrador

### Panel de administración

El panel muestra:

- Total de usuarios.
- Usuarios activos.
- Usuarios inactivos.
- Usuarios pendientes de completar el primer acceso.

La tabla permite buscar por nombre, apellidos o correo y filtrar por:

- Rol.
- Estado activo o deshabilitado.
- Primer acceso pendiente o completado.

Los resultados están paginados. Seleccionar un usuario o utilizar el botón de
edición abre el formulario correspondiente a su perfil.

### Crear un usuario

1. Abrir la opción para crear un usuario.
2. Seleccionar primero el rol.
3. Completar los campos obligatorios.
4. Revisar las asignaciones que correspondan al perfil.
5. Guardar el usuario.

La pantalla genera automáticamente una contraseña temporal numérica y la
muestra en el formulario. Al finalizar, el mensaje de confirmación del
administrador también muestra esa contraseña durante unos segundos.

Debe copiarse únicamente para entregarla al usuario por un canal autorizado. No
debe incluirse en incidencias, documentos públicos, capturas de pantalla ni
mensajes sin protección.

#### Administrador

Se solicitan los datos básicos de identificación y acceso. Los campos de
práctica y cliente no se aplican a este rol.

#### Tutor académico

Además de los datos básicos, pueden seleccionarse los becarios que quedarán
asignados al tutor.

#### Tutor de empresa

Se indican práctica y cliente. También pueden seleccionarse becarios y el tipo
de tutoría de empresa que mantiene con cada uno.

#### Becario

El formulario reúne:

- Datos de usuario y acceso.
- Práctica y cliente.
- Fechas y horas de la práctica.
- Tipo de formación y centro de estudios.
- Datos personales de contacto.
- Información corporativa.
- Tutores asignados y tipo de cada tutoría.

Cada tipo de tutoría solo puede asignarse una vez al mismo becario. La
aplicación señalará las asignaciones duplicadas o incompletas antes de guardar.

### Editar usuarios y asignaciones

Desde la tabla de administración puede abrirse la edición del usuario. Los
campos disponibles dependen de su rol.

Al editar tutores o becarios debe revisarse también la sección de asignaciones:

- Becarios de un tutor académico.
- Becarios de un tutor de empresa.
- Tutores de un becario.

Guardar una lista de asignaciones sustituye la configuración anterior por la
nueva selección. Antes de confirmar conviene comprobar que no se ha omitido un
tutor o becario que deba mantenerse.

### Habilitar y deshabilitar

El botón de estado cambia un usuario entre activo y deshabilitado.

Deshabilitar conserva el usuario y sus relaciones, pero impide su uso normal.
Es la opción recomendada cuando la cuenta puede necesitarse de nuevo o cuando
sus datos deben conservarse.

### Eliminar

La eliminación requiere una confirmación y no puede deshacerse desde la
interfaz.

No pueden eliminarse el superadministrador ni el propio usuario administrador
que está realizando la operación. Además, una eliminación puede ser rechazada
si el usuario conserva fichajes, tareas, evaluaciones u otras relaciones.

Para datos reales debe preferirse la desactivación salvo que exista una política
de eliminación definida y se hayan revisado las dependencias.

## Tutor de empresa

### Panel del tutor

El panel muestra los becarios asignados al tutor e incluye:

- Nombre y correo.
- Último fichaje.
- Estado de la cuenta.
- Estado del primer acceso.
- Resumen de tareas.
- Acciones de gestión.

Es posible buscar por nombre, apellidos o correo y recorrer los resultados
paginados.

### Añadir un becario

La opción **Añadir becario** crea un usuario nuevo y lo asocia obligatoriamente
al tutor que realiza el alta. Su tipo de tutoría se propone inicialmente como
**Empresa Principal**, pero puede cambiarse a **Empresa Secundario** antes de
guardar.

1. Completar los datos de usuario y del período de prácticas.
2. Anotar de forma segura la contraseña temporal mostrada en el formulario.
3. Revisar el tipo de tutoría del tutor actual y cambiarlo si corresponde.
4. Añadir otros tutores si corresponde.
5. Asignar un tipo distinto a cada tutor.
6. Guardar.

El tutor actual no puede desasignarse durante el alta, aunque sí puede elegirse
su tipo de tutoría. No es obligatorio que exista un tutor de empresa principal:
el becario puede crearse únicamente con un tutor de empresa secundario. Después
de guardar, la aplicación vuelve al panel y no vuelve a mostrar la contraseña
temporal.

### Administrar un becario

Desde la tabla se puede:

- Abrir el detalle pulsando la fila.
- Editar el perfil.
- Habilitar o deshabilitar la cuenta.
- Eliminar el usuario, previa confirmación.

La eliminación es irreversible y puede fallar si existen datos relacionados.
Debe utilizarse con las mismas precauciones indicadas para el administrador.

### Detalle y seguimiento

El detalle del becario reúne:

- Datos corporativos.
- Datos personales.
- Datos académicos.
- Tutores asignados.
- Tareas.
- Últimos fichajes e historial.
- Evaluaciones.

El tutor puede editar parte del perfil mediante las opciones disponibles en la
pantalla.

### Tareas

El tutor puede:

- Asignar una tarea.
- Indicar nombre, descripción y fechas.
- Cambiar su estado.
- Editar sus datos.
- Consultar el historial de cambios.
- Eliminarla.

Los estados disponibles son:

```text
Pendiente
En progreso
Completada
```

Los cambios de estado quedan registrados con el usuario y la fecha. Antes de
eliminar una tarea debe tenerse en cuenta que también se elimina su historial.

### Fichajes

El tutor puede consultar los últimos fichajes del becario y abrir el historial
completo. La interfaz de tutor no registra la entrada o salida en nombre del
becario.

### Evaluaciones

La pantalla de evaluaciones permite crear, consultar y eliminar evaluaciones
del becario.

Una evaluación contiene:

- Título.
- Comentarios.
- Puntualidad.
- Calidad.
- Actitud.
- Autonomía.
- Comunicación.

Cada criterio se puntúa con un entero del 1 al 5. PASP calcula y muestra la
puntuación media.

La eliminación de una evaluación solicita confirmación y no dispone de
restauración desde la interfaz.

## Tutor académico

### Panel académico

El panel muestra únicamente los becarios asignados al tutor académico. Permite:

- Buscar por nombre, apellidos o correo.
- Consultar horas de contrato.
- Consultar fechas de inicio y fin.
- Ver el estado del becario.
- Abrir su detalle.

Si un becario no forma parte de las asignaciones del tutor, su información no
estará disponible aunque se intente abrir directamente la URL.

### Consulta del becario

El detalle se divide en:

- Datos corporativos.
- Datos personales.
- Datos académicos.
- Tutores asignados.

El botón **Evaluaciones** abre el historial de evaluaciones del becario.

El acceso del tutor académico es de solo lectura. No puede crear ni eliminar
evaluaciones, modificar el perfil, gestionar tareas ni editar fichajes desde su
interfaz.

## Becario

### Perfil

El panel del becario presenta:

- Identidad y estado actual.
- Tablón de tareas.
- Estado del fichaje del día.
- Últimos fichajes.
- Datos corporativos, personales y académicos.
- Tutores asignados.

### Editar datos personales

La opción **Editar** de la sección personal permite modificar:

- Teléfono personal.
- Correo personal.
- Enlace de LinkedIn.

Los datos corporativos, académicos y de la práctica no pueden modificarse desde
el perfil del becario. Cualquier corrección requiere la intervención de un
tutor de empresa o administrador.

### Fichar

PASP permite un único fichaje por becario y día.

1. Pulsar **Fichar**.
2. Si todavía no existe fichaje, seleccionar **Fichar entrada**.
3. Al terminar la jornada, volver a abrir **Fichar**.
4. Introducir las horas que se desean imputar.
5. Seleccionar **Fichar salida**.

Las horas imputadas deben estar entre `0,5` y `16`. No es posible registrar una
segunda entrada el mismo día ni cerrar dos veces la misma jornada.

**Ver historial** muestra los fichajes anteriores. El panel también presenta un
resumen de los últimos registros.

### Tareas

El tablón muestra las tareas asignadas. El becario puede:

- Abrir el detalle.
- Consultar descripción y fechas.
- Cambiar el estado.
- Consultar el historial de cambios.

Los estados son pendiente, en progreso y completada. El cambio queda registrado
en el historial de la tarea.

La interfaz actual del becario no incluye una sección para consultar sus
evaluaciones.

## Mensajes y situaciones habituales

### Sesión caducada

Cuando el JWT deja de ser válido, PASP elimina la sesión y muestra **Sesión
expirada**. El usuario puede pulsar **Volver al Login**; si no realiza ninguna
acción, la redirección se produce automáticamente después de cinco segundos.

Los cambios no guardados pueden perderse al caducar la sesión.

### Acceso no permitido

Si un usuario intenta abrir una pantalla reservada a otro rol, aparece
**Acceso no permitido**. La opción **Ir a mi panel** devuelve al área
correspondiente.

La ocultación de botones no es la única protección: el backend vuelve a
comprobar el rol en cada operación protegida.

### Error de conexión

Si una pantalla no puede cargar sus datos:

1. Comprobar que existe conexión de red.
2. Esperar unos instantes si el sistema se está preparando.
3. Utilizar **Reintentar** cuando aparezca.
4. Evitar repetir una operación de escritura si ya se mostró una confirmación.
5. Si el error persiste, comunicar la hora, el rol y la acción realizada, sin
   adjuntar contraseñas ni datos personales innecesarios.

## Tratamiento responsable de la información

PASP maneja datos personales, académicos y de seguimiento de actividad.

- Introducir solo la información necesaria.
- No usar datos reales en demostraciones o pruebas.
- No compartir contraseñas temporales mediante canales no autorizados.
- Cerrar sesión al terminar.
- No guardar capturas con datos personales salvo que sea imprescindible y esté
  autorizado.
- Comunicar accesos incorrectos o exposición de datos a la persona responsable.

Los mecanismos de seguridad implementados se describen en
`docs/SECURITY.md`.
