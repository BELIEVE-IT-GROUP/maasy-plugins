---
name: dioramas
description: "Método para landings 3D cinemáticas estilo Dioramas: un objeto hiperdetallado con luz de estudio, cámara coreografiada por el scroll y una interacción que se puede tocar. Úsalo cuando el usuario pida una landing 3D, un hero cinemático, 'estilo Dioramas', 'que el objeto 3D sea la página', una página de producto con un objeto que gira al hacer scroll, o cuando el proyecto ya tenga el componente diorama-hero."
version: 2.0.0
---

<!-- Versión del plugin de Claude Code: se genera a mano desde template/.claude/skills/dioramas/SKILL.md
cambiando solo lo que depende de la app (componente, fal, revisión). Un cambio de receta va en las dos. -->

# Dioramas

Adaptado de [Dioramas](https://github.com/blendi-remade/dioramas) (código MIT, modelos CC BY
4.0; ver `ATRIBUCIONES.md`). La idea central: **la escena 3D ES la página**, no un canvas
decorativo arriba de secciones normales. Un objeto, luz motivada, una cámara que se mueve con el
scroll y un texto diseñado junto con el encuadre.

El método tiene cuatro pasos y no se salta ninguno: **brief → build → review → revise**.

**¿Imagen real en vez de un objeto 3D?** Si el usuario quiere una persona de verdad usando su
producto ("no un muñeco", "estilo Apple", un video que avanza con el scroll), usa la skill
hermana `hero-video`: fotos clave con IA, las capturas reales del producto en la pantalla,
clips de Kling y el componente `scroll-video-hero` del mismo pack.

## 0. El componente

El motor viene en el pack `believe-dioramas` (1.1.0 o mayor) del catálogo de Believable. Si el
proyecto no tiene `src/components/3d/diorama-hero.tsx`, tráelo con el sha256 del índice
verificado. Es un solo comando: baja el pack a `raw/.pack` (con `raw/` ignorada por git), revisa el sha256 y que
todas las entradas sean archivos o carpetas normales, y copia a `src/components/3d/` el
componente (`diorama-hero.tsx`), el motor (`dioramas-engine.ts`) y sus cuatro módulos
(`dioramas-reflector|volumetric|textures|ui.ts`):

```bash
grep -qxF 'raw/' .gitignore 2>/dev/null || printf '\nraw/\n' >> .gitignore
B=https://files.believe-global.com/packs; P=raw/.pack; rm -rf $P && mkdir -p $P/x
curl -fsSL $B/index.json -o $P/index.json \
  && read T S < <(node -e 'const p=require(process.argv[1]).packs.find(p=>p.id==="believe-dioramas");console.log(p.tarball,p.sha256)' "$PWD/$P/index.json") \
  && curl -fsSL "$B/$T" -o $P/pack.tgz && echo "$S  $P/pack.tgz" | shasum -a 256 -c - \
  && ! tar -tvzf $P/pack.tgz | grep -v '^[-d]' && tar -xzf $P/pack.tgz -C $P/x \
  && node -e 'const fs=require("fs"),path=require("path");const [dir,...names]=process.argv.slice(1);const pk=JSON.parse(fs.readFileSync(path.join(dir,"pack.json"),"utf8"));for(const n of names){const c=pk.components.find(c=>c.name===n);if(!c)throw new Error("el pack no trae "+n);for(const f of c.files){if(path.isAbsolute(f.target)||f.target.split("/").includes(".."))throw new Error("destino raro: "+f.target);fs.mkdirSync(path.dirname(f.target),{recursive:true});fs.copyFileSync(path.join(dir,f.path),f.target)}console.log(n+": "+c.dependencies.join(" "))}' $P/x diorama-hero
rm -rf $P
```

Si el sha256 no coincide o aparece una entrada que no es archivo ni carpeta, el comando se
detiene: dilo y no instales nada. Los módulos de interacción (ver "Los 20 ejemplos") se traen
con el mismo comando, cambiando `diorama-hero` por su nombre (puedes pasar varios). El comando
imprime las dependencias de cada uno: hoy `three`, `gsap`, `lenis` y `@types/three`. Son
dependencias nuevas: agrégalas con el sí de la persona, en un solo `npm install`. Si no hay
forma de bajar el pack (sin red), dilo y detente: no reescribas el motor a mano.

Reglas que el componente ya cumple y que no debes romper al editarlo:

- **three.js vanilla en un `useEffect` con ref, nunca JSX de React Three Fiber.** El plugin de dev
  de Believable marca todo elemento JSX y rompe los nodos de R3F (`<mesh>`, `<group>`...).
- **El motor se importa con `import()` dentro del efecto.** El template prerenderiza cada ruta en
  el servidor, donde no hay `window` ni WebGL. Un `import` estático de three en una ruta lo mete
  al bundle principal y al render del servidor.
- **Un solo reloj.** Lenis, ScrollTrigger y el render corren en `gsap.ticker`. No agregues otro
  `requestAnimationFrame` ni otro Lenis: si la página ya tiene uno en `window.__lenis`, el
  componente lo reusa.
