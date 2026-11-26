# Plugin maasy-motion

Maasy Motion en Claude Code y Claude Desktop. Conecta el MCP local de la app Maasy Motion (BeCut en modo externo,
`/Applications/Maasy Motion.app`) y trae `/maasy-motion:start`. Requiere el plugin `maasy`: usa su sesión de Maasy
(`mcp__plugin_maasy_maasy__*`) y no abre otra.

```
/plugin install maasy-motion --marketplace BELIEVE-IT-GROUP/maasy-plugins
```

## Requisitos

Mac con Apple Silicon (M1 o posterior) y macOS 13 o más. En un Mac con Intel o con un macOS anterior la app no abre y
el sistema dice que no es compatible.

## Límites

Maasy Motion trae su propio ffmpeg (LGPL, con VideoToolbox, libass y zimg) y whisper, y no necesita Homebrew: hace
reels con subtítulos quemados y convierte HDR. La primera vez que transcribe baja el modelo de voz (574 MB) a su
carpeta de datos. Los subtítulos usan las tipografías que trae la app; si la fuente de una marca no está entre ellas,
se cambia por la más parecida. Importa videos desde un link con el `yt-dlp` y el `deno` que trae. Si el Mac no tiene
Chrome, la primera vez que dibuja un video baja `chrome-headless-shell` (105 MB). La primera vez que renderiza un film
final instala earshot, que califica el sonido (cerca de 1 GB, más sus modelos). Las voces locales de Piper no están
disponibles en Mac: las voces van por ElevenLabs u OpenAI con tu llave.

## Permisos

`/maasy-motion:start` deja leer y editar `~/Movies/BeCut/films/**` sin preguntar durante el turno en que se invoca (así
funciona `allowed-tools` en Claude Code). Para que tampoco pregunte en los mensajes siguientes, suma esto en
`~/.claude/settings.json` (o con `/permissions`):

```json
{ "permissions": { "allow": ["Read(~/Movies/BeCut/films/**)", "Edit(~/Movies/BeCut/films/**)"] } }
```

`Edit` cubre también `Write`. Si cambiaste la carpeta de trabajo, usa la que devuelve `hub_new_film`.

Este directorio es público: el método (`receta/`) vive en el servidor de Maasy y llega por partes, marcado por cuenta.
Los tests de `crates/core/src/believe/centinelas.rs` fallan si una oración de la receta, un asset de las marcas de
Believe o música sin licencia para terceros aparece acá o en lo que se empaqueta en la app. Diseño: `docs/diseno/MEC-22.md`.
