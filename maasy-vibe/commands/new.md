---
description: Crea una app nueva con el template v2 de Believable (TanStack Start con prerender)
argument-hint: "[carpeta]"
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_new, mcp__plugin_maasy-vibe_vibe__vibe_soul, Bash(pwd), Bash(curl -s:*), Bash(npm run dev:*)
---

Crea un proyecto con la tool `vibe_new` del servidor MCP `vibe`.

1. Arma la ruta absoluta de la carpeta. Si "$ARGUMENTS" viene vacío, es la carpeta actual (`pwd`). Si trae una ruta relativa o un nombre, va dentro de la carpeta actual.
2. Llama `vibe_new` con `dir` (absoluta) y `sesion` (la salida de `pwd`). Si la persona dijo cómo se llama el proyecto, pásalo en `nombre`: es el de la URL publicada. Tarda lo que tarde la instalación de dependencias: espera la respuesta.
3. Si la tool dice que hay archivos que el template pisaría, no borres ni muevas nada. Muéstrale la lista a la persona y pregúntale si los mueve o en qué carpeta nueva lo creas (propón la que sugiere la tool); después vuelve a llamar. Los archivos que no chocan (un brief, un logo) se quedan donde están.
4. La tool no deja el dev server corriendo. Arráncalo una sola vez, en el puerto que dijo:
   - Si `curl -s http://127.0.0.1:<puerto>/` ya responde (el preview de la app de escritorio de Claude lo arrancó desde `.claude/launch.json`), no arranques otro.
   - Si no, corre `npm run dev -- --port <puerto> --strictPort` dentro de la carpeta del proyecto, en segundo plano, y confirma con `curl` que responde.
5. Cierra con pocas líneas: dónde quedó el proyecto, la URL local, que el trabajo se guarda con `git commit` (la tool ya hizo el inicial) y que para publicarlo está `/maasy-vibe:publish`. Si la tool avisó que la sesión está en otra carpeta, dilo: el preview de la app de escritorio de Claude no va a encontrar el proyecto hasta que la persona abra una sesión ahí.

Antes de editar el proyecto, pide la parte `base` con `vibe_soul` y lee su `CLAUDE.md`: arriba están las tres reglas del template, que no se negocian.
