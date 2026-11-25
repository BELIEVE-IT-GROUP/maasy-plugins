---
description: Empieza con Believable. Eliges qué construir y cómo empezar, y Believable te guía
argument-hint: "[lo que quieres construir]"
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_entrada, mcp__plugin_maasy-vibe_vibe__vibe_modo, mcp__plugin_maasy-vibe_vibe__vibe_login, mcp__plugin_maasy-vibe_vibe__vibe_new, mcp__plugin_maasy-vibe_vibe__vibe_soul, mcp__plugin_maasy-vibe_vibe__vibe_diseno, mcp__plugin_maasy-vibe_vibe__vibe_diseno_token, mcp__plugin_maasy-vibe_vibe__vibe_importar, AskUserQuestion, Bash(pwd), Bash(ls:*), Bash(curl -s:*), Bash(npm run dev:*)
---

El punto de entrada de Believable. Las preguntas y lo que pasa con cada respuesta los manda el servidor: no los inventes ni los cambies.

1. Llama `vibe_entrada` sin argumentos. Si la respuesta dice que no hay sesión, llama `vibe_login` (sigue lo que diga) y vuelve a llamar `vibe_entrada`. Sin sesión no sigas.
2. La respuesta trae `preguntas`, en orden. Haz una por vez con `AskUserQuestion`, una tarjeta por llamada, con la pregunta, el encabezado y las opciones tal cual vienen en `tarjetas`. Si la persona elige la opción que dice `mas`, muestra la tarjeta siguiente de esa misma pregunta. Si escribe su propia respuesta, quédate con la opción que mejor encaje; si ninguna encaja, vuelve a preguntar. Si "$ARGUMENTS" ya responde una pregunta sin dudas, no la hagas. Si una pregunta trae `saltar_si_como` y el `id` elegido en `como` está en esa lista, no la hagas ni elijas una opción por la persona.
3. Llama `vibe_entrada` con `como` (y `que` y `nivel` si se preguntaron), con el `id` de cada opción elegida.
4. Si la respuesta trae `aviso`, díselo a la persona antes de construir nada, con el enlace tal cual, y espera su respuesta.
5. Mira los archivos que ya hay en la carpeta (`ls`) y haz lo que dice `insumos` de la primera respuesta.
6. Sigue el `texto` de la respuesta. Si `modo` no es `pronto`, llama `vibe_modo` con ese `modo` y el `que` elegido si hubo, y sigue el `texto` que devuelve, que trae las preguntas del modo y el momento de crear el proyecto. Si trae `tarjetas`, pregúntalas con `AskUserQuestion` como en el paso 2. Si la persona ya dio un dato que el modo pide (la plantilla, la URL), pásalo en su campo; si el texto pide volver a llamar con la respuesta, hazlo.
7. Si `modo` es `pronto` y el texto indica crear el proyecto:
   - Llama `vibe_new` con `dir` = la carpeta actual (`pwd`) y `sesion` = la misma ruta. Si la persona dijo cómo se llama, pásalo en `nombre`. Si la tool lista archivos que el template pisaría, no borres ni muevas nada: muéstrale la lista y pregúntale qué hace.
   - Arranca el dev server una sola vez: si `curl -s http://127.0.0.1:<puerto>/` ya responde, no arranques otro; si no, `npm run dev -- --port <puerto> --strictPort` en segundo plano, dentro de la carpeta del proyecto.
   - Antes de editar, pide la parte `base` con `vibe_soul` y lee el `CLAUDE.md` del proyecto.