- **GSAP en este componente, `motion` en ninguno que lo envuelva.** Nunca los dos en el mismo.

## 1. Brief

Antes de escribir código, escribe el brief en `docs/brief-diorama.md` (corto: una pantalla) y
muéstraselo al usuario. Formato, tomado de los 20 briefs originales:

```markdown
# <Marca> — "<línea de una frase>"

## Objeto
Qué modelo y por qué ese. Cómo se orienta (de frente, acostado, en diagonal).

## Planos (uno por capítulo)
1. <eyebrow> · <titular> — qué ve la cámara (lejos/cerca, desde dónde) y qué siente la persona.
2. ...
3. Cierre: encuadre limpio del objeto entero + llamado a la acción.

## Dirección de arte
Fondo, color de acento (es la luz de contorno), tipografía (un par de Google Fonts propio de esta
marca), tono. Una referencia concreta, no "moderno y elegante".

## Tiene que ser verdad
La imagen que justifica la página: "un cuadro que, impreso, sería un póster".
```

Un brief bueno nombra cosas concretas: "la espada en diagonal, la punta casi tocando su sombra",
no "un objeto destacado".

## 2. Build

```tsx
import { DioramaHero, DIORAMA_MODELS } from '../components/3d/diorama-hero'

<DioramaHero
  model={DIORAMA_MODELS.sword}          // croissant | sword | lotus, o la URL de un GLB propio
  background="#0c0b0a"                  // fondo y piso (ciclorama)
  accent="#ff7a3d"                      // luz de contorno + eyebrows
  modelRotation={[0, 0, Math.PI / 2]}   // orientar el modelo (radianes)
  chapters={[{ eyebrow, title, body }, ...]}   // un capítulo = una pantalla = un plano
  shots={[{ azimuth, elevation, distance, targetY }, ...]}  // opcional
>
  <a href="#reserva">Reservar</a>        {/* CTA sobre el primer capítulo */}
</DioramaHero>
```

- **Capítulos y planos van de a pares.** Cada capítulo ocupa una pantalla de scroll y la cámara
  viaja suave (smoothstep) de un plano al siguiente. Diseña los planos con el texto: si el texto
  está a la izquierda, el objeto vive a la derecha (el componente alterna los lados en
  escritorio).
- **Plano**: `azimuth` es el giro alrededor del objeto (0 = de frente), `elevation` la altura de
  la cámara, `distance` qué tan cerca. Varía al menos dos de los tres entre planos: si solo
  cambia la distancia, el scroll se siente como zoom, no como dirección de cámara.
- **El objeto gira con el scroll, no con el tiempo** (0,6π a lo largo de toda la sección), así
  que cada plano es determinista: se ve igual tarde lo que tarde la persona en scrollear. El
  `azimuth` es relativo a ese giro: si un plano muestra la espalda, ajusta su `azimuth` sumándole
  el giro acumulado en ese punto del scroll; no lo pelees con `modelRotation`.
- **El último plano es un cierre**: objeto entero, sin cortes, aire alrededor.
- **Modelos**: los tres de `DIORAMA_MODELS` viven en el R2 de Believe. Un GLB propio del
  usuario va en `public/` (Meshy/meshopt + WebP funciona tal cual).
- **Generar el objeto propio del usuario** (con SU cuenta de fal, conectada por el MCP oficial de
  fal; el skill `fal-modelos` dice cómo se conecta y cómo se bajan los resultados). Sin las tools
  de fal en la sesión, ofrece conectarlo como dice ese skill; si la persona no quiere, usa un
  `DIORAMA_MODELS`. **Antes de cada `run_model` o `submit_job`, di qué vas a generar, con qué
  modelo y cuánto cuesta (`get_pricing`), y espera su sí.** Al empezar, di el total esperado
  (unos US$0,90 en la prueba: imagen + modelo 3D).
  1. Imagen del objeto: `search_models` con `"nano banana"` (`fal-ai/nano-banana-2` basta,
     ~US$0,08) y `run_model`. Prompt de foto de producto sobre fondo blanco puro, objeto entero
     y centrado, luz de estudio suave, sin texto. Mírala (Read) antes de seguir.
  2. Modelo 3D desde esa imagen: `search_models` con `"meshy"` y categoría `image-to-3d` (hoy
     `meshy/v7.1/image-to-3d`). Lee su `get_model_schema`: pasa la URL de la imagen del paso 1
     en `image_url` (ya está en el CDN de fal, no hace falta `upload_file`) y
     `enable_pbr: true` (viene apagado). Es largo (unos 3 minutos, US$0,80 en la prueba): usa
     `submit_job` y después `check_job` y `get_job_result`. Nunca lo vuelvas a enviar para ver
     cómo va: cada envío se cobra. Baja el GLB crudo a `raw/` (fuera de git y de `public/`):
     `mkdir -p raw && curl -fsSL -o raw/<nombre>.glb "<url del resultado>"`.
  3. Optimízalo antes de usarlo (un GLB de Meshy pesa 10–25 MB; la cafetera de prueba bajó de
     10,5 a 1,4 MB):
     `npx -y @gltf-transform/cli optimize raw/<nombre>.glb public/models/<nombre>.glb --compress meshopt --texture-compress webp --texture-size 2048`
     Meta: menos de 8 MB. Borra la carpeta `raw/` entera.
  4. Pásalo como `model="/models/<nombre>.glb"`. Al terminar, di cuánto se gastó en la cuenta
     de fal de la persona.
