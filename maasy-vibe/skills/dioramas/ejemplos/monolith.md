# Monolith: arrastra el sol sobre una casa
**Slug:** `monolith` · **Interacción:** el sol es una manija sobre un arco visible; arrastrarlo (o hacer scroll) recorre un día entero · **Estado en Believable:** solo referencia (ciclo del día con luz, cielo, sombras y noche; sin módulo reutilizable)

## Qué es
Sitio de un pequeño estudio de arquitectura (Lisboa y Oslo) conocido por casas en sitios extremos. Una casa en un acantilado sobre un pedestal; la luz es el contenido. Estilo suizo minimalista, mucho aire, tipografía grande.

## Brief original (resumen fiel)
- **Marca:** Monolith. Titular: "Houses that answer to the sun."
- **Interacción:** la casa (`house.glb`) está sobre un pedestal en un vacío de galería. El visitante arrastra el sol por un arco visible (o hace scroll) durante un día: amanecer (bajo, rosado), mediodía (duro, blanco, sombras cortas), hora dorada (largo, ámbar), hora azul, noche (luz de luna, estrellas, ventanas cálidas, piscina turquesa). Dirección, color e intensidad de la luz, cielo, niebla, entorno y exposición se interpolan.
- **La estrella:** sombras de alta calidad (cámara de sombra ajustada, mapa de 4096, sesgo calibrado) barriendo el concreto. Lectura de la hora (06:12, 12:00, 19:41) y acimut/altitud del sol.
- **Noche:** planos emisivos en los vidrios del modelo (cajas delgadas ubicadas inspeccionando el modelo) y luz puntual cálida dentro.
- **Secciones:** Nav, Hero, Obras (lista con imágenes al pasar el mouse), La casa del acantilado (planta, corte y detalle con estados de cámara), Principios (3 o 4 numerados), Estudio y premios, Contacto, Footer.
- **Arte:** off-white cálido `#ecebe6`, gris concreto, texto negro, un acento (ámbar solar). Tipografías Inter Tight e IBM Plex Serif en cursiva. Retícula estricta de 12 columnas, numerales grandes.
- **Debe cumplirse:** cuadro de hora dorada con sombras largas y rasantes sobre la casa y el acantilado; cuadro de noche con ventanas brillando y estrellas.

## La interacción única
Arrastrar un punto sobre un arco 3D. El código lo resuelve en pantalla, no en 3D: el arco se muestrea en puntos del mundo (`ARC`), se proyectan con `project(camera)`, y el puntero se asigna al segmento más cercano interpolando la hora `t` (`pickArc`). Al soltar, el sol conserva la velocidad y se desliza con inercia (`coastV`, decae con `exp(-3.2 dt)`, tope 2,2 h/s). La hora representada (`clockT`) persigue la hora del usuario con `damp` (12 mientras arrastra, 9 al deslizar, 2,6 en reposo). Scrollear lejos suelta al usuario y devuelve el control al scroll. En táctil el arrastre es horizontal con umbral (10 px y relación 1,2) para no secuestrar el scroll vertical.

## Cómo se implementa
1. **Astronomía real** (`sun.js`): sitio Cabo Espichel (38,42 N, 9,22 O), solsticio de junio (declinación 23,44 grados). La altitud sale de `sinAlt = sin(lat) sin(dec) + cos(lat) cos(dec) cos(H)` con `H = (hora - NOON) * 15 grados`, y el acimut con `atan2`. `compassDir(az, alt)` pasa a vector del mundo con un desfase de norte (la casa está rotada para que la terraza mire a 240 grados). Rango de la manija: 5,5 h a 22,75 h. Amanecer y atardecer con refracción (altitud -0,83 grados).
2. **Paleta por hora** (`palette(h)`): lista de 17 fotogramas clave con zenit, horizonte, color del sol, intensidad `I` (de 0 a 3,2), entorno `amb` y `ink` (para el tema de la UI), interpolados con smoothstep; deriva `night` (0 de día, 1 en noche cerrada) y `stars`. Por ejemplo, a las 19:30 `{ zen '#aeb8cb', hor '#f8d7a0', sun '#ffc278', I 3.2 }`.
3. **Cielo y entorno desde el mismo shader:** una esfera `BackSide` (r = 300, `gl_Position = p.xyww` para que quede al fondo) mezcla horizonte y zenit con `pow(h, 0.42)`, suma halo solar (`pow(cs, 5)`, `pow(cs, 48)`), la "faja de Venus" rosada opuesta al sol bajo, y luna. La misma función con `#define ENV` se hornea en un `WebGLCubeRenderTarget(64, HalfFloat)` con `CubeCamera` y `PMREMGenerator.fromCubemap`, y se asigna a `scene.environment` cada 2 cuadros si la hora cambió más de 0,02 h. Así la luz ambiente y los reflejos siempre coinciden con el cielo.

