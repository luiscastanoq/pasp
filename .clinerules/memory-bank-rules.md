# MEMORY BANK OPERATING COVENANT

> [!NOTE]
> Reglas históricas de Cline conservadas como evidencia documental. No son las
> instrucciones operativas actuales del repositorio; para estas debe consultarse
> `AGENTS.md`.

Eres un agente de Cline. Tu éxito depende de la integridad de tu memoria persistente. Debido
a que tu memoria se reinicia en cada sesión, debes usar el **Memory Bank** como tu única fuen
te de verdad.

## 1. Verificación Inicial (Lectura Obligatoria)

Al inicio de cada tarea, **debes leer todos** los archivos de la carpeta `.cline/memory`. No
es opcional:

- **`projectbrief.md`**: Para entender el "qué" y el alcance del proyecto.
- **`productContext.md`**: Para entender el "por qué", los problemas que resolvemos y la expe
  riencia de usuario esperada.
- **`systemPatterns.md`**: Para entender el "cómo" (Arquitectura, patrones de diseño, Signal
  s, flujos de datos).
- **`techContext.md`**: Para entender el stack técnico, versiones, dependencias y limitacione
  s del entorno.
- **`activeContext.md`**: Para entender el "ahora", decisiones recientes y en qué punto nos q
  uedamos.
- **`progress.md`**: Para ver el estado de los hitos y qué falta por construir.

## 2. Actualización en Tiempo Real

- **Modificaciones de Arquitectura:** Si creas un nuevo patrón (ej. un Service con un Signal
  específico) o cambias la estructura, actualiza `systemPatterns.md` de inmediato.
- **Cambios en el Entorno:** Si instalas dependencias o cambias la configuración de desarroll
  o, actualiza `techContext.md`.
- **Estado de Tarea:** Al finalizar cualquier acción significativa, actualiza `activeContext.
md` detallando qué archivos tocaste y por qué.
- **Seguimiento:** Marca los progresos y registra errores conocidos en `progress.md`.

## 3. Resolución de Conflictos

Si el código real contradice lo que dicen los documentos, **el código es la verdad**. En ese
caso:

1. Informa al usuario de la discrepancia.
2. Actualiza el Memory Bank para que refleje la realidad actual del código.

## REGLA CRÍTICA DE FINALIZACIÓN

NO puedes dar una tarea por terminada (no digas "He finalizado" o "Tarea completa") hasta que
hayas realizado los siguientes pasos:

1. **Sincronizar:** Actualizar `systemPatterns.md` y `techContext.md` si hubo cambios estruct
   urales o técnicos.
2. **Actualizar Progreso:** Marcar hitos en `progress.md`.
3. **Definir el Siguiente Paso:** Actualizar `activeContext.md` con el estado actual y una re
   comendación clara de qué debe hacerse a continuación.
4. **Resumen de Memoria:** Indicar explícitamente qué archivos de la carpeta `.cline/memory`
   han sido modificados.
