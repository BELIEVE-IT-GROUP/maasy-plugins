---
description: Publica el build de este proyecto en el borde de Believe (<id>.apps.believe-global.com)
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_publish, mcp__plugin_maasy-vibe_vibe__vibe_soul, Bash(npm run build)
---

Publica el proyecto de la carpeta actual con la tool `vibe_publish` del servidor MCP `vibe`.

1. Si el proyecto tiene script `build` en `package.json`, corre `npm run build` primero, para que suba lo último. Si falla, arregla el error y vuelve a compilar antes de seguir.
2. Llama `vibe_publish` con `path` = la ruta absoluta de la carpeta actual.
3. Responde con la URL y lo que diga la verificación por HTTP, en dos o tres líneas.

- Si la tool dice que no hay sesión, dile a la persona que escriba `/maasy-vibe:login`.
- Si dice que se acabó el cupo o que la app es de otra cuenta, muestra ese mensaje tal cual: no intentes otra vía.
- `.believable/project.json` guarda el `publishId` y va al repo: publicar de nuevo actualiza la misma app. No guarda secretos.

**Al Canvas de Maasy (solo con permiso).** Cuando `vibe_publish` devuelva la URL y la verificación por HTTP pase, pregunta con `AskUserQuestion` si la mandas al Canvas de su marca en Maasy. Solo con un sí explícito: si no hay ninguna tool `maasy_*`, di que instale el plugin `maasy` y corra `/maasy:start`, y termina: la app ya quedó publicada. Si están, toma el `project_id` de `maasy_list_brands` (si hay varias marcas, pregunta cuál) y llama `maasy_canvas_submit` del servidor de Maasy que exista con `plugin: "maasy-vibe"`, `kind: "landing"`, `url` (la URL publicada, `https://<id>.apps.believe-global.com`), `url_kind: "published"`, `client_ref: "app:<publishId>:<fecha y hora de esta publicación>"` (y `parent_ref` con el de la publicación anterior si la mandaste), `meta: {publish_id}` y, en `content_text`, las secciones de la página con sus titulares y textos. `title`, `summary` (una línea) y `content_text` (entre 20 y 8000 caracteres) van en el idioma de salida de la marca. Muestra el `canvas_url` que devuelve: la persona aprueba o descarta en la web de Maasy, tú no. Reenviar el mismo `client_ref` actualiza la tarjeta mientras esté pendiente. No mandes llaves ni datos de clientes finales. Sin permiso, no mandes nada.
