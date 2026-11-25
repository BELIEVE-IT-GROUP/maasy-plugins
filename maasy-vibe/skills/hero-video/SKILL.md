---
name: hero-video
description: "Receta exacta para un hero de video FOTORREALISTA atado al scroll, estilo Apple: una persona real usando el producto del usuario, fotos clave con IA, las capturas reales del producto compuestas en la pantalla, clips de Kling entre foto y foto, y el componente scroll-video-hero del pack believe-dioramas. Úsalo cuando el usuario pida un hero con video, 'que el video avance con el scroll', 'estilo Apple', 'una persona usando mi app en el hero', 'imagen real, no un muñeco', o cuando el proyecto ya tenga el componente scroll-video-hero."
version: 2.0.0
---

<!-- Versión del plugin de Claude Code: se genera a mano desde template/.claude/skills/hero-video/SKILL.md
cambiando solo lo que depende de la app (componente, fal, verificación). Un cambio de receta va en las dos. -->

# Hero de video fotorrealista atado al scroll

Hermana de la skill `dioramas` (objeto 3D que gira con el scroll). Esta es la versión con
**imagen real**: una persona del público del usuario usando SU producto, en 3 o 4 capítulos,
y el video avanza o retrocede con el scroll. Cada capítulo se detiene en una foto clave donde
la pantalla del producto se lee nítida.

Cómo funciona, en una línea: **4 fotos clave → la captura real del producto en cada pantalla →
3 clips de Kling (de una foto clave a la siguiente) → un MP4 todo-intra → `ScrollVideoHero`.**

Ejemplos hechos con esta receta (ábrelos para calibrar la calidad que se espera):
- Believable: https://files.believe-global.com/believable/dioramas/landing-foto/
- BeCommerce (una diseñadora con su taller de ropa): https://files.believe-global.com/believable/dioramas/hero-video-becommerce/
- Una app de pedidos para panaderías: https://files.believe-global.com/believable/dioramas/hero-video-demo/

## Costo y tiempo (precios de lista de fal, medidos el 2026-10-27)

