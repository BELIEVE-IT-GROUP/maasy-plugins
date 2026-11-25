---
description: Revisa si la app publicada está lista para producción (web y agentes) y arregla lo que falta
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_check
---

Revisa la app de la carpeta actual con la tool `vibe_check` del servidor MCP `vibe`.

1. Llama `vibe_check` con `path` = la ruta absoluta de la carpeta actual. Si la persona dio una URL, pásala en `url`.
2. Muestra el resultado agrupado (Web y Agentes), cada ítem con ok, falta o no aplica, sin resumirlo de más.
3. Si algo falta, ofrece arreglarlo ahora: cada falta trae su "Arreglo:" y ese es el pedido. Hazlo en el código de esta carpeta.
   - Nunca inventes datos de la empresa, cifras ni afirmaciones para brand.json, llms.txt o los legales: pregúntale a la persona y deja marcado lo que tiene que completar.
   - Lo que es "no aplica" no se toca.
4. Con los arreglos hechos, compila (`npm run build`) y pregúntale a la persona si publica de nuevo con `/maasy-vibe:publish`; después vuelve a correr `vibe_check` para confirmar.

- Si la tool dice que el proyecto no se publicó, dile a la persona que use `/maasy-vibe:publish` primero.
- Si no pudo leer el sitio, es la red o la URL, no la app: no marques nada como falta.
