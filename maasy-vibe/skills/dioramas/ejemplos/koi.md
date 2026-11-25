# Still Water: toca el estanque

**Slug:** `koi` · **Interacción:** un estanque de koi con simulación de ondas en GPU; el cursor deja estelas en el agua y cada clic suelta comida hacia la que nadan los peces · **Estado en Believable:** módulo `koi-pond`

## Qué es
Un ryokan de siete habitaciones en Kioto construido alrededor de un estanque de koi de 200 años. El hero es el estanque visto desde arriba, ligeramente inclinado, llenando la pantalla: agua verde tinta, koi nadando bajo la superficie, lotos que cabecean. Mueves el cursor y arrastras una estela; haces clic y cae un pellet con su anillo de ondas, los peces giran y nadan hacia él. Debe parecer una fotografía de un estanque real.

## Brief original (resumen fiel)
- **Marca:** Still Water, ryokan de siete habitaciones en Kioto.
- **Interacción:** estanque visto desde arriba con **simulación GPGPU de ondas** (ecuación de onda sobre un heightfield en render targets float ping-pong, ~512²). El cursor deja estelas; el clic suelta un pellet (salpicadura y anillo) y los koi giran y nadan hacia él (dirección: errar, separación, buscar).
- **Koi:** `kohaku.glb` y `showa.glb`, 6 a 10 instancias con ondulación de cuerpo en el vertex shader (seno a lo largo del eje largo, amplitud creciente hacia la cola; la cola late más fuerte a más velocidad). Se renderizan bajo la superficie, refractados y oscurecidos por la profundidad.
- **Agua:** refracción del fondo (piedras de río oscuras y arena, procedural) con las normales de las ondas, reflejo fresnel del cielo con siluetas de arces, destellos del sol, cáusticas en el fondo.
- **Flotantes:** loto (`lotus.glb`) que cabecea con las ondas; hojas de arce que caen, aterrizan y giran. Linterna de piedra (`lantern.glb`) sobre una roca en la orilla; musgo.
- **Secciones:** Nav · Hero ("Seven rooms. One pond. No clocks.") · Las habitaciones (3 tarjetas: Moss, Maple, Moon, desde ¥68,000) · Kaiseki y té · Las estaciones · Reserva · Footer. Al hacer scroll la cámara se desplaza sobre el estanque.
- **Arte:** agua verde tinta, bermellón `#e0503a`, paneles de papel washi `#f3efe6`. "Shippori Mincho" y "Zen Kaku Gothic New", pequeños acentos verticales en japonés. Movimiento quieto y meditativo.
- **Debe ser verdad:** el plano del hero parece la foto de un estanque real con koi bajo agua ondulada.

## La interacción única
El agua **recuerda**. No hay animaciones de ripple prefabricadas: cada toque inyecta altura en un campo 2D y la ecuación de onda lo propaga, lo refleja en la orilla y lo amortigua. Por eso las estelas se cruzan e interfieren como en agua de verdad. Los peces no están guionizados: cada uno decide a cada frame hacia dónde girar según orilla, vecinos, mano y comida.

## Cómo se implementa
**1. Heightfield en ping-pong.** Dos `WebGLRenderTarget` float (`FloatType` si existe `EXT_color_buffer_float`, si no `HalfFloatType`) de 512² a 1024². Canal R = altura, G = velocidad. Un pase de pantalla completa por paso:

```glsl
float avg = (L + R + D + U) * 0.25;           // vecinos
info.g += (avg - info.r) * 2.0;               // aceleración hacia el promedio
info.g *= uDamp;                              // 0.9955
info.r += info.g;  info.r *= 0.99965;
// gotas: cápsula de a a b, perfil de coseno
float d = length(pa - ba * t) / radius;
if (d < 1.) info.r += (0.5 + 0.5 * cos(3.14159265 * d)) * strength;
info.rg *= texture2D(uMask, vUv).r;           // máscara de orilla: la ola rebota, no sube al musgo
```

Se corre un paso por cada 1/60 s acumulado (máximo 3 por frame) y las gotas se encolan (máximo 16 por paso). Un segundo pase deriva `(h, dh/dx, dh/dz, laplaciano)` a una textura half-float: las normales del agua y el enfoque de las cáusticas salen de ahí.

**2. Dos pasadas: bajo el agua y la superficie.** Fondo y koi se dibujan primero a un render target (aquí en una escena privada con luz propia, `underScene`); el material del agua lo muestrea desplazando el UV con la normal de la onda (refracción) y mezcla el reflejo con fresnel. Cada material bajo el agua recibe por `onBeforeCompile` dos cosas: **absorción** (`exp(-uAbsorb * profundidad / cosθ)` más luz dispersa verde) y **cáusticas** (celdas de Voronoi animadas, deformadas por la pendiente de la onda). Lo que hay bajo el agua se ve más oscuro y verde cuanto más profundo.

