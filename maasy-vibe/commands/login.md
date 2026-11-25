---
description: Entra con tu cuenta de Maasy o con la de Believable de siempre (Google, o enlace al correo si pasas uno)
argument-hint: "[maasy | believable | correo | publicar]"
allowed-tools: mcp__plugin_maasy-vibe_vibe__vibe_login
---

Llama la tool `vibe_login` del servidor MCP `vibe` según "$ARGUMENTS":

- Vacío: no pases nada. La tool elige: la cuenta de Believable si ya hay una sesión de esa cuenta (o fue la última con la que se entró, aunque se haya salido), y la de Maasy si no.
- `maasy`: pasa `cuenta: "maasy"` (la cuenta de Maasy, aunque haya una sesión de Believable: son cuentas distintas).
- `believable`: pasa `cuenta: "believable"` (la cuenta de Believable con Google).
- Un correo: pásalo como `email` (enlace mágico a la cuenta de Believable).
- `publicar`: pasa `cuenta: "maasy"` y `permiso: "vibe:publish"`. Si una tool pidió otro permiso de Maasy, pasa ese en `permiso`. Los permisos son de la cuenta de Maasy: sin `cuenta: "maasy"` y con una sesión de Believable, la tool no cambia de cuenta y dice que se entra con `/maasy-vibe:login maasy`.

- Se abre el navegador de esta máquina. Dile a la persona que termine ahí y espera la respuesta de la tool.
- Con correo, dile que abra el enlace que le llegó **en esta misma máquina**.
- Si la tool dice que no pudo abrir el navegador, muestra la URL tal cual y, cuando la persona avise que terminó, llama `vibe_login` otra vez.

Responde con lo que diga la tool, en una línea. No muestres ni pidas tokens ni secretos.