| Paso | Modelo | Precio | Tiempo |
|---|---|---|---|
| Foto clave base (1) | `fal-ai/nano-banana-pro` | US$0,15 | ~35 s |
| Fotos clave derivadas (3) | `fal-ai/nano-banana-pro/edit` | US$0,15 c/u | ~35–40 s |
| Clip con movimiento chico o mediano (2) | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`, 5 s | US$0,07/s = US$0,35 | ~105 s |
| Clip con giro grande de cámara (1) | `fal-ai/kling-video/v3/pro/image-to-video`, 5 s | US$0,14/s = US$0,70 | ~5 min |

**Total esperado: US$2,15 sin regenerar nada, ~US$3 con una o dos fotos rehechas.** Unos
15–25 minutos de punta a punta. Los precios cambian: confírmalos con `get_pricing` antes de
empezar. Todo se cobra en la cuenta de fal de la persona.

**Regla dura: antes de CADA `run_model` o `submit_job`, dile al usuario qué vas a generar, con qué modelo y
cuánto cuesta.** Al empezar, di el total esperado y espera su aprobación. Si una pieza sale
mal, di cuánto cuesta rehacerla antes de rehacerla.

## 0. Preparación

1. **Componente.** Si el proyecto no tiene `src/components/video/scroll-video-hero.tsx`, tráelo
   del pack `believe-dioramas` (1.1.0 o mayor) del catálogo de Believable, con el sha256 del índice
   verificado. Haz antes el paso 3 (`raw/` ignorada):
   ```bash
   B=https://files.believe-global.com/packs; P=raw/.pack; F=blocks/scroll-video-hero/scroll-video-hero.tsx
   mkdir -p $P && curl -fsSL $B/index.json -o $P/index.json
   read T S < <(node -e 'const p=require(process.argv[1]).packs.find(p=>p.id==="believe-dioramas");console.log(p.tarball,p.sha256)' "$PWD/$P/index.json")
   curl -fsSL "$B/$T" -o $P/pack.tgz && echo "$S  $P/pack.tgz" | shasum -a 256 -c - \
     && tar -tvzf $P/pack.tgz "$F" | grep -q '^-' && mkdir -p src/components/video \
     && tar -xzf $P/pack.tgz -O "$F" > src/components/video/scroll-video-hero.tsx
   ```
   Si el sha256 no coincide o la entrada no es un archivo regular, detente y dilo: no lo instales.
   Después agrega `gsap@^3.15.0` y `lenis@^1.3.25` (dependencias nuevas: con el sí de la persona).
   No reescribas el componente a mano: trae arreglos de Safari que no son obvios.
2. **fal conectado.** La receta genera con la cuenta de fal de la persona, por el MCP oficial de
   fal. El skill `fal-modelos` dice cómo se conecta, cómo se suben archivos y cómo se bajan los
   resultados. Sin las tools de fal en la sesión, ofrece conectarlo como dice ese skill y
   detente: esta receta no tiene plan B sin fal.
3. **Carpeta de trabajo `raw/`, fuera de git.** Todo lo intermedio (fotos, clips, ffmpeg) va
   ahí, nunca en `public/` ni en un commit. Asegúrate de que `raw/` esté ignorada antes de
   bajar nada pesado:
   ```bash
   grep -qxF 'raw/' .gitignore || printf '\nraw/\n' >> .gitignore
   ```
4. **ffmpeg.** El Mac del usuario puede no tenerlo, o tenerlo sin `libwebp` (el de Homebrew
   no lo trae). Revisa:
   ```bash
   ffmpeg -hide_banner -encoders 2>/dev/null | grep -cE '^ V\S* (libx264|libwebp) '
   ```
   Si responde `2`, usa `FF=ffmpeg`. Si no, baja el binario estático (ffmpeg 6.0, unos 45 MB,
   trae libx264, libwebp, perspective y colorkey), dentro de `raw/`:
   ```bash
   npm i --prefix raw/.ffmpeg --no-save --no-audit --no-fund ffmpeg-static
   FF="$PWD/raw/.ffmpeg/node_modules/ffmpeg-static/ffmpeg"
   [ -x "$FF" ] || node raw/.ffmpeg/node_modules/ffmpeg-static/install.js
   "$FF" -version | head -1
   ```
   (La última línea cubre un npm que no corra el postinstall). En los comandos de abajo, `$FF`
   es ese binario. Para el script de pantallas: `FFMPEG="$FF" node …`.

## 1. Brief (antes de gastar un centavo)

Escribe `docs/brief-hero-video.md` y muéstraselo al usuario:

```markdown
# <Producto> — hero de video

## Persona
Quién es (edad, oficio, rasgos, ropa EXACTA), dónde está (lugar, hora, luz), en qué dispositivo
usa el producto (laptop, tableta).

## Capítulos (4 = 4 fotos clave = 3 clips)
1. <eyebrow> · <titular> — plano (abierto, de frente) · lado del texto · qué captura va en la pantalla
2. ... (por encima del hombro: la pantalla grande y casi de frente, para que se lea)
3. ... (de cerca: la cara y la pantalla en ángulo)
4. Cierre: plano abierto que se aleja del 3, con aire del lado del texto, CTA

