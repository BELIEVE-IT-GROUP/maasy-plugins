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
