---
description: Mide el APS con tus llaves / Measure APS with your keys
argument-hint: "[marca / brand]"
allowed-tools: mcp__plugin_maasy-aos_beaos__get_aos_recipe, mcp__plugin_maasy-aos_beaos__list_brands, mcp__plugin_maasy-aos_beaos__get_brand, mcp__plugin_maasy-aos_beaos__ensure_prompt_library, mcp__plugin_maasy-aos_beaos__start_aps_run, mcp__plugin_maasy-aos_beaos__list_aps_runs, mcp__plugin_maasy-aos_beaos__get_aps_score_detail, AskUserQuestion
---

Llama `get_aos_recipe` con `parte: "medir"` y sigue su texto. Las `tarjetas` se preguntan con `AskUserQuestion` tal cual vienen, y no se gasta nada sin la respuesta.

Si "$ARGUMENTS" trae la marca, úsala sin volver a preguntarlo.