## Capturas del producto
Qué pantalla real va en cada capítulo (la de trabajo diario, el resultado).
```

**Reglas de los planos (cada una costó una regeneración):**
- **El lado del texto queda LIBRE: ni la persona ni la pantalla.** El texto ocupa el tercio
  inferior de un lado en escritorio. Si el laptop cae en ese tercio, el texto lo tapa (pasó en
  la segunda corrida: el capítulo 1 perdió su pantalla). Pídelo explícito en el prompt.
- **Las fotos clave comparten geometría.** Mismo cuarto, misma luz, la cámara se mueve. Una foto
  en espejo de la anterior hace que Kling funda dos personas translúcidas.
- **El cierre se deriva del 3, no del 1**, como un alejamiento: así el último clip es un
  movimiento simple.
- Un giro de cámara de 120–180° entre dos fotos (de detrás del hombro a de frente) es un
  "giro grande": ese clip va con Kling v3 pro desde el principio.

## 2. Capturas reales del producto

Lo que se ve en la pantalla es el producto **de verdad**, nunca una interfaz inventada por la IA.
Necesitas un PNG por pantalla, a 1440×900 (laptop) o 1366×1024 (tableta), en `raw/`:

- **Si el producto tiene URL** (el preview de este proyecto o un sitio publicado), con el
  Chrome del usuario, sin ventanas:
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
    --window-size=1440,900 --screenshot="$PWD/raw/captura-pedidos.png" "<url>"
  ```
- **Si no hay Chrome:** `npx -y playwright@1 screenshot --viewport-size=1440,900 "<url>" raw/captura-pedidos.png`
  (la primera vez baja Chromium, unos 2 minutos).
- **Si la pantalla está detrás de un login** (el panel de su producto) **o no es web**: Chrome
  headless no entra con su sesión. Pídele al usuario que guarde las capturas en la carpeta
  `raw/` del proyecto (en Mac, Cmd+Shift+4 y arrastrar el archivo) y dile los nombres.

**Antes de usar una captura, tapa los datos personales** (el correo del usuario en el pie de un
panel, nombres de clientes reales): la foto va a una página pública. Un rectángulo del color del
fondo alcanza:
```bash
"$FF" -y -v error -i raw/captura-panel.png -vf "drawbox=x=0:y=850:w=196:h=50:color=0x18181b:t=fill" raw/captura-panel-limpia.png
```

Elige pantallas con letra grande y poca densidad: en una pantalla chica dentro de la foto,
lo que mide menos de 14 px en la captura no se lee.

## 3. Foto clave base (nano-banana-pro)

`get_model_schema` y `get_pricing` de `fal-ai/nano-banana-pro`, avisa el precio, genera con
`run_model` y baja el resultado a `raw/a.jpg`. Esta plantilla funcionó en las dos corridas; cambia lo que está entre `<>`:

```json
{
  "prompt": "Photorealistic candid documentary photograph. <A warm 68-year-old Colombian baker with short grey hair and a grey moustache, flour-dusted dark navy apron over a white shirt>, <stands behind the worn wooden counter of his small neighborhood bakery at dawn>, looking at an open silver laptop with a quiet, hopeful half smile. The laptop is turned three-quarters toward the camera so its screen is clearly visible; the screen is a flat, uniform, evenly lit pure chroma green (#00FF00), no interface, no reflections, no glare. <He> and the laptop are both in the <right> 60% of the frame. The <left> third is calm and empty of people and screens: <wooden racks of fresh bread> softly out of focus in shadow, space for text. <Warm window light from the left, orange oven glow behind him as a rim light>. Shot on a 35mm lens at f/2, eye level, shallow depth of field, natural skin texture, subtle film grain, muted warm color grade. Both hands resting naturally, anatomically correct. No text, no logos, no brand marks on the laptop, no watermark.",
  "aspect_ratio": "16:9",
  "resolution": "2K",
  "output_format": "jpeg",
  "num_images": 1
}
```

