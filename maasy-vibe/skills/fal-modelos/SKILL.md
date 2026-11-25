---
name: fal-modelos
description: >-
  El catálogo completo de fal.ai (cientos de modelos) con la cuenta de fal de la persona, por el MCP
  oficial de fal: imágenes, diseño, ilustración, video corto, música, voz en off, efectos de sonido,
  3D, upscale y quitar fondo. Úsalo cuando la app o la pieza necesite un asset que no existe (hero,
  fondo, ilustración, ícono, foto de producto, clip de video, música, locución, sonido, modelo 3D) o
  haya que mejorar uno que sí existe (subir resolución, quitar fondo), y cuando la persona mencione
  fal o pida "generar" algo que no sea código.
version: 2.0.0
---

<!-- Versión del plugin de Claude Code. La de la app de escritorio vive en
template/.claude/skills/fal-modelos/ y usa las tools de la app; esta no las nombra. -->

# Modelos de fal.ai

Las generaciones corren con la cuenta de fal **de la persona**, conectada a su Claude Code por el MCP
oficial de fal. Believe no pone llave ni cobra por la IA: cada generación se paga con los créditos de
fal de la persona, al precio de lista de fal.

## Primero: ¿está fal conectado?

Mira si en esta sesión tienes las tools del servidor `fal` (en Claude Code se ven como
`mcp__fal__search_models`, `mcp__fal__run_model`, etc.). Si no están, **no improvises**: nada de
llamar a la API de fal con curl, pedir una llave o cambiar de proveedor. Dile a la persona, en dos
líneas, que para generar hace falta conectar su cuenta de fal, y ofrécete a hacerlo:

1. Con su sí, agrega el servidor (una sola vez, para todos sus proyectos):
   ```bash
   claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
   ```
2. Ella escribe `/mcp`, elige **fal** y **Authenticate**: inicia sesión en fal en el navegador. No
   hay llave que copiar.
3. Si las tools no aparecen, que abra una sesión nueva de Claude Code.

Nunca le pidas una llave de fal ni un token en el chat, y nunca escribas uno en el proyecto, en
`.mcp.json` ni en el repo. Si no quiere conectar fal, sigue sin ese asset y dilo.

## Las tools

| Tool | Para qué | Cobra |
|---|---|---|
| `search_models`, `recommend_model` | Buscar en el catálogo vivo (`query`, `category`) | No |
| `get_model_schema` | Los inputs del modelo | No |
| `get_pricing` | El precio del modelo | No |
| `run_model` | Generar y esperar (imágenes, audio corto) | **Sí** |
| `submit_job` → `check_job` → `get_job_result` | Generar algo largo (video, 3D) | **Sí** |
| `upload_file` | Subir un archivo local para usarlo de entrada | No |

**Regla dura: antes de CADA `run_model` o `submit_job`, dile a la persona qué vas a generar, con
qué modelo y cuánto cuesta (`get_pricing`), y espera su sí.** El servidor de fal no tiene un paso de
aprobación propio: la aprobación eres tú.

- Si `run_model` responde `processing`, guarda el `request_id` y sigue con `check_job`
  (pásale el `status_url`, respeta `poll_after_seconds`) y `get_job_result`. **Nunca vuelvas a
  enviar el trabajo para ver cómo va**: cada envío es una generación nueva que se cobra.
- Para video y 3D usa `submit_job` desde el principio.

## Cuándo pensar en fal

| Necesidad | Busca con | Categoría |
|---|---|---|
| Hero, fondo, ilustración, foto de producto | `"flux"`, `"image"`, `"illustration"` | `text-to-image` |
| Editar una imagen o mantener un personaje | `"edit"`, `"kontext"` | `image-editing` |
| Subir resolución | `"upscale"` | |
| Quitar el fondo | `"remove background"` | |
| Clip de video corto | `"video"` | `text-to-video`, `image-to-video` |
| Música, efecto de sonido | `"music"`, `"sound effects"` | |
| Voz en off | `"tts"`, `"speech"` | `text-to-speech` |
| Modelo 3D | `"3d"` | `image-to-3d` |

Las categorías son orientativas. Si una búsqueda con categoría sale vacía, repítela sin ella.

## Cómo escoger

1. **Busca antes de asumir.** El catálogo cambia cada semana: compara dos o tres candidatos.
2. **Compara el precio en la unidad que cobra.** Por generación, por megapíxel, por segundo o por
   minuto: haz la cuenta para lo que vas a pedir (5 s a 0,10 USD por segundo son 0,50 USD).
3. **Prefiere lo barato.** Para un borrador o un asset de relleno, el más barato que cumpla. El
   modelo tope solo si la persona pide máxima calidad o el barato ya falló.
4. **Lee el esquema** (`get_model_schema`) antes de cada modelo nuevo: un input mal armado gasta igual.
5. **Una generación a la vez.** Mira el resultado (Read) antes de pedir variantes.

## Archivos de entrada (una foto del proyecto, una captura)

El servidor de fal no lee rutas locales. Para un archivo del proyecto:

- **Menos de 1 MB:** `upload_file` con `data` (el archivo en base64, completo) y `file_name`.
  Arma el base64 con un comando (`base64 -i ruta`), nunca a mano. Usa el `cdn_url` que devuelve.
- **Más grande (hasta 90 MB):** `upload_file` con `prepare_upload: true`, `file_name` y
  `file_size` (`stat -f%z ruta` en Mac). Sube los bytes con un PUT a la `upload_url`, con los
  headers que devolvió y sin `Authorization`:
  ```bash
  curl -fsS -X PUT -H "Content-Type: <el que devolvió>" --data-binary @raw/a.jpg "<upload_url>"
  ```
  Usa el `file_url` solo después de un PUT con respuesta 2xx. La `upload_url` es privada: no la
  muestres.

## Cómo meter el resultado en el proyecto

El resultado trae URLs del CDN de fal, que vencen: **baja cada archivo al proyecto apenas termina**.

```bash
mkdir -p public/media && curl -fsSL -o public/media/hero-fondo.jpg "<url del resultado>"
```

- **Dónde:** en una app, `public/media/` (se sirve en `/media/...`). Lo intermedio que no se publica
  (fotos de trabajo, clips crudos), en `raw/` con `raw/` en `.gitignore`. El nombre en minúsculas y
  con guiones, que diga qué es: `hero-fondo`, `voz-intro`.
- **Respeta `design.md`.** Escribe el prompt con la paleta, el tono y el estilo de la marca (colores
  por nombre y hex, luz, encuadre, textura). Un asset que no se parece a la marca no sirve.
- **Mira antes de usar.** Lee cada imagen generada. Si trae texto deformado, manos raras o un color
  fuera de marca, no la pongas.
- **Peso.** Una imagen de fal puede pesar varios MB. Para la web, pásala a JPEG o WebP de un ancho
  razonable antes de ponerla en `public/`, o dilo si queda pesada.
- **Video y audio en la web:** `<video autoplay muted loop playsinline>` para un fondo; el audio
  nunca arranca solo, siempre detrás de un clic.
- **Texto alternativo:** toda imagen que entre a la app lleva un `alt` que describe lo que muestra.

## Prompts

En inglés, concretos: sujeto, encuadre, luz, estilo, paleta. Nunca nombres de artistas reales ni
marcas ajenas. Para música: género, instrumentos, tempo y cómo cambia la energía, y pide instrumental
si va bajo una voz o un video.

Al terminar, dile a la persona cuánto se gastó en total en su cuenta de fal.
