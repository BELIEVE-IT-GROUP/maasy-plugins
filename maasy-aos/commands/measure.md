---
description: Mide el APS con tus llaves / Measure APS with your keys
argument-hint: "[marca / brand]"
allowed-tools: mcp__plugin_maasy-aos_beaos__get_aos_recipe, mcp__plugin_maasy-aos_beaos__list_brands, mcp__plugin_maasy-aos_beaos__get_brand, mcp__plugin_maasy-aos_beaos__ensure_prompt_library, mcp__plugin_maasy-aos_beaos__start_aps_run, mcp__plugin_maasy-aos_beaos__list_aps_runs, mcp__plugin_maasy-aos_beaos__get_aps_score_detail, AskUserQuestion
---

Llama `get_aos_recipe` con `parte: "medir"` y sigue su texto. Las `tarjetas` se preguntan con `AskUserQuestion` tal cual vienen, y no se gasta nada sin la respuesta.

Si "$ARGUMENTS" trae la marca, úsala sin volver a preguntarlo.

**Al Canvas de Maasy (solo con permiso).** Cuando la corrida termine y hayas mostrado el APS medido, pregunta con `AskUserQuestion` si la mandas al Canvas de su marca en Maasy. Solo con un sí explícito: si las tools `mcp__plugin_maasy_maasy__*` no están, di que instale el plugin `maasy` y corra `/maasy:start`, y termina: la corrida ya quedó en Maasy AOS. Si están, toma el `project_id` de `maasy_list_brands` (si hay varias marcas, pregunta cuál) y llama `maasy_canvas_submit` con `plugin: "maasy-aos"`, `kind: "copy"`, `channel: "web"`, `client_ref: "aps:<marca>:<id de la corrida>"`, `meta: {marca, corrida}` y, en `content_text`, el APS medido por modelo con su intervalo, las dimensiones más débiles y qué hacer primero. Di que es el medido, no el declarado. `title`, `summary` (una línea) y `content_text` (entre 20 y 8000 caracteres) van en el idioma de salida de la marca. Muestra el `canvas_url` que devuelve: la persona aprueba o descarta en la web de Maasy, tú no. Reenviar el mismo `client_ref` actualiza la tarjeta mientras esté pendiente. No mandes llaves ni datos de clientes finales. Sin permiso, no mandes nada.
