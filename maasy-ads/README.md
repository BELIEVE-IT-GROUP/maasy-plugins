# Plugin maasy-ads

Maasy Ads en Claude Code y Claude Desktop. Claude lee la pauta, simula planes y propone tarjetas. Aplicar o publicar lo hace una persona en la web.

- MCP remoto de BeAds: `https://ads.believe-global.com/mcp`.
- La sesión es OAuth de Maasy y la cuenta se identifica con el `sub` de Maasy, nunca con el correo. El plugin no guarda llaves ni tokens. Permisos que usa: `ads:read` y `ads:propose`.
- Depende del plugin `maasy` (ADN de la marca y panel).
- Comando: `/maasy-ads:start`.
- Instalación: `/plugin install maasy-ads --marketplace BELIEVE-IT-GROUP/maasy-plugins`.

## Estado (2026-11-25)

- El ingreso es con OAuth de Maasy: al primer uso, Claude abre el navegador para autorizar.
- La tool `ads_panel`, las tarjetas para cuentas propias y la aprobación en `/claude/ads` están en camino.
- Las cuentas publicitarias se conectan en la web de Maasy: Productos, Ads, Conectar cuenta.
