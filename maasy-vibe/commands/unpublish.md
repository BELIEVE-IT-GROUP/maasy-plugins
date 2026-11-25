---
description: Despublica la app de este proyecto del borde de Believe y libera el cupo del plan
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_unpublish
---

Despublica la app de la carpeta actual con la tool `vibe_unpublish` del servidor MCP `vibe`.

1. Antes de llamarla, confírmalo con la persona: se borra el sitio publicado (`<id>.apps.believe-global.com`) y se libera el cupo de su plan. El código no se toca, y si publica de nuevo la app sale en una dirección nueva.
2. Con el sí, llama `vibe_unpublish` con `path` = la ruta absoluta de la carpeta actual.
3. Responde con lo que diga la tool, en una o dos líneas.

- Si la tool dice que no hay sesión, dile a la persona que escriba `/maasy-vibe:login`.
- Si dice que la app tiene backend o un dominio propio, muestra ese mensaje tal cual: dice qué quitar primero. No intentes otra vía.
- Si dice que no hay publishId, esta carpeta no se publicó desde el plugin: no hay nada que despublicar acá.
