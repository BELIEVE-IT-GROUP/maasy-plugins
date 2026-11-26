---
description: Diseña una campaña de comentario a DM para una cuenta de Instagram
argument-hint: "[cuenta] [qué quieres lograr]"
---

Vamos a diseñar una campaña de Maasy Reply. Lo que pidió la persona: $ARGUMENTS

1. Llama a la tool `receta` del servidor maasy-reply, sin parte, y sigue los pasos que devuelve. Pide cada parte cuando el índice lo indique.
2. Si no sabes la cuenta, llama a `cuentas` y pregunta cuál. Si la lista sale vacía o te niega el permiso (la conexión puede traer solo "Proponer borradores"), no pidas más permisos: pregúntale a la persona el @usuario de Instagram de la cuenta y sigue con ese.
3. Todo lo que guardes queda como borrador. Al final, dile a la persona que lo revise y lo active en la web de Maasy.
4. **Al Canvas de Maasy (solo con permiso).** Cuando la campaña quede guardada como borrador, pregunta con `AskUserQuestion` si la mandas al Canvas de su marca en Maasy. Solo con un sí explícito: si las tools `mcp__plugin_maasy_maasy__*` no están, di que instale el plugin `maasy` y corra `/maasy:start`, y termina: el borrador ya quedó en Maasy Reply. Si están, toma el `project_id` de `maasy_list_brands` (si hay varias marcas, pregunta cuál) y llama `maasy_canvas_submit` con `plugin: "maasy-reply"`, `kind: "copy"`, `channel: "instagram"`, `client_ref: "reply:<cuenta>:<id de la campaña>"`, `meta: {cuenta, campana}` y, en `content_text`, la palabra clave, la respuesta al comentario y los mensajes del DM en orden. Activarla sigue siendo en la web de Maasy. `title`, `summary` (una línea) y `content_text` (entre 20 y 8000 caracteres) van en el idioma de salida de la marca. Muestra el `canvas_url` que devuelve: la persona aprueba o descarta en la web de Maasy, tú no. Reenviar el mismo `client_ref` actualiza la tarjeta mientras esté pendiente. No mandes llaves ni datos de clientes finales. Sin permiso, no mandes nada.
