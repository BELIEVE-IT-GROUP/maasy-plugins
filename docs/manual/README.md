# Manual de Maasy en Claude: fuente única

Este directorio es la **única fuente** del Manual de Maasy en Claude, el manual de usuario de los plugins de Maasy. Todo lo demás (la página con marca, la nota de BeNotes, el Markdown de descarga) se genera desde acá. Nunca se edita una copia. Es el mismo sistema del Manual de Believable (repo `believable`, `docs/manual/`).

Dirección canónica: **https://files.believe-global.com/maasy/manual/index.html**. R2 no sirve índices de carpeta: `…/maasy/manual/` sola responde 404.

## Qué hay

| Archivo | Qué es |
|---|---|
| `01-…md` a `15-…md` | Los capítulos. El orden es el número; el título es el primer `#`. |
| `MANUAL-VERSION` | El número de esta edición (`N.N.N`). Empieza en 1.0.0. |
| `CHANGELOG.md` | El historial. Cada versión necesita su entrada `## N.N.N (AAAA-MM-DD)`. |
| `manual.config.json` | Título, portada, destino en R2, nota de BeNotes, los plugins y versiones que describe (`plugins`) y el mapeo capítulo → fuentes (`sources`). |
| `vx.css` | Estilos de las figuras (prefijo `vx-`). Usan los tokens de la página y siguen al tema claro y oscuro. |
| `img/capturas/` | Las pantallas. Se rehacen con `scripts/manual/capture.mjs`. |
| `img/marca/` | La firma de Believe (maestros del skill `brand-kit-believe`, sin tocar). |
| `dist/` | Salida generada. No se versiona. |

## Versionado

El manual lleva **número propio**, independiente de la versión de cada plugin.

| Número | Cuándo sube |
|---|---|
| Primero | Se reorganizó el manual o cambió la forma de usar Maasy en Claude. |
| Segundo | Capítulo nuevo o capacidad nueva documentada (un plugin llega a la tienda). |
| Tercero | Correcciones, precisiones y pantallas rehechas. |

## Editar y publicar

```bash
# 1. Edita el capítulo, sube MANUAL-VERSION, agrega la entrada al CHANGELOG y haz commit.
node scripts/manual/build.mjs                  # genera docs/manual/dist/ (y corre el chequeo del parser)
scripts/publish-manual.sh                      # ENSAYO: dice qué subiría y a dónde, sin tocar nada
scripts/publish-manual.sh --publish            # publica a R2 y a BeNotes
```

`scripts/publish-manual.sh` hace cumplir las reglas:

- Publica solo lo que está en git.
- Si lo publicado ya es este contenido, no sube nada.
- Si el contenido cambió y `MANUAL-VERSION` no, se niega (salvo `--force`).
- Después de subir, baja la página y comprueba que trae la versión y que su captura principal responde como imagen.
- Después de subir, purga la caché de Cloudflare de las URL publicadas (`scripts/manual/purge-cache.mjs`, bajo `infra`): R2 se cachea por URL y sin purgar sigue saliendo la copia vieja.

## Cómo escribir

- Español neutro, de tú, sin voseo y sin rayas largas (el generador rechaza `—`). Corto y directo.
- Todo el texto pasa por el skill `humanizalo` antes de publicar.
- Para quien usa Maasy: dueños de negocio, no programadores. Comandos y botones tal como aparecen.
- Nada de lo que la receta de Maasy sirve por servidor (preguntas de la entrevista, instrucciones de las derivaciones, método de Motion) se escribe acá. El manual dice qué hace cada paso, no cómo lo ordena el servidor.
- Nada de secretos, tokens, direcciones internas, nombres de clientes ni datos personales: el bucket de R2 es público.
- Lo que no esté verificado se dice como pendiente.
- Disponibilidad: `` `PRÓXIMAMENTE` `` (todavía no está en la tienda) y `` `BETA` `` se ven como etiquetas.

El generador entiende: títulos, párrafos, listas, tablas, citas (`>` se ve como aviso), imágenes con ruta relativa a esta carpeta (una imagen sola en su párrafo se ve como pantalla a lo ancho, con el texto alternativo como pie) y negrita, cursiva, código y enlaces. Un bloque ` ```pedido ` muestra cada línea como un mensaje de ejemplo. Un bloque ` ```figura ` es HTML propio con clases `vx-` (ver `vx.css`): en la página se dibuja; en `manual.md` y en BeNotes queda su descripción (`data-alt`) y su pie (`figcaption`).

### Figuras

- Una figura explica mejor que el texto o no va.
- Titular o pie que dice la conclusión. Acento de color (`vx-key`) solo en el nodo clave.
- En 375 px se apilan en columna. Nunca un SVG que se achica hasta no leerse.

