---
name: motion
description: Videos con la marca de Maasy en la app Maasy Motion (BeCut) de este Mac. Úsalo cuando la persona pida un video, un Reel, una pieza animada o un cambio a un film de Maasy Motion.
---

Este skill es un índice. El método completo vive en el servidor de Maasy y llega por partes, marcado con la cuenta.

- Si todavía no hay marca en BeCut (`brand_list` vacío), corre primero `/maasy-motion:start`.
- Para cualquier paso del método, pide la parte con `maasy_get_motion_recipe`: sin `parte` devuelve el índice; después
  pide solo la que el paso necesita. No la copies a archivos ni la pegues entera en el chat.
- El film se hace con las tools de BeCut (`hub_new_film`, `hub_live`, `hub_frame`, `hub_notes`). El render lo hace la
  persona en la app.
- Las llaves de servicios (fal, ElevenLabs, HeyGen) van en Ajustes de la app. Nunca las pidas en el chat.
- Mandar un render al canvas de Maasy es el paso 6 de `/maasy-motion:start` y siempre pide permiso antes.