- **Crédito obligatorio** (CC BY 4.0) si usas un modelo de `DIORAMA_MODELS`, en el footer:
  `Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0`.
- **La página sigue después del hero**: nav, secciones con texto específico (nada de lorem),
  CTA y footer. El diorama abre la página, no la reemplaza.

## 3. Review

No puedes ver la escena sin capturas, y una captura de página completa no sirve acá: no espera
a WebGL ni mueve el scroll. Con `npm run dev` corriendo, usa el navegador que tenga esta sesión
(un MCP de navegador, como Chrome DevTools o Playwright):

1. Abre el preview a 1440 de ancho.
2. Espera a que el canvas esté listo (repite hasta `true`; el modelo baja de la red):
   `document.querySelector('section canvas')?.style.opacity === '1'`
   y espera 3 s más (la intro de cámara).
3. Por cada capítulo, mueve el scroll y saca una captura:
   `const s = document.querySelector('section'); window.__lenis.scrollTo((s.offsetHeight - innerHeight) * 0.5, { immediate: true })`
   (0, 0.5 y 1 para tres capítulos), espera ~2 s y captura. Mira cada captura.
4. Repite el primer y el segundo plano a 390 de ancho (móvil).

Si la sesión no tiene navegador, pídele a la persona que lo revise en el suyo con la lista de
abajo, y dilo en el informe: esa parte no la verificaste tú.

Revisa cada captura como un director de arte exigente. Todas las respuestas tienen que ser sí:

1. ¿El primer cuadro detendría a alguien que va scrolleando? ¿Lo imprimirías como póster?
2. ¿La luz es motivada? Luz principal, contorno y sombra de contacto real; nada plano ni gris.
3. ¿El objeto y la tipografía se diseñaron juntos? Nada se pisa, jerarquía clara, aire.
4. ¿Cada capítulo es un plano distinto? ¿Las transiciones son suaves, sin saltos?
5. ¿El cierre muestra el objeto entero, limpio, con el CTA legible?
6. ¿En 390 px el objeto queda arriba, el texto abajo, y no hay scroll horizontal?
7. ¿La consola está limpia? (Léela en el navegador de la sesión, o pídesela a la persona.)

## 4. Revise

Corrige lo que falló y vuelve al paso 3. Problemas típicos y su arreglo:

| Lo que ves | Arreglo |
|---|---|
| El objeto queda chico y perdido | Baja `distance` del plano o sube `modelSize` |
| Un plano corta el objeto | Sube `distance` o ajusta `targetY` hacia el centro del objeto |
| El texto se pisa con el objeto | Cambia `azimuth` para mover el objeto al otro lado, o cambia el lado del texto |
| El objeto se ve de canto o de espaldas | `modelRotation` (los modelos de Meshy miran a +Z); si solo pasa en un capítulo, es el giro del scroll: ajusta el `azimuth` de ese plano |
| Brillos quemados en metal | Fondo un poco más claro o acento menos saturado; no subas la exposición |
| Todo se ve igual en los tres planos | Varía `azimuth` y `elevation`, no solo `distance` |
| Tirón al entrar | Ya se compila antes del primer cuadro; si persiste, el GLB pesa demasiado (>8 MB) |

Detente cuando las siete respuestas sean sí. Muéstrale al usuario las capturas finales, no solo
el código.

## Los 20 ejemplos de Dioramas

Antes de proponer un diorama, lee [`ejemplos/INDICE.md`](ejemplos/INDICE.md): los 20 sitios del
original, cada uno con su brief, su interacción y cuándo recomendarlo. Elige la interacción que sirve
al mensaje de la marca, no la más vistosa.

- **Módulo (10):** la interacción viene en el pack como componente aparte (`hold-power`, `xray-lens`,
  `vinyl-deck`, `koi-pond`, `exploded-view`, `chess-replay`, `rigged-walker`, `particle-morph`,
  `liquid-slosh`, `glass-wipe`). Se trae con el comando del paso 0 y se monta sobre el hero con
  `onScene`; el índice trae el ejemplo de código y las props del motor (`ao`, `volumetric`,
  `reflections`, `cursor`, `preloader`...).
- **Solo referencia (10):** la receta está en su archivo, pero el código es demasiado de su escena para
  empaquetarlo. La física de Maison Sucre (rapier, wasm de ~4 MB) no viene: dilo antes de prometerla.
- **Incompatibilidades medidas:** `xray-lens` con `ao` o `reflections` dibuja un triángulo negro
  (déjalos apagados con la lente); `koi-pond` necesita `floor={false}`.
