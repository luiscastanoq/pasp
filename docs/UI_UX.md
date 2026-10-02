# Interfaz, experiencia de usuario y usabilidad

## Propósito

Este documento describe las decisiones de interfaz (UI), experiencia de usuario
(UX) y usabilidad implementadas en PASP. Su objetivo es facilitar que una futura
continuación del proyecto conserve la identidad visual, los patrones de
interacción y la coherencia entre perfiles.

No sustituye a la guía de uso. Los pasos operativos de cada perfil se encuentran
en [`USER_GUIDE.md`](USER_GUIDE.md); aquí se explica cómo está construida la
experiencia y qué evidencias respaldan su usabilidad.

## Contexto de diseño

La interfaz fue desarrollada por **Luis Alberto Castaño Quero**, estudiante de la
**Universidad de Málaga**, durante su período de prácticas.

El diseño persigue una apariencia corporativa, sobria y funcional. La prioridad
es que cada persona encuentre rápidamente la información y las acciones propias
de su rol, con una densidad adecuada para tareas de administración y seguimiento.

Las referencias visuales generadas con Stitch durante el desarrollo se utilizaron como guía
de composición, jerarquía y espaciado. La implementación final se adaptó al
proyecto real con React, TypeScript y CSS Modules, manteniendo la lógica y los
permisos de la aplicación.

El uso de Stitch para el diseño y de Cline y Codex como apoyo al desarrollo se
describe en [AI-SDD.md](AI-SDD.md).

## Principios de experiencia de usuario

- **Orientación por rol:** cada perfil accede a un panel y a unas acciones
  específicas, evitando mostrar operaciones que no le corresponden.
- **Jerarquía clara:** títulos, tarjetas, secciones y tablas organizan la
  información desde el resumen hasta el detalle.
- **Acciones próximas al contexto:** las operaciones sobre usuarios, tareas,
  fichajes o evaluaciones aparecen junto al elemento afectado.
- **Consistencia:** formularios, botones, mensajes, modales y estados mantienen
  patrones visuales y de interacción comunes.
- **Prevención y explicación de errores:** los datos se validan antes de enviarse
  y los problemas se presentan junto al campo o mediante mensajes visibles.
- **Adaptación al dispositivo:** el contenido cambia de distribución en
  resoluciones reducidas y las tablas permiten desplazamiento horizontal cuando
  no es posible conservar todas sus columnas.

## Identidad visual y sistema de diseño

### Marca y color

La identidad de PASP utiliza el mismo símbolo tipográfico y logotipo en la
pantalla de acceso, la cabecera de la zona privada y el icono del navegador. El
azul de la interfaz constituye el color principal de las acciones y de los
estados de foco.

La paleta diferencia además estados semánticos:

- verde para confirmaciones y resultados correctos;
- rojo para errores y acciones destructivas;
- ámbar para advertencias;
- azul claro para información contextual;
- grises para fondos, bordes y texto secundario.

Los valores reutilizables se declaran principalmente en
`frontend/src/index.css` y `frontend/src/shared/styles/tokens.css`. Este último
archivo concentra los tokens compartidos por los componentes de UI refactorizados.

### Tipografía, espaciado y superficies

La fuente principal es **Inter**, con alternativas del sistema si no está
disponible. La escala tipográfica separa encabezados, texto general, etiquetas y
ayudas. Los encabezados tienen mayor peso y contraste para facilitar el escaneo.

El espaciado sigue una base de 8 px, complementada por un valor de 4 px para
ajustes pequeños. Los formularios y paneles emplean bordes redondeados y sombras
moderadas. Las superficies blancas sobre fondos grises claros delimitan tarjetas,
tablas y modales sin recargar la pantalla.

### Estados interactivos

Los controles contemplan estados normal, hover, foco, activo, deshabilitado y
error. El foco utiliza un borde o anillo azul visible; las acciones destructivas
emplean rojo. Las animaciones son breves y se desactivan o reducen en distintos
componentes cuando el sistema solicita `prefers-reduced-motion`.

## Implementación de la interfaz

### Organización de estilos

La aplicación combina:

- variables globales para colores, tipografía, espaciado, radios y sombras;
- tokens `--pasp-*` para los componentes compartidos refactorizados;
- CSS Modules para aislar los estilos de cada pantalla o componente;
- media queries locales para adaptar cada área según su contenido.

Esta separación permite modificar un módulo sin propagar reglas de forma
accidental a otras pantallas.

### Componentes compartidos

La biblioteca interna situada en `frontend/src/shared/components/ui/` incluye:

- `Button`, con variantes visuales y estado de carga;
- `TextField` y `SelectField`, con etiqueta y error asociado;
- `DatePickerInput`, con calendario y controles accesibles;
- `FormSection`, para agrupar campos relacionados;
- `DataTable`, con contenedor adaptable;
- `Modal`, como base de diálogos;
- `FeedbackBanner`, para comunicar errores;
- `PasswordInput`, fuera de esa carpeta, para mostrar u ocultar contraseñas sin
  perder el valor introducido.

