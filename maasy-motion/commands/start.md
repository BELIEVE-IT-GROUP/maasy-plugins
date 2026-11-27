---
description: Empieza con Maasy Motion. Trae tu marca de Maasy y arma un video en tu Mac
argument-hint: "[qué video quieres]"
allowed-tools: mcp__plugin_maasy_maasy__maasy_list_brands, mcp__plugin_maasy_maasy__maasy_get_design_md, mcp__plugin_maasy_maasy__maasy_get_brand_dna, mcp__plugin_maasy_maasy__maasy_get_brand_context, mcp__plugin_maasy_maasy__maasy_get_motion_recipe, mcp__plugin_maasy_maasy__maasy_upload_asset, mcp__plugin_maasy_maasy__maasy_canvas_list, mcp__plugin_maasy-motion_becut__doctor, mcp__plugin_maasy-motion_becut__motion_panel, mcp__plugin_maasy-motion_becut__brand_put, mcp__plugin_maasy-motion_becut__brand_reconcile, mcp__plugin_maasy-motion_becut__brand_list, mcp__plugin_maasy-motion_becut__brand_set, mcp__plugin_maasy-motion_becut__hub_new_film, mcp__plugin_maasy-motion_becut__hub_live, mcp__plugin_maasy-motion_becut__hub_frame, mcp__plugin_maasy-motion_becut__hub_notes, mcp__plugin_maasy-motion_becut__hub_lang_scan, mcp__plugin_maasy-motion_becut__film_poster, mcp__plugin_maasy-motion_becut__asset_upload, mcp__plugin_maasy-motion_becut__fal_run, Bash(uname -m), Bash(sw_vers -productVersion), Read(~/Movies/BeCut/films/**), Edit(~/Movies/BeCut/films/**), AskUserQuestion
---

Maasy Motion usa la sesión del plugin `maasy` y la app Maasy Motion instalada en este Mac. El método de trabajo lo manda
el servidor de Maasy, por partes y marcado con tu cuenta: no lo inventes, no lo cambies y no lo copies a otros archivos.

1. **Sesión de Maasy.** Las tools de Maasy llegan del servidor de Maasy que exista en tu sesión, con el prefijo que
   Claude Code le ponga (el del plugin, el conector de tu cuenta o el nombre que use la app de escritorio). Es la misma
   cuenta: pide cada tool por su nombre corto, `maasy_*`, sin prefijo. Si Claude Code pide permiso para una tool de
   Maasy, es lo normal cuando viene del conector: pídeselo a la persona y sigue cuando lo dé. Si no tienes
   ninguna tool `maasy_*`, detente y muestra estas dos líneas: `/plugin install maasy` y después `/maasy:start`.
   Si las tienes pero faltan `maasy_get_motion_recipe` o `maasy_canvas_submit`, el plugin está bien y lo que falta es
   iniciar sesión con la cuenta: dile a la persona que escriba `/mcp`, elija el servidor de Maasy que aparezca (el del
   plugin, el conector de tu cuenta o el nombre que le ponga la app de escritorio) y "Authenticate", y que vuelva a
   escribir `/maasy-motion:start`. Reinstalar no lo arregla. Si `maasy_list_brands` pide iniciar sesión, conecta Maasy (sigue
   lo que diga Claude) y vuelve a llamarla. Sin sesión no sigas.
2. **El Mac y la app.** Maasy Motion corre en Mac con Apple Silicon y macOS 13 o más. Llama `doctor` de BeCut. Si la
   tool no responde, mira `uname -m` y `sw_vers -productVersion`: si no es `arm64` o la versión es menor que 13, dilo y
   detente. Si el Mac sirve, la app no está instalada: lee
   `https://files.believe-global.com/apps/maasy-motion/latest.json` y muestra el enlace de su campo `url` para bajar el
   instalador (la carpeta sola no abre). Que la persona instale Maasy Motion, la abra una vez y reinicie Claude. Si en el
   Mac hay otra app de video (por ejemplo BeCut) pero no existe `/Applications/Maasy Motion.app`, no es un problema de
   configuración ni sirve abrir la otra: falta instalar Maasy Motion. Si `doctor` marca piezas que faltan,
   muestra el arreglo que trae cada una y espera a que la persona lo haga.
3. **La marca.** Con `maasy_list_brands`, primero pasa todas las marcas de la cuenta a `brand_reconcile` (`slugs`: el
   `id` de cada una): los kits de marcas que ya no están en la cuenta se archivan y dejan de salir en el selector (los
   videos que los usan siguen abriendo), y los que volvieron se restauran. No borra nada. Si `maasy_list_brands` no
   trae marcas, no la llames. Después pregunta con `AskUserQuestion` cuál usar (si hay una sola, úsala). Trae
   `maasy_get_design_md`, `maasy_get_brand_dna` y los logos de `maasy_get_brand_context` (`logo_urls`), y pásalo todo a
   `brand_put` (`name`, `project_id`, `design_md`, `dna`, `logos`, `industry`, `website`). BeCut guarda el kit; no
   le pases tokens ni llaves. Si la marca no trae `design_md`, ADN ni logos, dilo antes de seguir: sin identidad visual el
   video sale genérico. Ofrece completarla primero con `/maasy:start` y sigue solo si la persona prefiere avanzar así.
4. **El método.** Llama `maasy_get_motion_recipe` sin `parte`: devuelve el índice. Pide solo la parte que el paso de
   ahora necesita, una por vez, y síguela. Lo que llegue es de la cuenta de la persona: no lo pegues en el chat entero.
5. **El video.** Crea el film con `hub_new_film` y `brand=` el slug que devolvió `brand_put`, muéstralo con `hub_live`,
   mira tus cuadros con `hub_frame` y deja que la persona revise y comente en la app (`hub_notes`). No renderices: el
   render lo hace la persona en la app cuando le guste.
6. **Al canvas de Maasy (solo con permiso).** Cuando haya un render final, pregunta con `AskUserQuestion` si lo mandas al
   canvas de su marca. Solo con un sí explícito, primero deja el póster con `film_poster` (`t` = el segundo del cuadro
   del gancho, de 0 a 1 s: el póster de la tarjeta es esa imagen; queda como `poster.jpg` en la carpeta del video) y
   después, por cada archivo (el video y `poster.jpg`):
   `asset_upload` de BeCut sin `url` (te da `file_name`, `mime_type`, `size_bytes` y `asset_class`),
   `maasy_upload_asset` con `action=prepare` y esa clase (`canvas_video` para el MP4, `canvas_image` para el póster),
   `asset_upload` con la `upload_url` y los `headers` que devolvió, y `maasy_upload_asset` con `action=confirm` y el
   `upload_id`. El envío al canvas pesa menos de 50 MB (6 Mbps); si `asset_upload` dice que pesa más, pide a la persona
   un render más liviano y no subas el máster. Después, `maasy_canvas_submit` con `kind: "video"`,
   `plugin: "maasy-motion"`, `client_ref: "film:<id>:v<versión>"` (y `parent_ref` con el de la versión anterior si la
   hubo), `title`, `content_text` (el guion, en el idioma de salida de la marca), `duration_s`,
   `media: [{upload_id, role: "main"}, {upload_id, role: "poster"}]`, `meta` y `panel`: lo que
   devuelve `motion_panel` con ese `film` y `brandId` = el `project_id`, llamado justo antes y sin cambiarlo (si falla,
   manda la tarjeta sin `panel`). `meta` = `{film_id, version, notas_abiertas, notas_corregidas, loudness_lufs, recipe}`
   más dos campos opcionales, `hook` y `sound`: `notas_abiertas` y `notas_corregidas` son los conteos de `hub_notes` con
   `status: "all"` (abiertas = `open`, `claude` o `still`; corregidas = `fixed`); `loudness_lufs` es el LUFS del bloque
   Versiones de `motion_panel` para la versión que envías; `recipe` es solo la etiqueta de versión que devuelve
   `maasy_get_motion_recipe` (por ejemplo `1.6.0`), nunca su contenido; `hook` es el texto en pantalla del gancho, de 0
   a 3 s, sacado de lo que el film ya tiene (`KE.text` de 0 a 3 s, o `hub_lang_scan` `action=texts`), en el idioma de
   salida y con máximo 140 caracteres; `sound` es `"sin audio"` cuando el render final no tiene pista de audio, y ahí no
   va `loudness_lufs`. El meta pesa menos de 2 KB. Si un dato no está, se omite: nunca se inventa. Muestra el
   `canvas_url` que devuelve: la persona aprueba o descarta en la web. Registra la tarjeta con `asset_upload` (`film`,
   `file` = el video, `card` = el id o el `canvas_url` de la tarjeta, `version`): sin eso la app sigue mostrando que
   falta enviarlo. Después llama otra vez `motion_panel` y repite el mismo `maasy_canvas_submit` (mismos campos y `client_ref`) con ese `panel`: así la tarjeta ya no dice que falta enviarla. Si alguna de esas tools no existe todavía, dilo
   y deja el render en el Mac. Sin permiso, no subas nada.
7. **Lo que la persona juzgó.** Al empezar un video nuevo, `maasy_canvas_list` con `plugin: "maasy-motion"` te dice
   qué aprobó y qué descartó (con su motivo): tenlo en cuenta en el guion y en el look.

Si "$ARGUMENTS" dice qué video quiere la persona, úsalo como el encargo del paso 5 sin volver a preguntarlo.
