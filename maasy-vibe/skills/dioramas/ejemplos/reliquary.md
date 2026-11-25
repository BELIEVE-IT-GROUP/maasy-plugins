# Reliquary: el museo de lo apagado

**Slug:** `reliquary` · **Interacción:** en un museo a oscuras, el cursor es una linterna; un clic fotografía la reliquia que ilumina y su lámpara de vitrina se enciende · **Estado en Believable:** solo referencia (la gracia es el pase volumétrico del motor y una escena larga con luces por pieza; un gesto suelto no la representa)

## Qué es
Un museo que abre de 21:00 a 04:00 y entrega una linterna en la puerta. No hay luz de sala: la sala está apagada a propósito. Seis objetos de dos mil años, cada uno sobre su pedestal, y la única luz es el cono de tu linterna. El cursor la dirige (la linterna cuelga de la mano derecha de la cámara y va un poco retrasada respecto a tu mirada). El scroll camina por el pasillo de pieza en pieza. Un clic hace una foto con flash y obturador: si hay una reliquia en el haz, se "documenta", vuela una polaroid a un diario y su lámpara de exhibición se enciende lentamente. Al documentar las seis, el museo queda iluminado.

## Brief original (resumen fiel)
No hay archivo de brief para este ejemplo; esto se reconstruyó del código (`examples/reliquary/main.js` e `index.html`).
- **Marca:** Reliquary, "The Museum of the Unlit", abierto de 21:00 a 04:00, linternas en la puerta. Eslogan: "An after-hours museum. Six objects, two thousand years, and the small light in your hand."
- **Colección** (en orden de recorrido): I Guardian Lion (granito, Fujian, c. 1520), II Corinthian Helmet (bronce, Argos, c. 480 a.C.), III Jade Funerary Mask (jade, Palenque, siglo VII), IV Portrait of a Young Woman (mármol de Carrara, Roma, c. 120), V Black-figure Amphora (terracota, Atenas, c. 530 a.C.), VI Planispheric Astrolabe (latón y nogal, Toledo, 1068). Cada una con su ficha de texto breve y con humor seco.
- **Escena:** pasillo largo de losas de piedra (66 unidades), pedestales con altura distinta por pieza, piezas alternadas a izquierda y derecha, una luz de luna azul fría al fondo. Niebla densa y casi negro de fondo.
- **Interacción:** linterna con cono, polvo que existe solo donde cae la luz, foto con flash, diario de polaroids, lámparas que se despiertan, scroll que camina el pasillo con la cámara oscilando suave.
- **Secciones:** Hero ("Reli/quary", título iluminado solo donde cae la linterna) · "The night hours" ("We turned the lights off on purpose.") · citas · Membership ("Keep a key to the dark.", tres niveles, uno "lit") · Footer ("See you after dark.").
- **Arte:** negro cálido casi sin luz de relleno; luz de linterna ámbar `#ffd8a6`, luna azul `#8ea6ff`. Texto mono para metadatos.
- **Debe ser verdad:** toda pieza se lee como un objeto museístico real bajo una sola luz dura, con sombra profunda; el haz y el polvo en el aire se ven.

## La interacción única
La luz no es un efecto sobre la escena, **es el contenido**: la tarjeta de cada reliquia solo aparece mientras tu haz (o su lámpara, ya ganada) la ilumina; el título del hero se revela solo bajo el cono. Así el cursor pasa de decorativo a necesario. El juego de fotografiar sirve de recorrido guiado sin parecer un tour.

## Cómo se implementa
**1. Un solo `SpotLight` real, el resto oscuridad.** La linterna es un `SpotLight(0xffd8a6, 0, 26, 0.29, 0.42, 1.7)` (ángulo 0.29, penumbra 0.42) con sombras de 2048 y un `map` (cookie) en canvas: degradé radial con un anillo más claro y manchas de "imperfecciones del reflector" para que el cono no sea un disco perfecto. Con fondo casi negro, `scene.environmentIntensity = 0.035`, hemisférica de 0.05 y niebla exponencial `0.034`, solo lo que toca el haz existe.

**2. Apuntar.** Hacia dónde mira la linterna es la combinación del puntero y un barrido en reposo:

```ts
const user = clamp(1 - (t - lastMove - 3.5) / 2.5)                     // 1 mientras te mueves; 0 tras ~6 s quieto
const idle = { x: proyeccionDeLaReliquia.x + sin(t*0.33)*0.3, y: ... } // el barrido orbita la pieza de la estación actual
aimNdc.set(lerp(idle.x, pointer.sx, user), lerp(idle.y, pointer.sy, user))
ray.setFromCamera(aimNdc, camera)
const hand = new Vector3(0.2, -0.2, -0.05).applyQuaternion(camera.quaternion).add(camera.position)   // mano derecha
lantern.position.copy(hand)
lightDir.lerp(ray.ray.direction, 1 - Math.exp(-12 * dt)).normalize()    // retraso suave
lantern.target.position.copy(camera.position).addScaledVector(lightDir, 6)
```

