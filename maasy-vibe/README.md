# Plugin maasy-vibe

Maasy Vibe en Claude Code. Crea aplicaciones web con el template de Believable, las revisa y las publica en el borde de Believe, listas para que las lean personas y agentes de IA.

## Uso

Instala el plugin (incluye como dependencia el plugin `maasy`) y escribe `/maasy-vibe:start`:

```
/plugin marketplace add BELIEVE-IT-GROUP/maasy-plugins
/plugin install maasy-vibe@maasy
```

Para publicar necesitas iniciar sesión con `/maasy-vibe:login`. Otros comandos: `/maasy-vibe:new`, `/maasy-vibe:check`, `/maasy-vibe:publish`, `/maasy-vibe:unpublish` y `/maasy-vibe:movil`.

El plugin corre un servidor MCP local (`server/`) y revisa su entorno al iniciar cada sesión. Las instrucciones para construir llegan del servidor después del login.

## Licencia

MIT para el código de Believe Global, ver [LICENSE](LICENSE). Las skills de terceros incluidas en `skills/` conservan su propia licencia (MIT o Apache 2.0). El detalle está en [skills/ATRIBUCIONES.md](skills/ATRIBUCIONES.md). Las recetas viven en el servidor y no forman parte del repositorio.

[Política de privacidad](https://maasy.ai/privacy)
