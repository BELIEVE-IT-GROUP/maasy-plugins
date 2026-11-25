# Plugin maasy

Maasy en Claude Code y Claude Desktop. Conecta el MCP remoto de Maasy (`https://mcp.maasy.ai`, login con tu cuenta de
Maasy) y trae el comando `/maasy:start`, que crea una marca con la entrevista guiada.

Este directorio es público: la receta de la entrevista (preguntas, opciones, prompts de derivación) vive en el servidor
(`supabase/functions/_shared/interview-recipe.ts`) y llega por partes, marcada por cuenta. El test
`supabase/functions/_shared/interview-recipe.test.ts` falla si una oración de la receta aparece acá.

Comandos: `/maasy:start` (cuenta gratis y marca con una entrevista guiada) y `/maasy:borrar`. Sin servidor local y sin hooks.
Los archivos locales se miden con `wc` y `file` (macOS y Linux). El logo por URL funciona en cualquier sistema.

Instalación (cuando el repo `BELIEVE-IT-GROUP/maasy-plugins` se publique, con este mismo contenido):

```
/plugin marketplace add BELIEVE-IT-GROUP/maasy-plugins
/plugin install maasy@maasy
```