Lo que no se negocia en el prompt: **pantalla en verde croma plano (#00FF00)**, **sin logo en
el equipo**, 35 mm f/2, grano sutil, luz con dirección, el lado del texto vacío.

## 4. Fotos clave por capítulo (nano-banana-pro/edit)

Cada una sale de una foto anterior con `fal-ai/nano-banana-pro/edit`, para que sea la misma
persona en el mismo lugar. Las imágenes de entrada se suben antes con
`upload_file` (una foto 2K pesa más de 1 MB: `prepare_upload` y PUT, ver `fal-modelos`) y van
como su `file_url`. Baja cada resultado a `raw/b.jpg`, `raw/c.jpg` y `raw/d.jpg`. B y C salen de A; D sale de C, **con A
también como referencia de vestuario**:

```json
{
  "prompt": "Same man, same bakery, same laptop, same light, same moment. Change only the camera: <it moves behind him to an over-the-shoulder view, looking at the laptop screen, which fills the center-right of the frame seen almost straight on and large>. The screen stays a flat, uniform, evenly lit pure chroma green (#00FF00), no interface. <His head and shoulder soft and out of focus on the left>. Same 35mm lens look, subtle film grain, warm muted grade. No text, no logos, no watermark.",
  "image_urls": ["<file_url de raw/a.jpg>"],
  "aspect_ratio": "16:9", "resolution": "2K", "output_format": "jpeg", "num_images": 1
}
```

Para D: `"image_urls": ["<file_url de raw/a.jpg>", "<file_url de raw/c.jpg>"]` y en el prompt "Use the
second image as the starting camera and the first image for his wardrobe … exactly the same
clothes: <plain white shirt and a solid dark navy apron> … it pulls straight back and slightly
up from the second image into a calm wide closing shot, same direction of view, no mirroring".

### Revisa CADA foto antes de seguir (Read)

Un clip cuesta más que una foto: lo que falle aquí se arregla aquí. Todas tienen que pasar:

1. **Manos**: cinco dedos, sin dedos fundidos, apoyadas con peso real.
2. **Ojos y cara**: misma persona que en A, mirada coherente (a la pantalla o a cámara).
3. **Teclado y equipo**: un solo equipo, teclas con orden, sin logo.
4. **Pantalla**: verde plano y parejo, visible, sin reflejos.
5. **Vestuario**: la MISMA ropa que en A. (En la segunda corrida, D salió con un delantal gris
   a rayas en vez del azul: se rehizo pasando A como referencia. Con la ropa distinta, Kling
   transforma la prenda a mitad del clip).
6. **Geometría**: mismo cuarto, sin espejo, el lado del texto libre.

Si una falla, dile al usuario qué falló y que rehacerla cuesta US$0,15, y rehazla con el
problema nombrado en el prompt.

## 5. La captura real en cada pantalla

Determinista, sin IA. El script de esta skill encuentra las esquinas del verde, deforma la
captura a ese cuadrilátero y monta la foto encima recortando el verde, así lo que tapa la
pantalla (dedos, pelo) queda delante:

```bash
for k in a:pedidos b:pedidos c:pedido d:pedido; do
  FFMPEG="$FF" node .claude/skills/hero-video/pantalla.mjs raw/${k%%:*}.jpg raw/captura-${k##*:}.png raw/clave-${k%%:*}.jpg
done
```

Mira las cuatro `raw/clave-*.jpg` (Read) y amplía la zona de la pantalla si hace falta:
```bash
"$FF" -y -v error -i raw/clave-a.jpg -vf crop=700:560:520:840 raw/zoom-a.jpg
```
Tiene que quedar sin filo verde y sin una caja de otro tono alrededor del equipo. Si el script
dice "no hay pantalla verde", la foto no trae verde suficiente: rehazla.

## 6. Clips de Kling (cuadro inicial y final)

Tres clips de 5 s: A→B, B→C, C→D. **Cuadro inicial Y final**, así cada capítulo descansa
exactamente en su foto clave. Usa las fotos YA compuestas (`clave-*.jpg`), subidas
con `upload_file`. Genera con `submit_job` (un clip tarda de 2 a 5 minutos), sigue con
`check_job` sin volver a enviarlo y baja cada clip a `raw/clip-ab.mp4`, `raw/clip-bc.mp4` y
`raw/clip-cd.mp4`.

- Movimiento chico o mediano (rodear un poco, acercarse, alejarse):
  `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` con `image_url` y `tail_image_url`.
- **Giro grande de cámara** (de detrás del hombro a de frente):
  `fal-ai/kling-video/v3/pro/image-to-video` con `start_image_url`, `end_image_url` y
  `generate_audio: false`. Con 2.5 turbo inventó una segunda laptop a mitad del clip; v3 pro
  lo resolvió en un solo plano.

```json
{
  "prompt": "Smooth slow cinematic camera arc: <the camera glides around the baker from the front of the counter to behind his right shoulder, ending on an over-the-shoulder view of his laptop screen>. One continuous shot, same room, same light. The laptop screen content stays steady and readable. Realistic, gentle motion, 35mm film look.",
  "negative_prompt": "blur, distort, low quality, extra laptop, second person, duplicate hands, warped fingers, morphing face, flickering screen text",
  "image_url": "<file_url de raw/clave-a.jpg>",
  "tail_image_url": "<file_url de raw/clave-b.jpg>",
  "duration": "5",
  "cfg_scale": 0.5
}
```

El prompt describe **el movimiento de cámara**, no la escena (la escena ya está en los cuadros).

### Revisa cada clip antes de seguir

Saca una hoja de 8 cuadros y mírala (Read):
```bash
"$FF" -y -v error -i raw/clip-ab.mp4 -vf "select='not(mod(n\,20))',scale=480:-2,tile=4x2" -frames:v 1 raw/hoja-ab.jpg
```
Regenera (avisando el precio) si ves: un segundo equipo o una segunda persona, un fundido con
alguien translúcido (fotos en espejo: arregla la foto, no el clip), manos que se derriten, o la
ropa que cambia. Que la letra chica se borronee **en movimiento** es normal: se lee en las
pausas, que son las fotos clave.

## 7. Unión y codificación para scrubbing

Kling entrega 24 fps y ~121 cuadros por clip. Se unen sin repetir el cuadro de unión (el
último de un clip y el primero del siguiente son la misma foto clave):

```bash
"$FF" -y -v error -i raw/clip-ab.mp4 -i raw/clip-bc.mp4 -i raw/clip-cd.mp4 -filter_complex \
 "[0:v]setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=1,setpts=PTS-STARTPTS[b];[2:v]trim=start_frame=1,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1[v]" \
 -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -an raw/hero-master.mp4
```

Cuenta los cuadros de cada clip para saber dónde cae cada foto clave
(`"$FF" -i raw/clip-ab.mp4 -map 0:v -f null - 2>&1 | grep -o 'frame= *[0-9]*' | tail -1`).
Con 122, 121 y 122: **cuadros 0, 121, 241 y 362** (363 en total). Esos números van en
`frame` de cada capítulo.

**Todo-intra (`-g 1`)**: cada cuadro es una imagen completa, así buscar cualquier cuadro con
el scroll es instantáneo. Con GOP normal el scroll hacia atrás se traba.

```bash
mkdir -p public/media
# Escritorio: 1280×720 CRF 25 (~9 MB por 15 s)
"$FF" -y -v error -i raw/hero-master.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -crf 25 -g 1 \
  -pix_fmt yuv420p -movflags +faststart -an public/media/hero-1280.mp4
# Móvil: 1280×720 CRF 29 (~6 MB)
"$FF" -y -v error -i raw/hero-master.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -crf 29 -g 1 \
  -pix_fmt yuv420p -movflags +faststart -an public/media/hero-720-movil.mp4
```

1280 en escritorio y no 1600: con SSIM 0,979 contra el de 1600 no se nota y pesa un 24 %
menos (el video se baja entero antes de mostrarse).

## 8. Pósters

Un WebP por capítulo, sacado del MISMO video en el cuadro de su foto clave (así no hay salto
cuando el video aparece sobre el póster):

```bash
for p in 0:a 121:b 241:c 362:d; do
  "$FF" -y -v error -i raw/hero-master.mp4 -vf "select=eq(n\,${p%%:*}),scale=1600:-2" -frames:v 1 \
    -c:v libwebp -quality 80 public/media/poster-${p##*:}.webp
done
```
(~55–70 KB cada uno).

## 9. Montar el componente

```tsx
import { ScrollVideoHero } from '../components/video/scroll-video-hero'

const BASE = import.meta.env.BASE_URL

<ScrollVideoHero
  video={{ desktop: `${BASE}media/hero-1280.mp4`, mobile: `${BASE}media/hero-720-movil.mp4` }}
  posters={['a', 'b', 'c', 'd'].map((k) => `${BASE}media/poster-${k}.webp`)}
  alt="Qué muestra la escena, en una frase"
  background="#1c130c" accent="#e08a3c" ink="#f6ecdc"   // de design.md
  titleFont="'Fraunces', ui-serif, Georgia, serif"       // cárgala en el head() de la ruta
  chapters={[
    { frame: 0, focusX: 62, eyebrow: '…', title: '…', body: '…', quote: '…', cta: <a href="#precio">…</a> },
    { frame: 121, focusX: 72, eyebrow: '…', title: '…', body: '…' },
    { frame: 241, focusX: 60, eyebrow: '…', title: '…', body: '…' },
    { frame: 362, focusX: 34, side: 'right', eyebrow: '…', title: '…', body: '…', cta: <a href="#precio">…</a> }
  ]}
/>
```

- `title` acepta JSX: el énfasis en itálica y el punto final en el color de la marca, si su
  sistema los pide. `eyebrowFont`: la mono de la marca para los eyebrows.
- `side`: el lado del texto en escritorio, el lado libre de la foto clave.
- `focusX`: en vertical el 16:9 se recorta; el % horizontal donde está el sujeto en esa foto
  (su cara o la pantalla). Revísalo en 390.
- `progressTop`: si el header fijo no mide 4rem, la altura del header (la barra de carga va
  justo debajo).
- La página sigue después del hero (precio, prueba, footer). El hero abre la página, no la
  reemplaza.
- Agrega `<link rel="preload" as="image">` del primer póster en el `head()` de la ruta.

Antes de terminar: borra `raw/` entera (fotos, clips, ffmpeg). A `public/media` van solo los
dos MP4 y los cuatro pósters.

## 10. Verificación

Una captura de página completa no sirve acá: no espera al video ni mueve el scroll. Con
`npm run dev` corriendo, usa el navegador que tenga esta sesión (un MCP de navegador, como Chrome
DevTools o Playwright):

1. Abre el preview a 1440 de ancho.
2. Espera a que el video esté listo (repite hasta `true`; baja ~9 MB):
   `document.querySelector('[data-status]')?.dataset.status === 'ready'`
3. Por capítulo, mueve el scroll y mide el cuadro:
   `const s = document.querySelector('section'); window.__lenis.scrollTo((s.offsetHeight - innerHeight) * (1/3), { immediate: true })`
   (0, 1/3, 2/3 y 1), espera 1 s, y
   `Math.round(document.querySelector('section video').currentTime * 24)`
   tiene que dar el `frame` del capítulo (±1). Saca una captura y mírala.
4. Repite 1 y 3 a 390 de ancho, y revisa que no haya scroll horizontal:
   `document.documentElement.scrollWidth <= innerWidth`.

Si la sesión no tiene navegador, pídele a la persona que lo revise en el suyo con la lista de abajo,
y dilo en el informe: esa parte no la verificaste tú.

Todo tiene que ser sí:
1. ¿El estado llega a `ready` y cada capítulo cae en su cuadro?
2. ¿En cada pausa la pantalla del producto se lee (los titulares, al menos)?
3. ¿El texto queda en el lado libre, sin tapar la cara ni la pantalla?
4. ¿Las transiciones son un solo plano continuo, sin segundas personas ni equipos?
5. ¿En 390 el sujeto queda a la vista (`focusX`) y no hay scroll horizontal?
6. ¿Consola limpia? (Un favicon que falta da un 404: pon uno).

Safari: el componente ya trae el arreglo (preload auto, `load()`, espera de `loadeddata` con
respaldo de `readyState`, y `play()`/`pause()` para cebar el decodificador). No lo quites al
editar: sin eso Safari se queda en el primer póster para siempre.

Muéstrale al usuario las capturas finales y cuánto se gastó en total en su cuenta de fal, paso
por paso.
