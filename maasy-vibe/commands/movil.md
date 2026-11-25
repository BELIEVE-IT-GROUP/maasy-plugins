---
description: Convierte este proyecto en app iOS y Android y súbela a TestFlight o a la prueba interna de Google Play
allowed-tools: mcp__plugin_maasy-vibe_vibe__movil_estado, mcp__plugin_maasy-vibe_vibe__movil_convertir, mcp__plugin_maasy-vibe_vibe__movil_conectar_apple, mcp__plugin_maasy-vibe_vibe__movil_conectar_play, mcp__plugin_maasy-vibe_vibe__movil_testflight, mcp__plugin_maasy-vibe_vibe__movil_play
---

App móvil del proyecto de la carpeta actual, con las tools `movil_*` del servidor MCP del plugin. Todo corre en esta máquina: Xcode, Android SDK y las credenciales de la persona, que viven en el llavero del sistema.

1. Llama `movil_estado` con `path` = la ruta absoluta de la carpeta actual y cuéntale a la persona, en dos líneas, qué hay y qué falta.
2. Si todavía no es app Capacitor (o no tiene iOS/Android), llama `movil_convertir` y sigue su receta paso a paso aquí. Vuelve a llamar `movil_estado` para confirmar.
3. Para TestFlight, App Store Connect tiene que estar conectado. Si no lo está, pídele a la persona su Key ID, su Issuer ID y la **ruta** del archivo `.p8` (App Store Connect → Usuarios y acceso → Integraciones → API de App Store Connect, rol App Manager) y llama `movil_conectar_apple`. Para Google Play, la **ruta** del JSON de la cuenta de servicio y `movil_conectar_play`.
4. Publica con `movil_testflight` o `movil_play` (pasa `version` solo si la persona pidió una). Tardan: TestFlight espera a que Apple procese el build (5 a 25 minutos).
5. Responde con el resultado y el link en dos o tres líneas.

- **Nunca** pidas, leas ni pegues el contenido del `.p8` o del JSON: solo su ruta. Después de conectar, la persona puede borrarlos.
- Si una tool devuelve una receta para arreglar el build o para crear la app en App Store Connect, síguela y vuelve a llamar la misma tool.
- Si la cuenta pide algo que solo la persona puede hacer (iniciar sesión con su Apple ID, el código de doble factor, crear la app en Play Console), díselo en una línea y espera.
