---
description: Escribe la semana de Instagram de una marca en BeFeed
argument-hint: <cuenta> [desde AAAA-MM-DD]
---

Vas a escribir una semana de Instagram orgánico para la cuenta $ARGUMENTS en BeFeed (servidor `maasy-feed`).

1. Llama `marcas` y confirma que la cuenta está. Si no aparece, sugiere `/maasy-feed:conectar`.
2. Llama `metodo` sin sección y sigue la guía que devuelve. Pide las secciones que la guía indique, cuando las necesites.
3. Antes de escribir, lee `ultimo_cierre`, `marca` y `metricas` de esa cuenta.
4. Crea la semana con `crear_semana` y cada pieza con `guardar_pieza`. Pasa los textos por `revisar_voz` antes de guardarlos y corrige lo que marque.
5. Cuando una pieza esté lista para revisión, `pasar_a_filtros`. Si la persona quiere una hora, `programar_pieza` la deja como propuesta.

6. **Al Canvas de Maasy (solo con permiso).** Cuando la semana esté escrita y sus piezas en filtros, pregunta con `AskUserQuestion` si la mandas al Canvas de su marca en Maasy. Solo con un sí explícito: si las tools `mcp__plugin_maasy_maasy__*` no están, di que instale el plugin `maasy` y corra `/maasy:start`, y termina: la semana ya quedó en BeFeed. Si están, toma el `project_id` de `maasy_list_brands` (si hay varias marcas, pregunta cuál) y llama `maasy_canvas_submit` con `plugin: "maasy-feed"`, `kind: "copy"`, `channel: "instagram"`, `client_ref: "feed:<cuenta>:<fecha de inicio de la semana>"`, `meta: {cuenta, semana}` y, en `content_text`, cada pieza con su día, formato y texto. Va una sola tarjeta por semana. `title`, `summary` (una línea) y `content_text` (entre 20 y 8000 caracteres) van en el idioma de salida de la marca. Muestra el `canvas_url` que devuelve: la persona aprueba o descarta en la web de Maasy, tú no. Reenviar el mismo `client_ref` actualiza la tarjeta mientras esté pendiente. No mandes llaves ni datos de clientes finales. Sin permiso, no mandes nada.

Habla con la persona en su idioma. Las piezas se escriben en el idioma de la marca. Aprobar y publicar los hace la persona en la web de Maasy: no digas que algo quedó publicado.
