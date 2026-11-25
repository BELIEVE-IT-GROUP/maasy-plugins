# Atlas of Drifting Isles: viaja entre islas flotantes
**Slug:** `atlas` · **Interacción:** clic en una isla (o en un punto del mapa) y la cámara vuela hasta ella por una curva a través de las nubes, inclinándose en la curva, y luego la orbita · **Estado en Believable:** solo referencia (el vuelo, las nubes suaves y la atmósfera están ligados a la escena entera; no hay un objeto que aislar como módulo)

## Qué es
Atlas of Drifting Isles es una agencia de viajes en dirigible por un archipiélago de fantasía. Cuatro islas pintadas a
mano flotan en un cielo infinito de nubes suaves; la página es el viaje: cada destino es una estación de cámara.
Estilo de cuento, pero premium.

## Brief original (resumen fiel)
- **Islas:** `lighthouse`, `falls`, `pagoda`, `windmill` (estilizadas, pintadas a mano). Flotan con un vaivén suave.
- **Interacción:** clic en una isla (o en un punto del mapa) y la cámara vuela a lo largo de una curva por las nubes
  (inclinación lateral, "respiración" del FOV), luego orbita la isla mientras entra su panel de destino. El scroll
  también avanza la gira de isla en isla.
- **Vida:** cascadas que caen de los bordes (partículas más neblina), bandadas de aves (boids instanciados), un
  dirigible procedural cruza el cielo. Pasar sobre una isla da un contorno suave y un rótulo.
- **Nubes:** muchos billboards suaves con desvanecido por profundidad (soft particles) o una capa raymarcheada. Deben
  verse suaves y volumétricas, nunca como tarjetas planas. Cielo en degradé con sol cálido y bruma atmosférica.
