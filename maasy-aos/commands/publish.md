---
description: Publica el perfil firmado / Publish the signed profile
argument-hint: "[marca / brand]"
allowed-tools: mcp__plugin_maasy-aos_beaos__get_aos_recipe, mcp__plugin_maasy-aos_beaos__list_brands, mcp__plugin_maasy-aos_beaos__get_brand, mcp__plugin_maasy-aos_beaos__list_claims, mcp__plugin_maasy-aos_beaos__generate_agent_assets, mcp__plugin_maasy-aos_beaos__publish_agent_assets, AskUserQuestion
---

Llama `get_aos_recipe` con `parte: "publicar"` y sigue su texto. Las `tarjetas` se preguntan con `AskUserQuestion` tal cual vienen, y no se publica nada sin la respuesta.

Si "$ARGUMENTS" trae la marca, úsala sin volver a preguntarlo.
