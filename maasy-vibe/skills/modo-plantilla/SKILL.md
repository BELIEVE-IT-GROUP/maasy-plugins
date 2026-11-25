---
name: modo-plantilla
description: Empieza una app de Believable desde una plantilla (landing, dashboard, CRUD, tienda, waitlist o en blanco). Úsalo cuando la persona pida arrancar desde una plantilla o elija ese modo en /maasy-vibe:start.
---

Este skill es un cascarón: la receta del modo llega del servidor de Believable tras el login.

1. Llama `vibe_modo` con `modo` = `plantilla` (y `plantilla` si ya dijo cuál). Si responde que no hay sesión, llama `vibe_login` y vuelve a intentarlo. Sin sesión, díselo a la persona y no sigas.
2. Sigue el `texto` de la respuesta tal cual. Si trae `tarjetas`, pregúntalas con `AskUserQuestion`, una por llamada y como vienen; si el texto pide volver a llamar `vibe_modo` con la respuesta, hazlo.
3. Esa entrega es para esta sesión: no la copies a archivos del proyecto ni al repo.