- **Secciones:** nav · hero ("The map is not the territory. The territory floats.") · 4 destinos (nombre, "3 h from
  Port Aubade", puntos clave, precio) · la flota de dirigibles · CTA de reserva · footer.
- **Arte:** azul cielo `#7cc4ff`, durazno, crema. Young Serif + Nunito Sans. Luz que respeta las texturas pintadas
  (entorno bajo, luz clave suave, contorno suave).
- **Must be true:** hero con las cuatro islas en un paisaje de nubes luminoso con profundidad; un cuadro del vuelo a
  mitad de curva atravesando nubes.

## La interacción única
Navegar es volar. Las estaciones (0 = hero, 1 a 4 = islas, 5 = reserva) se eligen por clic, por punto del mapa o por
scroll (los `.stop` de la página mandan la estación activa). El vuelo no interpola dos poses: sigue una **curva de
Bézier cúbica** con control lateral, y la cámara se inclina según cuánto gira la trayectoria.

## Cómo se implementa
Cuatro piezas independientes; arma solo las que el proyecto necesite. Todo three vanilla dentro de un `useEffect`
(ver el patrón en `diorama-hero`), con `Engine` del pack.

**1. Estaciones y pose.** Cada isla declara `{ pos, s, yaw, az, sweep, dist, h, side }`: posición, escala, a qué ángulo
se orbita, cuánto barre el scroll dentro de la estación, distancia, altura y de qué lado cae el panel de texto. Datos
reales del original: lighthouse `pos [6.4, 0.6, 7]`, windmill `[22, -4, -14]`, falls `[-1, 12, -32]`, pagoda
`[30, 16, -56]`; `dist` 14.5 a 16.5; hero en `[0, 6.5, 31]` mirando a `[1, 5.2, 0]`. La pose orbital es:
```ts
const az = I.yaw + I.az + (local - 0.5) * I.sweep          // local = progreso de scroll dentro de la estación
pos.set(c.x + Math.sin(az) * R, c.y + I.h, c.z + Math.cos(az) * R)
look.copy(c)
```
Con `side` se corre `look` hacia un lado para que la isla quede fuera del panel de texto. En retrato el radio crece
(x1.45), la altura x1.25 y el FOV base pasa de 40 a 56.

**2. El vuelo (Bézier + balanceo).** Al elegir una estación se congela `p0` (cámara actual) y se arman los puntos de
control con un desvío lateral proporcional a la distancia (`dist * 0.26`) que alterna de lado en cada vuelo:
```ts
const ease = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2)
P3 = pose.pos
P2 = P3 + back * dist * 0.3 + lat + dip + UP * dist * 0.05
P1 = p0 + dir * dist * 0.2 + UP * dist * 0.06            // o p0 + velocidad si ya iba en movimiento
// cada cuadro:  cam.pos = bez(p0, P1, P2, P3, ease(u))
cam.fov = lerp(fov0, pose.fov, k) + Math.sin(Math.PI * u) ** 2 * 13   // el FOV "respira" +13 grados a mitad
roll = clamp((yawRate * 0.45 + turn * 0.55) * Math.sin(Math.PI * clamp(u * 1.15)) ** 0.7, -0.5, 0.5)
camera.lookAt(look); camera.rotateZ(roll)
```
Duración: `clamp(2.4 + distancia * 0.02, 2.8, 4.4)` s (el vuelo de intro dura 5.2 s; con `prefers-reduced-motion`, la
mitad y sin respiración de FOV ni balanceo). La mirada no apunta a la isla durante todo el trayecto: se mezcla
primero hacia la tangente de la curva (`smooth(0, 0.35, u)`) y luego hacia el destino (`smooth(0.42, 0.92, u)`), y se
fuerza un `dir.y` mínimo para no perder el horizonte al rozar el mar de nubes. Cuando termina, `damp` mantiene la
orbita. Al volar, el paralaje del mouse baja a 15 %.

**3. Nubes suaves (lo que más se ve).** Un único `InstancedBufferGeometry` de billboards "de eje vertical" (se
orientan a la cámara pero conservan el arriba del mundo), hasta 1.800 instancias, ordenadas de atrás hacia adelante
en la CPU cada cuadro. Todo el secreto está en tres decisiones:
- *Atlas horneado en GPU.* Un shader dibuja 4 mosaicos de cúmulos (11 esferas SDF mezcladas con ruido fbm; el
  mosaico 3 es estrato largo para el mar de nubes). Un segundo pase marcha la densidad hacia arriba y hacia el sol
  para guardar el **autosombreado**: `rojo = densidad`, `verde = luz transmitida`.
  ```glsl
  for (int i = 1; i <= 16; i++) acc += den(p + vec2(0.01, 0.024) * float(i), tile);
  float T = exp(-acc * 0.15);                         // luz que llega a este punto
  ```
- *Tres tonos.* El color mezcla sombra azulada `#a6bade`, medio `#fae5d9` y luz `#fffaf2` según `L = (0.3 + 0.7 * verde)`,
  y se hunde en el color del cielo con niebla `1 - exp(-(0.0034 * z)^2)`.
- *Partículas suaves.* Se renderiza la profundidad de **solo las islas y el dirigible** (capa 1, `overrideMaterial`,
  `DepthTexture`, media resolución) y el fragmento de la nube se desvanece cerca de lo que toca:
  `soft = clamp((sceneZ - vViewZ) / (size * 0.28), 0, 1)`. Sin eso, las nubes cortan las islas con un borde duro, que
  es justo lo que delata las "tarjetas planas". También se desvanecen cerca de la cámara para no taparla.
- Usa un RNG con semilla (`mulberry32`) para que el cielo sea el mismo en cada visita. Hay "mechones" que se
  recolocan sobre la curva de cada vuelo para que cada trayecto pase por nubes.

**4. Atmósfera compartida y vida.**
- *Una sola función de cielo* `skyColor(dir)` (cenit `#3f8fe0`, medio `#7cc4ff`, horizonte `#ffe4cc`, debajo `#f3e4dc`,
  disco solar HDR) usada por el domo, las nubes, las islas y las aves: todos se funden en el color del cielo detrás
  de ellos, por distancia y por una bruma baja bajo el mar de nubes. Las islas la reciben parcheando el material
  estándar con `onBeforeCompile` (`atmosphere(color, worldPos)` antes de `fog_fragment`) y, de paso, un rim dorado al
  hover (`pow(1 - ndv, 5) * uHover`).
- *Cascadas.* La hoja esculpida del modelo se disuelve con ruido en el borde (`discard` por dither) y desde ahí cae un
  `Points` de 5.000 partículas, cada una con su vida `fract(t * rate + semilla)` sobre el segmento del labio.
- *Aves.* 56 individuos (70 por defecto) con boids en CPU (separación, alineación, cohesión con radio 3, y atracción a
  un punto que gira alrededor de la isla actual a radio 7). Una `InstancedMesh` de 18 triángulos; el aleteo es una
  línea en el vertex shader:
  ```glsl
  float fl = sin(uFlapT * (11.0 + phase * 4.0) + phase * 40.0);
  transformed.y += abs(wing) * fl * 0.32 * (1.0 - glide * 0.85);
  ```
- *Isla viva.* `bob.position.y = sin(t * 0.42 + fase) * 0.22` más un cabeceo mínimo en x y z.
- *Dirigible.* Procedural: envoltura torneada a rayas con textura de canvas, aletas, góndola, hélices.

**Motor.** El original usa `postprocessing` de pmndrs (AO, bloom, tono neutral, viñeta y ruido). En Believable, usa el
`Engine` del pack: `post: { bloom: { strength: 0.3, threshold: 1.25 } }` y `fov: 40, near: 0.3, far: 2600`.
`renderer.shadowMap.autoUpdate = false` ahorra mucho en esta escena (las islas casi no se mueven).

## Modelos
Base: `https://files.believe-global.com/believable/dioramas/v1/atlas/`

| Archivo | Qué es | Tamaño |
|---|---|---|
| `lighthouse.glb` | Isla del faro (Lanternholm) | 7,76 MB |
| `windmill.glb` | Isla del molino (Amberlea), con cascada | 6,14 MB |
| `falls.glb` | Isla de las cascadas (Hollowmere) | 7,62 MB |
| `pagoda.glb` | Isla de la pagoda (Hanakumo), con pétalos | 7,37 MB |

Son ~29 MB en total: carga primero la isla del hero y trae las demás en segundo plano mientras el visitante lee.

## Cuándo recomendarlo
- **Encaja:** viajes, turismo, juegos, hoteles, contenido infantil o de fantasía, cualquier "mapa de destinos" donde
  cada destino sea un lugar con su propia atmósfera. Landings con 3 a 5 estaciones y poco texto por estación.
- **No encaja:** marcas serias o técnicas (finanzas, salud, B2B). Páginas con mucho contenido corrido, donde el vuelo
  se vuelve un obstáculo. Móviles de gama baja: la escena (nubes ordenadas, profundidad extra, partículas) es pesada;
  baja a 600 nubes y apaga el pase de profundidad (`uSoftOn = 0`) si no llega a 40 fps.

## Créditos
Ideas y código de referencia de Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi.
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Muestra el crédito de forma visible.
