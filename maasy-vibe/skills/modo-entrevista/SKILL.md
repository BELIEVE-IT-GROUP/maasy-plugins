---
name: modo-entrevista
description: Entrevista guiada de Believable: preguntas con tarjetas hasta tener el brief y design.md, y después construye. Úsalo cuando la persona quiera que le preguntes antes de construir o elija ese modo en /maasy-vibe:start.
---

Este skill es un cascarón: la receta del modo llega del servidor de Believable tras el login.

1. Llama `vibe_modo` con `modo` = `entrevista` (y `que` si ya se sabe qué va a construir). Si responde que no hay sesión, llama `vibe_login` y vuelve a intentarlo. Sin sesión, díselo a la persona y no sigas.
2. Sigue el `texto` de la respuesta tal cual. Si trae `tarjetas`, pregúntalas con `AskUserQuestion`, una por llamada y como vienen; si el texto pide volver a llamar `vibe_modo` con la respuesta, hazlo.
3. Esa entrega es para esta sesión: no la copies a archivos del proyecto ni al repo.
