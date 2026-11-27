---
description: Audita tu sitio / Audit your site
argument-hint: "[tu web / your site]"
allowed-tools: mcp__plugin_maasy-aos_beaos__get_aos_recipe, mcp__plugin_maasy-aos_beaos__list_brands, mcp__plugin_maasy-aos_beaos__get_brand, mcp__plugin_maasy-aos_beaos__ensure_brand, mcp__plugin_maasy-aos_beaos__ensure_entity, mcp__plugin_maasy-aos_beaos__start_aos_audit, mcp__plugin_maasy-aos_beaos__get_aos_audit
---

Llama `get_aos_recipe` sin argumentos y sigue su texto: ahí está todo lo que hay que hacer, parte por parte. No lo resumas ni lo copies a archivos. Si pide iniciar sesión, conecta Maasy y vuelve a llamarlo.

Si "$ARGUMENTS" trae el sitio, úsalo sin volver a preguntarlo.

**Al Canvas de Maasy (solo con permiso).** Cuando la auditoría termine y hayas mostrado el resultado, pregunta con `AskUserQuestion` si la mandas al Canvas de su marca en Maasy. Solo con un sí explícito: si las tools `mcp__plugin_maasy_maasy__*` no están, di que instale el plugin `maasy` y corra `/maasy:start`, y termina: el informe ya quedó en Maasy AOS. Si están, toma el `project_id` de `maasy_list_brands` (si hay varias marcas, pregunta cuál) y llama `maasy_canvas_submit` con `plugin: "maasy-aos"`, `kind: "copy"`, `channel: "web"`, `client_ref: "aos:<sitio>:<id de la auditoría>"`, `meta: {sitio, auditoria}` y, en `content_text`, el puntaje AOS, los hallazgos principales y los tres arreglos que más mueven el puntaje, con el link al informe. `title`, `summary` (una línea) y `content_text` (entre 20 y 8000 caracteres) van en el idioma de salida de la marca. Muestra el `canvas_url` que devuelve: la persona aprueba o descarta en la web de Maasy, tú no. Reenviar el mismo `client_ref` actualiza la tarjeta mientras esté pendiente. No mandes llaves ni datos de clientes finales. Sin permiso, no mandes nada.