También se reutilizan la cabecera autenticada, tarjetas de tareas y componentes
de detalle. La cabecera presenta identidad, nombre, rol, regreso al panel y cierre
de sesión de manera uniforme.

## Estructura y navegación por perfil

### Acceso y primer uso

El acceso concentra la marca, el nombre del producto y los dos datos necesarios
para iniciar sesión. Durante operaciones asíncronas se desactivan los controles y
se muestran indicadores o mensajes de estado. La contraseña puede mostrarse u
ocultarse mediante un botón con nombre accesible.

Cuando una cuenta debe cambiar su contraseña en el primer acceso, la interfaz
expone los requisitos y valida los tres campos de forma independiente. Las
sesiones caducadas y los accesos no permitidos se explican en una pantalla o
mensaje específico, con una acción para volver a una ruta válida.

### Administrador

El panel de administración utiliza indicadores de resumen, buscador, filtros y
una tabla paginada. La combinación permite localizar usuarios por texto, rol,
estado y situación de primer acceso antes de ejecutar acciones de creación,
edición, habilitación, deshabilitación o eliminación.

Los formularios se dividen en secciones y adaptan sus campos al rol seleccionado.
Las asignaciones de tutores y becarios se resuelven con tablas y modales de
selección, de modo que la relación se visualiza antes de guardarla.

### Tutor de empresa

El panel prioriza la lista de becarios asignados y su búsqueda. Desde el detalle
se agrupan datos personales, académicos y corporativos, junto con tareas,
fichajes y evaluaciones. Las acciones de seguimiento se sitúan en el mismo
contexto que la información del becario.

Las tareas muestran estado e historial, mientras que los modales de creación y
edición mantienen validación y mensajes de resultado. Las evaluaciones emplean
un selector de puntuación explícito y una vista de detalle posterior.

### Tutor académico

La experiencia está orientada a la consulta. El tutor localiza a sus becarios y
accede a sus datos y evaluaciones sin presentar controles de modificación que no
corresponden a su perfil. Esta reducción de acciones ayuda a diferenciar la vista
de seguimiento académico de la gestión realizada por otros roles.

### Becario

El perfil del becario reúne la información corporativa, personal y académica en
secciones y pestañas identificadas. Desde la misma área puede editar los datos
personales permitidos, registrar su jornada y consultar el historial de fichajes.

Las tareas se presentan como elementos interactivos con estado, detalle e
historial. Los cambios de estado utilizan un menú contextual accesible por teclado.

## Patrones de interacción

### Formularios y validación

Los campos conservan etiquetas visibles y no dependen únicamente del placeholder.
Cuando existe un error, el control se identifica con `aria-invalid`, se vincula
con su explicación mediante `aria-describedby` y el mensaje se anuncia con
`role="alert"` en los formularios que utilizan estos componentes.

Las fechas cuentan con un selector visual y controles para cambiar de mes. Las
acciones de envío comunican estados de carga y evitan envíos repetidos mientras
una operación está en curso.

### Tablas, búsqueda, filtros y paginación

Las pantallas con conjuntos amplios de datos aplican una secuencia predecible:
resumen, búsqueda o filtros, tabla y paginación. Las filas accionables incorporan
foco visible y activación por teclado en las vistas que permiten abrir un detalle.

En anchuras reducidas las tablas permanecen dentro de un contenedor desplazable,
evitando que toda la página exceda el ancho de la pantalla.

### Modales y confirmaciones

Las tareas acotadas se resuelven en modales para conservar el contexto de la
pantalla principal. Los diálogos especializados incluyen título, botón de cierre,
acciones diferenciadas y mensajes de error. Las operaciones destructivas se
presentan con color y confirmación propios.

### Retroalimentación

La aplicación emplea mensajes de estado, banners, avisos y estados vacíos para
explicar qué está ocurriendo. Los mensajes de error de autenticación proceden de
la respuesta de la API cuando esta aporta una explicación. Las confirmaciones de
formularios se anuncian mediante regiones de estado con `aria-live` en los
componentes correspondientes.

## Diseño adaptable

La adaptación responsive se implementa en los módulos que la necesitan, con
puntos de ruptura determinados por el contenido. Entre los valores utilizados se
encuentran 1180, 1100, 820, 768, 720, 640, 560 y 520 px.

Los principales cambios son:

- reducción del espacio interior en tarjetas y formularios;
- reorganización de cabeceras, filtros, indicadores y grupos de campos;
- ajuste del tamaño de títulos y controles;
- apilado de acciones cuando el ancho no permite mantenerlas en línea;
- desplazamiento interno de tablas;
- adaptación de modales y vistas de detalle a la altura y anchura disponibles.

## Accesibilidad incorporada

La interfaz incluye mecanismos de accesibilidad semántica y operativa:

- textos alternativos para la marca e iconos decorativos ocultos con
  `aria-hidden`;
- etiquetas y nombres accesibles para campos y botones de icono;
- `aria-expanded`, `aria-haspopup` y `aria-pressed` para comunicar estados;
- roles de pestaña, menú, grupo, diálogo, alerta y estado donde corresponde;
- navegación por teclado en filas, tareas, pestañas y selectores interactivos;
- foco visible en controles y elementos accionables;
- reducción de determinadas animaciones según la preferencia del sistema.