**3. Reflejo.** El cielo (degradé cenit y horizonte) se refleja con una normal **exagerada** (`slope * 2.6`): en una foto, las ondas se leen por lo que reflejan, no por lo que refractan. El sol aporta un brillo puntual (`pow(dot(R, sun), 1800) * 120`).

**4. Koi.** El GLB se hornea (la transformación del nodo entra en los vértices) y se normaliza a largo 1 con la cabeza hacia +z. En el vertex shader:

```glsl
float s = clamp(0.5 - position.z, 0.0, 1.0);                       // 0 cabeza, 1 cola
transformed.x += uAmp * (0.12 + 0.88 * s * s) * sin(uPhase - s * 5.3) + uTurn * s * s * 0.22;
```

`uPhase` avanza con la velocidad (`0.45 + speed * 2.6` ciclos/s), `uAmp` crece con el esfuerzo, `uTurn` curva el cuerpo hacia donde gira. (El original extrae una columna vertebral por Dijkstra sobre la huella del modelo y encadena 24 segmentos; el módulo usa solo la senoidal.) Hace falta un `customDepthMaterial` con la misma deformación para que la sombra siga al pez.

**5. Dirección de cada pez.** Cada frame suma vectores deseados: errar (ruido suave en el giro), huir de la orilla (gradiente de la distancia al borde mirando adelante), separarse de vecinos, ir hacia la comida más cercana (con retraso proporcional a la distancia, porque las ondas tardan en llegar), y reaccionar a la mano (una mano lenta atrae, una rápida asusta). El giro tiene límite de velocidad angular.

**6. La mano.** Un rayo al plano `y = 0`; entre dos frames se inyecta una cápsula de gota entre las posiciones, con fuerza `-0.0048 * clamp(speed/1.4, 0.12, 1.3)`.

**Uso con el módulo `koi-pond`:**

```tsx
useEffect(() => {
  let off: Array<() => void> = []
  let dead = false
  ;(async () => {
    const E = await import('./dioramas-engine')
    const { createKoiPond } = await import('./koi-pond')
    if (dead || !canvasRef.current) return
    const engine = new E.Engine({ canvas: canvasRef.current, fov: 32, background: '#0c1a14', post: { bloom: { strength: 0.25, threshold: 0.9 }, vignette: 0.5 } })
    engine.scene.add(new E.THREE.HemisphereLight(0xffffff, 0x445544, 1.2))
    engine.camera.position.set(0, 7, 4.5); engine.camera.lookAt(0, 0, 0.3)
    const pond = await createKoiPond(
      { scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas: engine.canvas },
      { radius: 3.2, fishCount: 7, lotus: 3, lantern: true, interactionTarget: window }
    )
    if (dead) { pond.dispose(); engine.dispose(); return }
    engine.onTick((dt, t) => pond.update(dt, t))
    off = [E.smoothScroll((dt) => engine.frame(dt)), () => pond.dispose(), () => engine.dispose()]
  })()
  return () => { dead = true; off.forEach((f) => f()) }
}, [])
```

`state` da `{ ripples, fishCount, nearestFishToFood, foodPending, eaten, handSpeed }`; `ripples` es un proxy en CPU de la energía de las ondas (no se lee la GPU). `drop(x, z)` y `feed(x, z)` sirven para sembrar la escena al cargar o desde un botón. La cámara debe mirar el estanque desde arriba; la escena necesita luz para lotos y linterna. Las sombras de los koi se ven mejor con `renderer.shadowMap.enabled`.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/koi/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `kohaku.glb` | Koi blanco con manchas rojas | 2.8 MB |
| `showa.glb` | Koi negro con rojo y blanco | 3.1 MB |
| `lotus.glb` | Loto con hoja | 2.6 MB |
| `lantern.glb` | Linterna de piedra | 3.8 MB |

## Cuándo recomendarlo
- **Encaja:** hoteles, spas, restaurantes y marcas de calma o de naturaleza; cualquier página donde "tocar la superficie" comunica la marca. Funciona también como fondo vivo de una reserva.
- **No encaja:** marcas urgentes o muy densas en información (el agua compite con el texto), móviles de gama baja (dos pases de escena más la simulación), o cuando el contenido debe leerse sin distracción: baja la resolución de la simulación o congela el estanque con `prefers-reduced-motion`.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
