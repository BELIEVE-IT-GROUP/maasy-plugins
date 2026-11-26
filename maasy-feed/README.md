# maasy-feed

Plugin de Claude para operar el Instagram orgánico de tus marcas de Maasy con BeFeed.

Claude lee el método y las métricas de la marca, escribe la semana y deja las piezas en BeFeed. Tú apruebas y programas en el panel. Claude no propone horas ni publica.

## Qué trae

- `.mcp.json`: el servidor `maasy-feed` (reply.believe-global.com/api/mcp), que es BeFeed. El servidor `maasy` (tus marcas) llega con el plugin `maasy`, que se instala solo como dependencia.
- `/maasy-feed:conectar`: da de alta una marca de Maasy en BeFeed.
- `/maasy-feed:semana <cuenta>`: escribe la semana de esa cuenta.

## Cómo entra

Con tu cuenta de Maasy. La primera vez que Claude llama a BeFeed, te pide iniciar sesión en Maasy. El plugin no guarda ningún secreto.

Los permisos son por marca y vencen (90 días por defecto):

| Permiso | Para qué |
|---|---|
| `feed:read` | Leer marcas, métricas, semanas y el método |
| `feed:write` | Crear semanas y escribir piezas en guion |

## Qué no hace

- No genera semanas con la IA de Believe ni produce Reels. Escribe tu Claude, con el método de BeFeed.
- No aprueba, no programa y no publica. Eso queda en el panel de BeFeed.
- No conecta Instagram: el enlace para hacerlo te lo da `/maasy-feed:conectar`.

El método no viene en el plugin: BeFeed lo sirve siempre en su última versión.