```ts
function bakeEnv() {
  cubeCam.update(renderer, envScene)
  envRT = pmrem.fromCubemap(cubeRT.texture, envRT)
  scene.environment = envRT.texture
}
```

4. **La luz y sus sombras** (lo que más pesa en el resultado):

```ts
const sun = new THREE.DirectionalLight(0xffffff, 3)
sun.castShadow = true
sun.shadow.mapSize.set(4096, 4096)
const SH = 4.6                                    // cámara de sombra ceñida a la casa (9,2 u de lado)
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 0.5, far: 110 })
sun.shadow.bias = -0.00012
sun.shadow.normalBias = 0.018
sun.shadow.radius = 2
sun.shadow.autoUpdate = false                     // se recalcula solo cuando el sol se mueve
// por cuadro:
sun.position.copy(center).addScaledVector(lightDir, 40)
if (Math.abs(clockT - lastShadowT) > 0.0015) { sun.shadow.needsUpdate = true; lastShadowT = clockT }
```

De noche la luz direccional pasa a ser la luna (`MOON_DIR`, color `0.55, 0.66, 1`, intensidad 0,55) en una transición suave `sunUp`/`moonUp` por la altitud.
5. **Ventanas y piscina nocturnas:** la casa es una sola malla; el original NO coloca planos. Parchea el material y detecta zonas por coordenadas "crudas" del modelo (`vRaw`) con cajas suaves (`boxm`) y la luminancia del albedo (vidrios claros), y suma `totalEmissiveRadiance += uWin * win * ... * uNight`. El agua se reconoce por el azul del albedo (`blu_`) y bajo `y = 0,125`, con ondas por normales y brillo `uPool`. Tres `PointLight` cálidas/turquesa dentro de la casa suben con `pal.night * 7`. El umbral del bloom baja de 2,0 a 0,85 de noche.
6. **Planta y corte en vivo:** planos de recorte (`clippingPlanes` + `clipShadows`) que se animan, "poché" arquitectónico para las caras traseras (relleno gris con tramado a 45 grados) y contornos de corte exactos calculados una vez por intersección triángulo-plano y dibujados con `LineSegments2`.
7. **Estrellas** (7.000 `Points` con tamaño y parpadeo por semilla, solo visibles de noche), **luna** como disco con halo, y una **gradación de hora dorada** (post, después del tono) que sube saturación y empuja el matiz hacia el dorado, activa de 18:42 a 21:12.
8. **Ancla HTML a 3D** y una barra horaria con degradado del color real del horizonte durante el día; el tema de la UI cambia con `pal.ink`.

Piezas del motor de Believable que sirven: `studioEnvironment` NO (aquí el entorno sale del cielo), `smoothScroll` y `damp/clamp/smooth/lerp` sí; `fbmTexture` (`dioramas-textures.ts`) para el concreto; el cursor y la navegación de `dioramas-ui.ts`.

## Modelos
| Archivo | URL R2 | Qué es | Tamaño aprox. |
|---|---|---|---|
| `house.glb` | `https://files.believe-global.com/believable/dioramas/v1/monolith/house.glb` | Casa en acantilado con pileta. Un mesh, un material; en el original se rota `Math.PI` y se escala a 4 unidades | 8,9 MB |

## Cuándo recomendarlo
- **Sí:** arquitectura, interiorismo, inmobiliario de lujo, paisajismo, fotografía, hospitalidad, cualquier cosa donde la luz y la hora cambian lo que se ve (restaurantes, hoteles, terrazas); portafolios sobrios.
- **No:** productos pequeños sin relación con la luz natural, marcas ruidosas, páginas de conversión rápida. Es de las más costosas: sombra de 4096, re-horneado del entorno, planos de corte y tramado.
- Ofrece siempre un control alternativo al arrastre (la barra horaria con flechas del teclado, como el original) para accesibilidad y táctil.

## Créditos
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Código de referencia: `examples/monolith` (MIT, Copyright (c) 2026 Blendi).
