# Plugin maasy

Maasy en Claude Code y Claude Desktop. Conecta el MCP remoto de Maasy (`https://mcp.maasy.ai`, login con tu cuenta de
Maasy) y trae el comando `/maasy:start`, que crea una marca con la entrevista guiada.

Este directorio es público: la receta de la entrevista (preguntas, opciones, prompts de derivación) vive en el servidor
(`supabase/functions/_shared/interview-recipe.ts`) y llega por partes, marcada por cuenta. El test
`supabase/functions/_shared/interview-recipe.test.ts` falla si una oración de la receta aparece acá.

Comandos: `/maasy:start` (cuenta gratis y marca con una entrevista guiada) y `/maasy:borrar`. Sin servidor local y sin hooks.
Los archivos locales se miden con `wc` y `file` (macOS y Linux). El logo por URL funciona en cualquier sistema.

## Panel (MEC-15 y MEC-16)

`hooks/panel.tsx` es el mod del núcleo: un solo panel con pestañas (Crear, Cuenta, "Pedir a Maasy" —el catálogo, que
manda la tool `maasy_panel` del servidor— y las de los plugins que traen una tool `<id>_panel`), la entrevista con su avance y la franja `.cd-plugbar`. Contrato: `panel.v1` (`contrato-tabs-panel.md`).
Inerte hasta la primera tool `maasy_*` o `/maasy-panel`: al arrancar solo registra el comando.

- `hooks/panel-v1.ts`: validador por partes (un bloque malo se descarta, no la tab) y enlaces contra el origen de cada tab.
- `hooks/estado.ts`: lógica pura (descubrir tabs con la lista cerrada de ids de §4.1, orden y orígenes de esa tabla, marca activa y `brandId`, Crear y Cuenta desde lo que ya devolvieron las tools). Los textos de terceros con caracteres de control se descartan.
- `build.mjs`: baja `maasy-ui.css` v2.1, exige su sha256 y genera `hooks/tokens.generated.ts` (`node plugin/build.mjs --check`).
- Pruebas: `claude plugin test plugin` (el mod), `deno test --unstable-sloppy-imports plugin/tests/` (validador y estado)
  y `plugin/tests/arranque-headless.sh` (arranque con y sin el plugin).

Instalación (cuando el repo `BELIEVE-IT-GROUP/maasy-plugins` se publique, con este mismo contenido):

```
/plugin marketplace add BELIEVE-IT-GROUP/maasy-plugins
/plugin install maasy@maasy
```

## Dónde se usa completo

Maasy funciona en el chat de Claude y en la pestaña Code de la app de Claude (Claude Code). En el chat tienes a Maasy; en Code tienes la Suite.

| | Pestaña Code | Chat |
|---|---|---|
| Pedir piezas y dejarlas en tu Canvas | Sí | Sí |
| El panel con pestañas (Maasy, Feed, Ads, Games...) | Sí | No |
| La carpeta de tu marca con su bitácora (`~/Maasy/<marca>/`) | Sí | No |
| Motion, Lens y Vibe, que trabajan en tu Mac | Sí | No |

`/maasy:start` crea tu cuenta y tu marca. `/maasy:marca` abre una marca para trabajar: su carpeta, lo que ya hay en tu Canvas y qué mover ahora.

## Licencia

MIT, ver [LICENSE](LICENSE). Cubre solo el código de este plugin. Las recetas viven en el servidor de Maasy y no forman parte del repositorio.

[Política de privacidad](https://maasy.ai/privacy)
