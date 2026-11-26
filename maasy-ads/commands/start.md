---
description: "Revisa tu pauta, simula un plan y propón tarjetas / Review your ads, simulate a plan and propose cards"
argument-hint: "[marca o lo que quieres revisar]"
allowed-tools: mcp__plugin_maasy-ads_ads__authenticate, mcp__plugin_maasy-ads_ads__marcas, mcp__plugin_maasy-ads_ads__mandato, mcp__plugin_maasy-ads_ads__historial_mandato, mcp__plugin_maasy-ads_ads__metricas, mcp__plugin_maasy-ads_ads__serie, mcp__plugin_maasy-ads_ads__resumen_cliente, mcp__plugin_maasy-ads_ads__campanas, mcp__plugin_maasy-ads_ads__campana, mcp__plugin_maasy-ads_ads__anuncios, mcp__plugin_maasy-ads_ads__calendario, mcp__plugin_maasy-ads_ads__estructura_en_meta, mcp__plugin_maasy-ads_ads__diagnostico_meta, mcp__plugin_maasy-ads_ads__estado_cuenta, mcp__plugin_maasy-ads_ads__activos_de_la_cuenta, mcp__plugin_maasy-ads_ads__alertas, mcp__plugin_maasy-ads_ads__decisiones, mcp__plugin_maasy-ads_ads__journal, mcp__plugin_maasy-ads_ads__simular_plan, mcp__plugin_maasy-ads_ads__simular_plan_canal, mcp__plugin_maasy-ads_ads__ads_panel, AskUserQuestion
---

Usa la skill `maasy-ads` y síguela. Conversa en el idioma de la persona.

1. Sesión. Llama `marcas` del servidor `ads`. Si BeAds no está conectado, llama su tool `authenticate` y dile a la persona que termine en el navegador. Si no hay tool `authenticate`, dile que escriba `/mcp`, elija ads y "Authenticate", y luego vuelva a escribir `/maasy-ads:start`. Sin sesión no sigas.
2. Marca. Si hay varias, pregunta cuál. Si no hay ninguna, dilo y para: conectar cuentas publicitarias llega próximamente.
3. Revisa `mandato`, `metricas`, `alertas`, `decisiones` y `calendario`, resume en pocas líneas y pregunta qué quiere hacer.

Si "$ARGUMENTS" ya dice la marca o el pedido, úsalo sin volver a preguntar.
