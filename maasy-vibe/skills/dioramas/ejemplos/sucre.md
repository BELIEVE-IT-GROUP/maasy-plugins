# Maison Sucre: una pastelería con gravedad
**Slug:** `sucre` · **Interacción:** pasteles que llueven sobre un mostrador de mármol con física real, el cursor los empuja y se pueden agarrar y lanzar · **Estado en Believable:** solo referencia (usa `@dimforge/rapier3d-compat`, dependencia nueva con wasm de ~4 MB; no se porta como módulo)

## Qué es
Maison Sucre es una pastelería parisina famosa por sus macarons. La página es un mostrador de mármol rosa pálido
donde macarons, fresas, croissants y tartas caen, rebotan y se apilan de verdad, con una torta de tres pisos girando
lentamente en su base como portada de revista. Es alegre, táctil e impecable.

## Brief original (resumen fiel)
- **Interacción:** física con Rapier. Macarons rosa y pistacho, fresas, croissants y tartas llueven y se apilan con
  rebotes creíbles. Un `InstancedMesh` por tipo y colisionadores simplificados. El cursor es un cuerpo cinemático
  (esfera invisible que sigue al puntero sobre el plano del mostrador); clic y arrastre agarra una pieza con un
  resorte y se puede lanzar. "Build a box": soltar 6 macarons en una caja de regalo (procedural, con ranuras); las
  ranuras llenas encajan y la caja se cierra con un listón al completarse (contador y CTA "Order this box, 24 EUR").
- **Secciones:** nav · hero ("Sugar, almonds, and a little gravity.") · La Carte (al pasar sobre un ítem, ese tipo
  salta en el mostrador) · Build a box · L'Atelier (desde 1962, rue du Bac) · Visit · footer.
- **Arte:** rosa pastel `#f6d9df`, pistacho, crema, pan de oro. Playfair Display cursiva + DM Sans. Luz de día suave,
  sombras suaves, profundidad de campo sutil.
- **Must be true:** un cuadro con una pila deliciosa de macarons y fresas fotorrealistas sobre mármol, a mitad de
  rebote, que dé hambre. 60 fps con ≤120 cuerpos.

## La interacción única
Física real, no animación fingida: gravedad, fricción, restitución y colisiones entre piezas. Cuatro gestos:
llover (cola con retardos), empujar con el cursor, agarrar y lanzar, y "golpecito" (un anillo de impulsos que viaja
desde un punto). Por qué no se porta: pesa más que todo el resto del pack junto y casi ninguna landing la necesita.

## Cómo se implementa
**Dependencia y peso (medido en el registro de npm).** `@dimforge/rapier3d-compat@0.21.0` (la versión que fija el
`package-lock.json` del repo; licencia Apache-2.0). Tarball de 4,99 MB, 15 MB descomprimido en 54 archivos. El build
`compat` lleva el wasm embebido en base64 dentro de `dist/rapier.mjs`: 4,34 MB sin comprimir, ~1,66 MB con gzip. Eso
se suma al bundle de la ruta, por eso se carga solo con `import()` dentro del efecto y solo en la sección que lo usa.

**Integración en el template (TanStack Start, prerender).**
1. Pide aprobación al usuario para instalar `@dimforge/rapier3d-compat@0.21.0` (es una dependencia nueva).
2. Nunca `import RAPIER from ...` arriba del archivo de una ruta: el prerender lo metería en el render del servidor.
   Todo va dentro de un `useEffect`:
```tsx
useEffect(() => {
  let disposed = false
  void (async () => {
    const [{ default: RAPIER }, E] = await Promise.all([import('@dimforge/rapier3d-compat'), import('./dioramas-engine')])
    await RAPIER.init() // compila el wasm; sin esto cualquier llamada falla
    if (disposed) return
    const world = new RAPIER.World({ x: 0, y: -40, z: 0 }) // la escena está a escala de juguete: gravedad 40, no 9.8
    world.integrationParameters.numSolverIterations = 6
    // Mostrador: losa fija + pared trasera.
    const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    world.createCollider(RAPIER.ColliderDesc.cuboid(20, 1, 4.1).setTranslation(4, -1, 0.5).setFriction(0.9).setRestitution(0.35), fixed)
    // Dedo del cursor: cinemático, lo mueves cada cuadro hacia el punto del puntero sobre el plano y = 0.3.
    const finger = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -30, 0))
    world.createCollider(RAPIER.ColliderDesc.ball(0.34).setFriction(0.3).setRestitution(0.1), finger)
    // ... cuerpos dinámicos (ver abajo) y, en engine.onTick:
    //   const n = Math.max(1, Math.ceil(dt / (1 / 100))); world.timestep = dt / n
    //   for (let s = 1; s <= n; s++) { finger.setNextKinematicTranslation(lerp(prev, target, s / n)); world.step() }
    //   luego copia translation()/rotation() de cada cuerpo a su instanceMatrix.
  })()
  return () => { disposed = true /* world.free() y dispose de geometrías */ }
}, [])
```
3. **Subpasos y barrido del dedo.** El original divide cada cuadro en pasos de 1/100 s y mueve el dedo cinemático
   a lo largo de cada subpaso; sin eso, un cursor rápido atraviesa las piezas.

