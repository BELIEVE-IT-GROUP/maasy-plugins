---
description: Empieza con Maasy Motion. Trae tu marca de Maasy y arma un video en tu Mac
argument-hint: "[qué video quieres]"
allowed-tools: mcp__plugin_maasy_maasy__maasy_list_brands, mcp__plugin_maasy_maasy__maasy_get_design_md, mcp__plugin_maasy_maasy__maasy_get_brand_dna, mcp__plugin_maasy_maasy__maasy_get_brand_context, mcp__plugin_maasy_maasy__maasy_get_motion_recipe, mcp__plugin_maasy_maasy__maasy_upload_asset, mcp__plugin_maasy_maasy__maasy_canvas_submit, mcp__plugin_maasy_maasy__maasy_canvas_list, mcp__plugin_maasy-motion_becut__doctor, mcp__plugin_maasy-motion_becut__brand_put, mcp__plugin_maasy-motion_becut__brand_reconcile, mcp__plugin_maasy-motion_becut__brand_list, mcp__plugin_maasy-motion_becut__brand_set, mcp__plugin_maasy-motion_becut__hub_new_film, mcp__plugin_maasy-motion_becut__hub_live, mcp__plugin_maasy-motion_becut__hub_frame, mcp__plugin_maasy-motion_becut__hub_notes, mcp__plugin_maasy-motion_becut__film_poster, mcp__plugin_maasy-motion_becut__asset_upload, mcp__plugin_maasy-motion_becut__fal_run, Read(~/Movies/BeCut/films/**), Edit(~/Movies/BeCut/films/**), AskUserQuestion
---

Maasy Motion usa la sesión del plugin `maasy` y la app Maasy Motion instalada en este Mac. El método de trabajo lo manda
el servidor de Maasy, por partes y marcado con tu cuenta: no lo inventes, no lo cambies y no lo copies a otros archivos.

1. **Sesión de Maasy.** Si no tienes las tools `mcp__plugin_maasy_maasy__*`, detente y muestra estas dos líneas:
   `/plugin install maasy` y después `/maasy:start`. Si `maasy_list_brands` pide iniciar sesión, conecta Maasy (sigue
   lo que diga Claude) y vuelve a llamarla. Sin sesión no sigas.
2. **La app.** Llama `doctor` de BeCut. Si la tool no responde, la app no está instalada: pide instalar Maasy Motion desde
   su DMG (`https://files.believe-global.com/apps/maasy-motion/`) y abrirla una vez. Si `doctor` marca piezas que faltan,
   muestra el arreglo que trae cada una y espera a que la persona lo haga.
3. **La marca.** Con `maasy_list_brands`, primero pasa todas las marcas de la cuenta a `brand_reconcile` (`slugs`: el
   `id` de cada una): los kits de marcas que ya no están en la cuenta se archivan y dejan de salir en el selector (los
   videos que los usan siguen abriendo), y los que volvieron se restauran. No borra nada. Si `maasy_list_brands` no
   trae marcas, no la llames. Después pregunta con `AskUserQuestion` cuál usar (si hay una sola, úsala). Trae
   `maasy_get_design_md`, `maasy_get_brand_dna` y los logos de `maasy_get_brand_context` (`logo_urls`), y pásalo todo a
   `brand_put` (`name`, `project_id`, `design_md`, `dna`, `logos`, `industry`, `website`). BeCut guarda el kit; no
   le pases tokens ni llaves.
4. **El método.** Llama `maasy_get_motion_recipe` sin `parte`: devuelve el índice. Pide solo la parte que el paso de
   ahora necesita, una por vez, y síguela. Lo que llegue es de la cuenta de la persona: no lo pegues en el chat entero.
5. **El video.** Crea el film con `hub_new_film` y `brand=` el slug que devolvió `brand_put`, muéstralo con `hub_live`,
   mira tus cuadros con `hub_frame` y deja que la persona revise y comente en la app (`hub_notes`). No renderices: el
   render lo hace la persona en la app cuando le guste.
6. **Al canvas de Maasy (solo con permiso).** Cuando haya un render final, pregunta con `AskUserQuestion` si lo mandas al
   canvas de su marca. Solo con un sí explícito, primero deja el póster con `film_poster` (`t` = el segundo del cuadro
   clave; queda como `poster.jpg` en la carpeta del video) y después, por cada archivo (el video y `poster.jpg`):
   `asset_upload` de BeCut sin `url` (te da `file_name`, `mime_type`, `size_bytes` y `asset_class`),
   `maasy_upload_asset` con `action=prepare` y esa clase (`canvas_video` para el MP4, `canvas_image` para el póster),
   `asset_upload` con la `upload_url` y los `headers` que devolvió, y `maasy_upload_asset` con `action=confirm` y el
   `upload_id`. El envío al canvas pesa menos de 50 MB (6 Mbps); si `asset_upload` dice que pesa más, pide a la persona
   un render más liviano y no subas el máster. Después, `maasy_canvas_submit` con `kind: "video"`,
   `plugin: "maasy-motion"`, `client_ref: "film:<id>:v<versión>"` (y `parent_ref` con el de la versión anterior si la
   hubo), `title`, `content_text` (el guion, en el idioma de salida de la marca), `duration_s`,
   `media: [{upload_id, role: "main"}, {upload_id, role: "poster"}]` y `meta: {film_id, version}`. Muestra el
   `canvas_url` que devuelve: la persona aprueba o descarta en la web. Si alguna de esas tools no existe todavía, dilo
   y deja el render en el Mac. Sin permiso, no subas nada.
7. **Lo que la persona juzgó.** Al empezar un video nuevo, `maasy_canvas_list` con `plugin: "maasy-motion"` te dice
   qué aprobó y qué descartó (con su motivo): tenlo en cuenta en el guion y en el look.

Si "$ARGUMENTS" dice qué video quiere la persona, úsalo como el encargo del paso 5 sin volver a preguntarlo.
