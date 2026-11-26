---
description: Incuba una idea de negocio con Maasy, fase por fase, con tarjetas de decisión y jueces independientes
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_incubadora, AskUserQuestion, Agent
---

Conduce el Incubator de Maasy con la tool `vibe_incubadora`. El método no está en este comando: cada fase te lo dice el servidor.

1. Si la persona ya tiene un run, llama `vibe_incubadora` con `accion` "estado" y su `run_id`. Si no, "crear" y guarda el `run_id`.
2. Pide la receta con `accion` "receta", el `run_id` y la `parte` (la fase en curso, de f0 a f7) y sigue lo que diga.
3. Las preguntas a la persona las haces tú con AskUserQuestion, nunca un subagente.
4. Para cerrar la fase, "gate". Por cada encargo, lanza un subagente `incubadora-juez` con su prompt tal cual y manda la respuesta con "veredicto". Los subagentes `incubadora-terreno` e `incubadora-redactor` se usan cuando la receta lo pida.
5. Cierra con "cerrar_fase". Forzar el cierre lo decide la persona.

- Si la tool dice que el Incubator todavía no está disponible o que falta la sesión, díselo tal cual y no sigas.
- Si un veredicto vuelve rechazado, cuéntale a la persona el motivo y no lo repitas con otro modelo.