## Pantallas

`scripts/manual/capture.mjs` recorta los **diseños aprobados** (`files.believe-global.com/maasy/mockups/`) con Playwright, sin abrir ventanas. Cada pie dice que es un diseño aprobado con datos de ejemplo. Cuando una pantalla real exista, se reemplaza su escena y se quita el aviso. Dos capturas reales del control plane (`sin-chat-vibe.png`, `sin-copilot.png`) entran a mano y no tienen datos de clientes.

```bash
PLAYWRIGHT_CORE=/ruta/a/node_modules node scripts/manual/capture.mjs [--only nombre] [--list]
```

## Los tres destinos

| Destino | Qué llega | Cómo |
|---|---|---|
| Repo | El Markdown y las pantallas | git |
| R2 | `index.html`, `manual.md`, `manual.json`, `assets/*` en `files.believe-global.com/maasy/manual/` | `~/.believe/bin/publish-r2 <archivo> --key maasy/manual/<archivo>` |
| BeNotes | La nota "Manual de Maasy en Claude" en el cuaderno BELIEVE | `scripts/manual/benotes.mjs push`, por el MCP de Cuadernos |

### BeNotes

BeNotes (Cuadernos) no tiene llave de API: su puerta es el MCP `https://cuadernos.believe-global.com/api/mcp`, con OAuth por usuario. El refresh token rota en cada uso, así que este manual tiene su **propio** secreto, `BENOTES_MAASY_MANUAL_OAUTH`. Para publicar sin ventana hay que conectar una vez, quien administra Cuadernos, en su Mac:

```bash
~/.believe/bin/infra node scripts/manual/benotes.mjs connect
```

Sin conectar, `--publish` publica en R2 y deja BeNotes como pendiente. Mientras tanto se empuja a mano con el conector de Cuadernos (`notes_create` o `notes_update` con `docs/manual/dist/benotes.json`) y se deja el `page_id` en `manual.config.json`.

## Autoupdate: el manual avisa cuando un plugin cambia

`scripts/manual/autoupdate.mjs` compara contra `origin/main`:

1. La versión de cada plugin (`<plugin>/.claude-plugin/plugin.json`) contra la que declara `manual.config.json` (`plugins`).
2. Los plugins de `.claude-plugin/marketplace.json` contra los declarados: uno nuevo necesita capítulo; uno que llegó a main (estado `pr:N`) pasa a `main` y pierde su etiqueta `PRÓXIMAMENTE`.
3. Las rutas que alimentan cada capítulo (`sources`) desde el commit con que se revisó (`sha`).

Un plugin con estado `pr:N` (todavía sin mergear) se mira en la cabeza de ese PR.

```bash
node scripts/manual/autoupdate.mjs                 # ENSAYO: qué cambió y qué capítulos revisar
node scripts/manual/autoupdate.mjs --apply         # rama manual/autoupdate-<sha> con los capítulos marcados
node scripts/manual/autoupdate.mjs --apply --pr    # además abre el PR (bajo ~/.believe/bin/infra)
node scripts/manual/autoupdate.mjs --self-test
```

Con `--apply` cada capítulo afectado recibe un comentario `<!-- REVISAR … -->` al inicio. **`build.mjs` se niega a construir mientras haya una marca**, así que nadie publica un capítulo sin revisar. No cambia versiones ni textos: quien revisa actualiza el capítulo, pone la versión nueva en `manual.config.json` (`plugins` y `sources.<capítulo>.sha`), quita la marca, sube `MANUAL-VERSION` y agrega la entrada al CHANGELOG.

No toca la rama donde se corre, no publica y no abre otra rama mientras haya una `manual/autoupdate-*` sin integrar.

### El disparador

`scripts/manual/launchd/` trae el LaunchAgent (una vez al día, 09:35) y su ayudante, que clona el repo en `~/.believe/cache/maasy-plugins`, lo deja en `origin/main` y corre `--apply --pr` bajo `infra`. No se carga solo:

```bash
install -m 755 scripts/manual/launchd/maasy-manual-autoupdate.sh ~/.believe/bin/
cp scripts/manual/launchd/com.believe.maasy-manual-autoupdate.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.believe.maasy-manual-autoupdate.plist
launchctl kickstart gui/$(id -u)/com.believe.maasy-manual-autoupdate   # primera corrida, a mano
tail -f ~/Library/Logs/maasy-manual-autoupdate.log
```

Para apagarlo: `launchctl bootout gui/$(id -u)/com.believe.maasy-manual-autoupdate`.
