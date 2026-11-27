---
description: Cambia un juego que ya existe
argument-hint: "[juego y qué cambiar]"
allowed-tools: mcp__plugin_maasy-games_maasy-games__games_receta, mcp__plugin_maasy-games_maasy-games__games_piezas, mcp__plugin_maasy-games_maasy-games__games_preparar_marca, mcp__plugin_maasy-games_maasy-games__games_subir, mcp__plugin_maasy-games_maasy-games__games_put_file, mcp__plugin_maasy-games_maasy-games__games_empaquetar, mcp__plugin_maasy-games_maasy-games__games_probar, mcp__plugin_maasy-games_maasy-games__games_corrida, mcp__plugin_maasy-games_maasy-games__games_version_proponer, mcp__plugin_maasy-games_maasy-games__games_versiones, mcp__plugin_maasy-games_maasy-games__games_estado, mcp__plugin_maasy_maasy__maasy_get_design_md, mcp__plugin_maasy_maasy__maasy_get_brand_dna, mcp__plugin_maasy_maasy__maasy_get_brand_assets, mcp__claude_ai_Maasy_MCP__*, mcp__claude_ai_Maasy__*, AskUserQuestion
---

La receta la manda el servidor de Maasy Games en cada entrega. No la inventes, no la cambies y no la copies a archivos.

1. Llama `games_receta` con `parte: "cambio"` y el `juego` si "$ARGUMENTS" lo nombra. Si pide iniciar sesión, conecta Maasy Games (sigue lo que diga Claude) y vuelve a llamarla. Sin sesión no sigas.
2. Sigue el `texto` de la entrega con el cambio que pide "$ARGUMENTS".