Estas medidas describen lo implementado. No constituyen por sí solas una
certificación de conformidad con WCAG ni el resultado de una auditoría formal de
accesibilidad.

## Reporte de usabilidad

### Alcance y metodología

El reporte es **cualitativo** y se basa en tres fuentes:

1. revisión de los componentes, estilos, rutas y permisos del frontend;
2. revisión de las pruebas unitarias y de los ocho recorridos E2E existentes;
3. comprobación renderizada del acceso en escritorio y en un viewport de
   390 × 844 px, incluyendo recuperación de sesión caducada, cumplimentación del
   formulario y alternancia de visibilidad de la contraseña.

No se realizaron entrevistas, sesiones moderadas ni pruebas con una muestra de
usuarios. Por ello no se asignan puntuaciones, porcentajes de éxito ni tiempos de
tarea. Las pruebas E2E requieren el entorno y los datos descritos en
[`TESTING.md`](TESTING.md).

### Resultados por criterio

| Criterio | Evidencia observada | Valoración cualitativa |
| --- | --- | --- |
| Aprendizaje | Lenguaje directo, etiquetas visibles, acciones próximas al contenido y separación por rol. | La estructura favorece que una persona identifique su tarea principal sin conocer toda la aplicación. |
| Navegación | Redirección al panel propio, cabecera común, regreso al inicio y rutas protegidas. | El modelo de navegación es breve y consistente dentro de cada perfil. |
| Consistencia | Tokens, CSS Modules y componentes compartidos para controles, tablas, formularios y mensajes. | Existe una base visual reconocible entre módulos, incluso cuando cada perfil presenta información distinta. |
| Eficiencia | Buscadores, filtros, indicadores, paginación y acciones contextuales. | Las operaciones frecuentes evitan recorridos innecesarios y permiten acotar conjuntos amplios de datos. |
| Prevención de errores | Validación previa, campos inválidos identificados, confirmaciones y controles desactivados durante el envío. | La interfaz reduce envíos incompletos, repeticiones y acciones destructivas accidentales. |
| Recuperación | Mensajes de API, alertas, sesión caducada con retorno al acceso y acceso denegado con vuelta al panel. | Los estados excepcionales ofrecen explicación y una salida comprensible. |
| Retroalimentación | Indicadores de carga, mensajes de preparación, estados vacíos, banners y confirmaciones. | La persona recibe información sobre el progreso y el resultado de las acciones relevantes. |
| Legibilidad | Inter, contraste de encabezados, agrupación en tarjetas y jerarquía entre resumen y detalle. | El contenido se puede recorrer visualmente y mantiene una densidad apropiada para gestión interna. |
| Accesibilidad | Semántica ARIA, foco visible, teclado y preferencia de movimiento reducido en componentes clave. | La implementación incorpora una base accesible verificable en código, sin equivaler a una auditoría WCAG completa. |
| Responsive | Media queries distribuidas por módulo; el acceso no presentó desbordamiento a 390 px. | La interfaz está preparada para escritorio y anchuras reducidas, con adaptación específica según el contenido. |

### Cobertura de recorridos esenciales

Las pruebas automatizadas reflejan los recorridos que más influyen en la
usabilidad del sistema:

- visualización e interacción con el formulario de acceso;
- entrada de un administrador en su panel;
- creación, edición y deshabilitación de usuarios;
- rechazo del acceso de un becario al panel de administración;
- consulta académica de becarios y evaluaciones en modo de solo lectura;
- creación de una evaluación completa;
- registro de jornada y comunicación de conflictos reales de fichaje;
- actualización compartida del estado e historial de una tarea entre tutor y
  becario.

Los tests de componentes añaden cobertura sobre mensajes de autenticación,
visibilidad de contraseñas, navegación compartida, validación accesible, tablas,
paginación, puntuaciones, modales, tareas y fichajes.

### Conclusión

PASP presenta una experiencia coherente con su finalidad interna: separa las
responsabilidades por perfil, hace visibles las acciones principales y acompaña
los flujos con validación y retroalimentación. La reutilización de patrones y la
adaptación responsive proporcionan una base mantenible para ampliar la
aplicación sin redefinir su lenguaje visual.

El alcance de este reporte permite afirmar que los mecanismos descritos existen
y que los recorridos principales están representados en las pruebas. Una futura
evaluación con usuarios reales podría medir eficacia, eficiencia y satisfacción,
pero no forma parte de la evidencia disponible en este proyecto.

## Archivos de referencia

- `frontend/src/index.css`: sistema global de diseño y tipografía.
- `frontend/src/shared/styles/tokens.css`: tokens de los componentes compartidos.
- `frontend/src/shared/components/ui/`: biblioteca interna de UI.
- `frontend/src/shared/components/Header.tsx`: navegación común autenticada.
- `frontend/src/features/`: pantallas y componentes organizados por dominio.
- `frontend/e2e/`: recorridos funcionales de extremo a extremo.
- `frontend/src/**/*.test.tsx`: pruebas unitarias y de interacción.

---

Última actualización: 1 de agosto de 2026.