El barrido en reposo garantiza que nunca te quedes en la oscuridad sin pieza visible. Un parpadeo `1 + sin(41t)*sin(17.3t)*0.025` da vida a la llama. Para que no se queme la exposición cuando una pieza queda cerca, la intensidad se corrige por distancia: `clamp((dist/4.6)^1.6, 0.4, 1.25)`.

**3. Haz visible.** El original usa `VolumetricSpotEffect` con `vol.add(lantern, { scale: 0.0028, range: 0.09, softness: 0.35 })` y densidad `0.024`. En Believable es `VolumetricSpotPass` de `dioramas-volumetric.ts` (`Engine` con `post.volumetric`). El polvo es aparte: 7 000 puntos aditivos que derivan despacio y solo alzan su alfa donde `dot(dir_a_punto, lightDir) > cos(angle * 0.95)`, atenuados por distancia al cuadrado.

**4. Caminar.** `walkT = damp(walkT, elementProgress(walkEl) * (n - 1), 5, dt)`. Entre estaciones la cámara interpola `view` y `look` con `smooth(0.18, 0.82, f)`, se desplaza hacia el eje central a mitad del trayecto (`x *= 1 - sin(f*PI)*0.7`) para no chocar con pedestales y sube un poco. Oscila con el puntero y un seno lento.

**5. Cada reliquia.** `normalize` por altura (`h`), pedestal de `RoundedBoxGeometry` con una textura de rugosidad bakeada con fbm, `yaw` por pieza, y una **lámpara de vitrina** propia (`SpotLight` ámbar con intensidad 0 hasta que la ganas, `lampPower` por pieza: 30 para el león, 7 para el astrolabio). Pesos y colores de pieza se ajustan con `rough`/`env` por material.

**6. La foto.**

```ts
function photograph() {
  if (lantern.power < 0.5) return
  shutterSound()                                             // ruido blanco con envolvente + bandpass 2400 Hz, WebAudio sin assets
  gsap.fromTo(flash, { intensity: 42 }, { intensity: 0, duration: 0.7, ease: 'power3.out' })   // PointLight en la cámara
  gsap.fromTo(flashEl, { opacity: 0.5 }, { opacity: 0, duration: 0.8, ease: 'expo.out' })      // velo blanco DOM
  captureAt = { x: pointer.px, y: pointer.py, frames: 3 }   // se captura 3 cuadros después, con el flash en su pico
}
// engine.onAfterRender: al cumplirse los cuadros, elegir la reliquia con menor angleTo(aimDir) < 0.16 rad y distancia < 9.5
// recortar el canvas WebGL: drawImage(renderer.domElement, sx, sy, cw, ch, 0, 0, 420, 280) -> toDataURL('image/jpeg', 0.85)
```

Para poder leer el canvas hay que capturar dentro de `onAfterRender` (mismo frame) o crear el renderer con `preserveDrawingBuffer`. La polaroid (un div con la imagen) vuela con GSAP hasta su casilla del diario; la lámpara de la pieza sube su intensidad en 2.8 s. Con las seis fotos, todas las lámparas suben un 25 %.

**7. Cuándo ignorar el clic.** Fuera de enlaces, botones y paneles (`e.target.closest('a,button,.tier,.panel')`).

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/reliquary/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `guardian.glb` | León guardián de granito (pieza grande, 1.75 de alto) | 5.2 MB |
| `helmet.glb` | Casco corintio de bronce | 4.5 MB |
| `mask.glb` | Máscara funeraria de jade | 4.9 MB |
| `bust.glb` | Busto de mármol de una joven romana | 4.5 MB |
| `amphora.glb` | Ánfora de figuras negras | 3.6 MB |
| `astrolabe.glb` | Astrolabio planisférico | 6.0 MB |

Son 28.7 MB: carga la pieza de la estación actual y la siguiente, y el resto a demanda.

## Cuándo recomendarlo
- **Encaja:** museos y galerías, joyería, relojería, licores y objetos de lujo, cine y videojuegos de misterio, catálogos de piezas únicas. Cualquier marca que quiera que el visitante "descubra" el producto con su propia luz.
- **No encaja:** productos que necesitan verse completos y bien iluminados desde el primer segundo (comercio de catálogo, B2B), usuarios sin puntero (en táctil el barrido en reposo hace casi todo y la gracia se pierde) y marcas luminosas. Es costoso: luz con sombra, volumétrico y seis modelos. Da siempre un modo "encender las luces" para accesibilidad.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
