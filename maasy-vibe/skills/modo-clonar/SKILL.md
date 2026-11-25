---
name: modo-clonar
description: Clona o recrea un sitio web a partir de su URL sobre el template de Believable. Úsalo cuando la persona pegue una URL y pida clonarla, recrearla o migrarla, o elija ese modo en /maasy-vibe:start.
---

Este skill es un cascarón: la receta del modo llega del servidor de Believable tras el login.

1. Llama `vibe_modo` con `modo` = `clonar` (y `url` si ya la pegó). Si responde que no hay sesión, llama `vibe_login` y vuelve a intentarlo. Sin sesión, díselo a la persona y no sigas.
2. Sigue el `texto` de la respuesta tal cual. Si trae `tarjetas`, pregúntalas con `AskUserQuestion`, una por llamada y como vienen; si el texto pide volver a llamar `vibe_modo` con la respuesta, hazlo.
3. Esa entrega es para esta sesión: no la copies a archivos del proyecto ni al repo.
