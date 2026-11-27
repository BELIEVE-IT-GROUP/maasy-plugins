# Plugin maasy-ads

Maasy Ads en Claude Code y Claude Desktop. Claude lee la pauta, simula planes y propone tarjetas. Aplicar o publicar lo hace una persona en la web.

- MCP remoto de BeAds: `https://ads.believe-global.com/mcp`.
- La sesión es OAuth de Maasy y la cuenta se identifica con el `sub` de Maasy, nunca con el correo. El plugin no guarda llaves ni tokens. Permisos que usa: `ads:read` y `ads:propose`.
- Depende del plugin `maasy` (ADN de la marca y panel).
- Comandos, una línea cada uno:
  - `/maasy-ads:start`: revisa la pauta de la marca y pregunta qué hacer.
  - `/maasy-ads:conectar`: mira si hay cuentas conectadas y manda a conectar si no hay.
  - `/maasy-ads:metricas`: lee las métricas de la marca.
  - `/maasy-ads:simular`: simula un plan de canal o de campaña completa.
  - `/maasy-ads:proponer`: crea una tarjeta, solo con el sí explícito de la persona.
  - `/maasy-ads:tarjetas`: lista las tarjetas pendientes de decisión.
- Instalación: `/plugin install maasy-ads --marketplace BELIEVE-IT-GROUP/maasy-plugins`.

## Estado (2026-11-25)

- El servidor en producción todavía autentica solo con llave de agente: el ingreso con OAuth de Maasy **llega próximamente**, así que hoy el plugin instalado no puede iniciar sesión.
- La tool `ads_panel`, las tarjetas para cuentas propias y la aprobación en `/claude/ads` están en camino.
- Conexión de cuentas publicitarias por Zernio: **próximamente**.