**Cuerpos y colisionadores por forma** (las medidas salen de la caja del modelo ya normalizado a `size`):

| Tipo | Archivo de render | `size` | Cuántos | Colisionador | friccion / restitución / densidad |
|---|---|---|---|---|---|
| macaron rosa (`macA`) | `macaron-lo.glb` | 0.54 | 48 | `roundCylinder(hh - br, r - br, br)`, `r = max(dx,dz)/2*0.97`, `hh = dy/2*0.96`, `br = min(0.07, hh*0.45)` | 1.0 / 0.16 / 1.0 |
| macaron pistacho (`macB`) | `macaron2-lo.glb` | 0.54 | 16 | igual | 1.0 / 0.16 / 1.0 |
| fresa | `strawberry-lo.glb` | 0.46 | 26 | `ball(r)`, `r = (dx+dy+dz)/6*0.86` | 0.9 / 0.26 / 1.1 |
| croissant | `croissant-lo.glb` | 1.3 | 7 | `capsule(L/2 - r, r)` sobre el eje más largo (rotada si es x o z), `r = min(otras dims)/2*0.95` | 1.0 / 0.08 / 0.35 |
| tarta | `tart-lo.glb` | 0.98 | 5 | `cylinder(dy/2, max(dx,dz)/2*0.98)` | 1.0 / 0.04 / 0.9 |

Son 102 cuerpos en total. Cada cuerpo nace deshabilitado y "estacionado" bajo el mundo (`setEnabled(false)`,
`y = -40`), se activa al caer y se vuelve a estacionar si cae por debajo de `y < -4` o fuera del mostrador: el
número de cuerpos vivos nunca crece. Amortiguación lineal 0.12, angular según el tipo (0.7 a 2.5), `setCcdEnabled(true)`.
Croissants y tartas tienen un par de enderezado (torque proporcional a cuánto se inclinaron), porque pesan abajo.

**Render.** Un `InstancedMesh` por tipo con la geometría "horneada" a `Float32` y normalizada (el modelo viene
cuantizado con meshopt). Los modelos `-lo` son los que se dibujan; los `-shadow` (≈1,5k triángulos) son proxies que
comparten el `instanceMatrix` en un `InstancedMesh` con `colorWrite: false` y solo proyectan la sombra. El color de
cada macaron sale de un atributo instanciado `aTint` (desplazamiento de matiz, saturación y valor) inyectado con
`onBeforeCompile` en el `map_fragment`: un solo modelo da rosa, limón, violeta, chocolate y vainilla.

**Gestos.** *Lluvia:* una cola de `{at, cuerpo, x, y, z}` ordenada por tiempo; se eligen primero los cuerpos
estacionados y luego los más lejanos. *Agarrar:* `world.castRay` con filtro que solo acepta colisionadores de pasteles;
la pieza sigue a un plano de arrastre con una velocidad `k = 16 * (objetivo - posición)` limitada a 38. *Soltar:*
conserva la velocidad con un 10 % extra para que se pueda lanzar. *Golpe:* impulsos retardados por `distancia / 8`.
*Torta:* un cuerpo `kinematicVelocityBased` con cilindros apilados `{y, h, r}` = (0, .7, .5), (.7, .4, 1.28),
(1.1, .82, .9), (1.92, .84, .74), (2.76, .9, .56) y `setAngvel({y: 0.14})`; copias su cuaternión a la malla cada cuadro.

**Caja de regalo.** Procedural: seis ranuras en 2 x 3, una pieza que cae cerca se "captura" por un arco hacia la
ranura libre más cercana; al llenarse la tapa se cierra y un listón se anuda. **Sonido:** WebAudio sintetizado
(golpecitos, papel, campanilla), apagado por defecto y solo después de un gesto del usuario.

## Modelos
Base: `https://files.believe-global.com/believable/dioramas/v1/sucre/`

| Archivo | Qué es | Tamaño |
|---|---|---|
| `cake.glb` | Torta de tres pisos (hero) | 5,89 MB |
| `macaron-lo.glb` / `macaron2-lo.glb` | Macarons para instanciar | 2,02 MB / 2,17 MB |
| `strawberry-lo.glb` | Fresa | 2,49 MB |
| `croissant-lo.glb` | Croissant | 0,80 MB |
| `tart-lo.glb` | Tarta | 1,20 MB |
| `*-shadow.glb` (5) | Proxies de sombra | 7 a 13 KB cada uno |
| `macaron.glb`, `macaron2.glb`, `strawberry.glb`, `croissant.glb`, `tart.glb` | Versiones sin decimar (no las usa la página) | 2,36 / 2,47 / 2,83 / 2,50 / 3,06 MB |

## Cuándo recomendarlo
- **Encaja:** pastelería, dulces, juguetes, regalos, confitería, cualquier producto pequeño y apilable donde caer y
  rebotar sea el gancho. También "arma tu caja" en e-commerce de packs.
- **No encaja:** si basta con que algo caiga una vez, usa una animación GSAP y no pagues 4 MB de wasm. No para
  móviles de gama baja con más de ~60 cuerpos. No para productos que deben verse quietos y exactos.

## Créditos
Código adaptado de Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Rapier:
Apache-2.0. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Muestra el crédito de forma visible.
