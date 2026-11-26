# Plugin maasy-ads

Maasy Ads en Claude Code y Claude Desktop. Claude lee la pauta, simula planes y propone tarjetas. Aplicar o publicar lo hace una persona en la web.

- MCP remoto de BeAds: `https://ads.believe-global.com/mcp`.
- La sesión es OAuth de Maasy y la cuenta se identifica con el `sub` de Maasy, nunca con el correo. El plugin no guarda llaves ni tokens. Permisos que usa: `ads:read` y `ads:propose`.
- Depende del plugin `maasy` (ADN de la marca y panel).
- Comando: `/maasy-ads:start`.
- Instalación: `/plugin install maasy-ads --marketplace BELIEVE-IT-GROUP/maasy-plugins`.

## Estado (2026-11-25)

- El servidor en producción todavía autentica solo con llave de agente: el ingreso con OAuth de Maasy **llega próximamente**, así que hoy el plugin instalado no puede iniciar sesión.
- La tool `ads_panel`, las tarjetas para cuentas propias y la aprobación en `/claude/ads` están en camino.
- Conexión de cuentas publicitarias por Zernio: **próximamente**.
