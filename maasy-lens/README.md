# Plugin maasy-lens

Maasy Lens en Claude Code y Claude Desktop. Desarma un video de un link (Reel, TikTok, Short o video de YouTube):
gancho de 0 a 3 s, transcripción con tiempos, texto en pantalla, hoja de cuadros y métricas. Todo corre en tu Mac con
yt-dlp, whisper.cpp y el OCR de Apple; Lens no llama a ningún modelo. El análisis lo escribe tu Claude.

```
/plugin install maasy-lens --marketplace BELIEVE-IT-GROUP/maasy-plugins
```

**Solo funciona en Mac.** En Apple Silicon no necesita nada más; en un Mac Intel usa ffmpeg, whisper.cpp y deno de
Homebrew. En otro sistema, `bin/instalar` y `bin/lens` lo dicen y salen sin instalar nada.

- `/maasy-lens:ver <link>`: ver un video y, si quieres, guardar el análisis en tu cerebro de Maasy.
- `/maasy-lens:estado`: revisar la instalación e instalar lo que falte.
- Tab **Lens** del panel de Maasy: la tool de solo lectura `lens_panel` (contrato `panel.v1`) devuelve los últimos
  análisis de este Mac (red, cuenta, duración, gancho de 0 a 3 s y si está analizado, por aprobar o en el cerebro) y el
  estado de la instalación. Lee solo archivos de Lens en tu Mac y no llama a la red.

Lens funciona sin cuenta de Maasy. Para guardar en el cerebro hace falta el plugin `maasy` con tu sesión, y nada se
escribe sin dos pasos tuyos: la tarjeta que dice qué va y qué no, y el permiso de la tool. Va solo el análisis (la
fórmula, el gancho en una línea, la estructura y el origen); nunca el video, la transcripción ni los cuadros.

## Uso responsable

Maasy Lens ve solo contenido público, desde tu conexión y sin iniciar sesión en ninguna red: no lee cookies, sesiones
ni la configuración de yt-dlp. Instagram, TikTok, YouTube, Facebook y X tienen términos que limitan la descarga y la
recolección automatizada, y cumplirlos es tu responsabilidad. Úsalo para entender la fórmula de un video que abriste,
nunca para copiar el video ni el guion, ni para bajar contenido en lote. Los videos se guardan en tu Mac y se borran
solos a los 30 días.

## Instalación

`bin/instalar` deja todo en `~/.maasy-lens`. Baja uv, Python 3.12, las dependencias de `requirements.lock`
(con `--require-hashes`), BeLens y el modelo `ggml-large-v3-turbo-q5_0` de whisper, y verifica cada archivo por
sha256 (`bin/versiones`). En Mac con Apple Silicon baja también, a `~/.maasy-lens/bin` y sin modificar, whisper-cli
(whisper.cpp), deno y ffmpeg con ffprobe en un build LGPL; Lens los usa antes que los que haya en el PATH. Primero baja
y verifica todo: si un solo sha256 no coincide, no instala nada. En un Mac Intel no baja esos binarios y te pide
instalarlos con Homebrew (`brew install ffmpeg whisper-cpp deno`).

Antes de bajar nada dice cuánto ocupa (unos 886 MB en Apple Silicon, unos 793 MB en Intel) y cuánto tarda, y no
instala sin un sí explícito: `/maasy-lens:estado` lo pide con una pregunta y después corre `bin/instalar --si`. El
tamaño sale de `bin/versiones`, y `bin/instalar tamaño` solo lo muestra, sin bajar nada.

Tampoco hay que reconectar el MCP al terminar. Mientras Lens falta, `bin/lens mcp` arranca un servidor mínimo
(`bin/stub-mcp`, en Perl, que ya viene en macOS) que contesta el MCP con una sola tool, `estado`, que explica cómo
instalar. Cuando la instalación termina, ese servidor le pasa el stdio al de verdad y avisa `tools/list_changed`: las
tools de Lens aparecen solas en la misma conversación. Solo si algo falla hace falta `/mcp`, elegir `belens` y
Reconectar (Claude guarda en caché un fallo de conexión durante 15 minutos, y ahí reiniciar la conversación no alcanza).

## Actualizaciones

Lens se actualiza solo. Al arrancar, `bin/lens` revisa en segundo plano (como mucho cada 6 horas, sin demorar el MCP)
`https://files.believe-global.com/apps/maasy-lens/latest.json`. Si hay una versión mayor y no hay ningún análisis
corriendo, baja BeLens, `requirements.lock` y, en Apple Silicon, los binarios de `~/.maasy-lens/bin` que cambiaron o
faltan (solo de ese dominio, por https y sin redirecciones), exige el sha256 de cada uno, arma todo al lado, lo cambia
con `mv` y vuelve a lo anterior si algo falla. En un Mac Intel no toca binarios. Cualquier falla deja
la versión que tenías funcionando. El registro queda en `~/.maasy-lens/actualizar.log`; `bin/lens actualizar --seco`
dice qué haría sin instalar nada.

Las licencias de lo que se instala están en `THIRD-PARTY-NOTICES`.

## Licencia

MIT, ver [LICENSE](LICENSE). Cubre solo el código de este plugin. Lo que instala (uv, Python, whisper.cpp, deno, ffmpeg y el modelo) conserva su propia licencia, ver `THIRD-PARTY-NOTICES`.

[Política de privacidad](https://maasy.ai/privacy)
