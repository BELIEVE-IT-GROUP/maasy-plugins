---
description: Crea tu tienda en línea (becommerce, modo prueba), conéctala a este proyecto o bórrala
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_tienda, mcp__plugin_maasy-vibe_vibe__vibe_login, AskUserQuestion
---

La tienda de la persona, con la tool `vibe_tienda` del servidor MCP `vibe`.

1. Llama `vibe_tienda` con `accion` = "estado" y `path` = la ruta absoluta de la carpeta actual.
2. Si ya hay tienda, la tool deja el proyecto conectado: cuéntalo en tres líneas (panel, correo de acceso, que no cobra).
3. Si no hay y la persona la quiere, pregunta el nombre si no lo sabes y confirma con AskUserQuestion antes de crear: queda en modo prueba (no cobra a nadie), no tiene costo por ahora, el acceso al panel llega a su correo y puede tardar unos minutos. Opciones: «Sí, créala» y «Todavía no».
4. Con el sí, llama `vibe_tienda` con `accion` = "crear", el `nombre` y el `path`. Sin sí, sigue construyendo con productos de ejemplo.
5. Con la tienda lista, conecta el storefront a la Store API (skill `becommerce-storefront`) y ofrece `/maasy-vibe:publish`.

- Borrar solo si la persona lo pide: `accion` = "borrar", muestra lo que se pierde en una tarjeta y sigue únicamente con un sí.
- **Nunca** pidas, muestres ni escribas contraseñas. El acceso llega por correo.
- Nunca digas que la tienda ya cobra o ya vende: está en modo prueba.
- Si la tool pide un permiso, usa `vibe_login` como indica y reintenta. Si no hay sesión, dile que escriba `/maasy-vibe:login`.
