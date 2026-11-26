# Plugin maasy-motion

Maasy Motion en Claude Code y Claude Desktop. Conecta el MCP local de la app Maasy Motion (BeCut en modo externo,
`/Applications/Maasy Motion.app`) y trae `/maasy-motion:start`. Requiere el plugin `maasy`: usa su sesión de Maasy
(`mcp__plugin_maasy_maasy__*`) y no abre otra.

```
/plugin install maasy-motion --marketplace BELIEVE-IT-GROUP/maasy-plugins
```

## Límites

Maasy Motion trae su propio ffmpeg (LGPL, con VideoToolbox) y no necesita Homebrew. Ese ffmpeg no incluye `libass` ni
`zscale`: no hace reels con subtítulos quemados ni conversión HDR. Los films no los usan. Si los necesitas, indica otro
ffmpeg en Ajustes (`tools.ffmpeg`). Importar un video desde un link necesita `yt-dlp` en el Mac.

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
