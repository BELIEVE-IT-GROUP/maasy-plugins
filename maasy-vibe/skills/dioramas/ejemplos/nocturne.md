# Nocturne: un perfume que se puede verter
**Slug:** `nocturne` · **Interacción:** arrastras un frasco de vidrio y el líquido ámbar se mantiene nivelado y chapotea con un resorte amortiguado · **Estado en Believable:** módulo `liquid-slosh`

## Qué es
Nocturne es un extrait de parfum ("No. 9, Iris & Oud") de una casa pequeña de Grasse. La página es un pesado frasco de
vidrio sobre mármol negro, lleno de líquido ámbar que se comporta como líquido. Al hacer scroll llegan las notas
(iris, bergamota, vainilla, oud), cada una se disuelve en partículas doradas que fluyen al frasco y suben el nivel.

## Brief original (resumen fiel)
- **Frasco:** facetado y procedural (caja biselada o torno facetado), `MeshPhysicalMaterial` con transmisión,
  grosor, ior 1.5, dispersión y color de atenuación; el tapón es `cap.glb`.
- **Líquido:** arrastras para inclinar y girar; la superficie se queda nivelada en el mundo y chapotea con un resorte
  amortiguado impulsado por la velocidad angular. Shader clásico: descarta lo que queda sobre un plano del mundo con
  ondita, las caras traseras se pintan como la superficie, borde de menisco con fresnel. Cáusticas sobre el mármol.
- **Scroll:** las notas flotan junto al frasco en su propia sección y se disuelven en partículas doradas
  (`sampleSurface`) que entran al frasco y suben el nivel.
- **Secciones:** nav · hero ("Nocturne No. 9, iris, bergamot, vanilla, oud.") · notas de salida, corazón y fondo ·
  la casa (Grasse, 1911) · set de descubrimiento y 50 ml (290 EUR) · footer.
- **Arte:** negro, dorado champán `#d8b56a`, ámbar profundo. Bodoni Moda o Italiana + Hanken Grotesk. Luz de estudio
  con softboxes alargadas que dan reflejos verticales largos en el vidrio.
- **Must be true:** el frasco con refracción creíble, reflejos dorados y líquido; un cuadro con partículas doradas
  entrando.

## La interacción única
Un líquido que conserva su volumen a cualquier ángulo (incluso boca abajo) y se mueve con inercia. En el original el
frasco se agarra con el puntero, se levanta un poco al inclinarlo, y suelta con resortes suaves.

## Cómo se implementa
**Con el módulo.** `liquid-slosh` va en `src/components/3d/liquid-slosh.ts`. Crea el frasco (caja redondeada y
cuello de vidrio transmisivo), el líquido, el arrastre y la física. El tapón y el piso los pones tú.

```tsx
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  let disposed = false
  const cleanups: (() => void)[] = []
  void (async () => {
    const E = await import('./dioramas-engine')
    const { createLiquidSlosh } = await import('./liquid-slosh')
    if (disposed) return
    const engine = new E.Engine({ canvas, fov: 26, background: '#040303', post: { bloom: { strength: 0.5, threshold: 0.8 }, vignette: 0.7 } })
    cleanups.push(() => engine.dispose())
    const { THREE } = E
    engine.scene.environment = E.studioEnvironment(engine.renderer, {
      top: 0x0a0907, bottom: 0x040303,
      panels: [ // softboxes altos y delgados: dan los reflejos verticales largos
        { pos: [-4, 3, 5], size: [1, 6], intensity: 6, color: 0xfff0d8 },
        { pos: [4, 3, 3], size: [1, 6], intensity: 4, color: 0xffe2b8 }
      ]
    })
    engine.camera.position.set(0, 1.0, 5.2)
    engine.camera.lookAt(0, 0.6, 0)

    const liquid = createLiquidSlosh({ scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas }, { level: 0.42 })
    cleanups.push(() => liquid.dispose())
    // Tapón: cualquier objeto hijo de `body` gira con el frasco.
    const cap = (await loadGltf(CAP_URL)).scene
    cap.position.y = liquid.neckTop
    liquid.body.add(cap)

    engine.onTick((dt, t) => liquid.update(dt, t))
    cleanups.push(E.smoothScroll((dt) => engine.frame(dt)))
    // Cada nota que "llega" sube el nivel: el módulo suaviza el cambio.
    const st = E.ScrollTrigger.create({ trigger: '#notas', start: 'top 70%', end: 'bottom 30%',
      onUpdate: (s) => liquid.setLevel(0.42 + 0.12 * Math.floor(s.progress * 4)) })
    cleanups.push(() => st.kill())
  })()
  return () => { disposed = true; cleanups.reverse().forEach((f) => f()) }
}, [])
```
(`studioEnvironment` y `loadGltf` salen del motor; `studioEnvironment` acepta `panels` con `pos`, `size`, `intensity`,
`color`. `CAP_URL` está en la tabla de modelos.)

**API.** `createLiquidSlosh(ctx: DioramaCtx, opts?: LiquidSloshOptions): LiquidSloshHandle` (síncrona).
- Opciones: `level` (0.6), `deep` y `glow` (colores del líquido), `brightness` (1.35), `interactive` (true),
  `maxRoll` (2.05 rad).
- Handle: `group` (apoya en y = 0, muévelo o escálalo uniforme), `pivot`, `body`, `neckTop`, `glass`,
  `state { tilt, level, wobble, dragging }`, `update(dt, t)`, `setLevel(l)`, `tiltTo(roll, pitch?)`, `dispose()`.
- `state.tilt` es el ángulo del eje del frasco con la vertical (0 parado, PI boca abajo); `wobble` es la energía del
  chapoteo 0..1. `tiltTo(1, 0)` inclina por código, útil para un "demo" al cargar o atar el ángulo al scroll.
- El arrastre solo empieza si el rayo del puntero toca el vidrio (no atrapa clics del resto de la página), ignora
  enlaces y botones, y en pantallas táctiles solo inclina de lado (el eje vertical estorba al scroll).

**Cómo funciona por dentro:**
1. *Nivel que conserva volumen.* Se siembran 1.800 puntos dentro de la cavidad (SDF de caja redondeada). Cada
   cuadro se llevan a coordenadas del mundo y se proyectan sobre la normal de la superficie; el plano queda en el
   **cuantil** `level` de esas proyecciones. Funciona boca abajo y a cualquier ángulo, sin geometría de líquido.
   ```ts
   vals[i] = n.x * wx + n.y * wy + n.z * wz   // proyección del punto i sobre la normal
   vals.sort(); d = vals[Math.floor(level * (N - 1))]; plane.set(n.x, n.y, n.z, d)
   ```
2. *Chapoteo.* Un resorte 2D amortiguado (K = 92, C = 2.3) sobre la inclinación de la superficie, empujado por la
   aceleración lineal del centro del líquido y por la velocidad angular del frasco.
3. *Shader.* Un `MeshPhysicalMaterial` negro con `onBeforeCompile`: `if (dot(plane.xyz, vWPos) - plane.w - ripple > 0.) discard;`
   en `clipping_planes_fragment`; si `!gl_FrontFacing`, la normal pasa a ser la del plano (la cara trasera que
   sobrevive es la superficie libre, un espejo); el color de volumen entra como radiancia emisiva (bordes más
   encendidos, banda brillante bajo el menisco, base que enfoca la luz).
4. *Resortes de inclinación.* Roll y pitch con K = 70 y C = 13 mientras sostienes, K = 34 y C = 5.2 al soltar.
   Los ejes siguen a la cámara: arrastre horizontal = inclinar a los lados de la pantalla.

**Simplificado respecto al original:** el líquido original además refracta una captura a media resolución del
escenario (con absorción Beer-Lambert) para que se lean las letras a través del perfume; aquí el vidrio transmisivo
de three refracta al líquido y listo. Tampoco hay rayos bajo la superficie, caja tallada con chaflanes, tapón ni
levantamiento al inclinar, ni piso con cáusticas ni reflejo plano.

**Las partículas que entran al frasco (no portado).** Cada nota se muestrea con `sampleSurface(mesh, 15000)`; un solo
`THREE.Points` por nota calcula todo en el vertex shader desde un único uniforme de progreso `uP` (se puede
reproducir hacia adelante y atrás con el scroll). Cada punto tiene una "clave de quemado" (70 % por posición a lo
largo de un eje, 30 % ruido) que decide cuándo se despega; viaja por una curva Bézier cúbica desde su sitio en la nota,
rodea el frasco y cae a la superficie del líquido, con un giro en la segunda mitad y color que pasa del de la
textura al dorado.

## Modelos
Base: `https://files.believe-global.com/believable/dioramas/v1/nocturne/`

| Archivo | Qué es | Tamaño |
|---|---|---|
| `cap.glb` | Tapón dorado | 2,72 MB |
| `iris.glb` | Iris (nota de corazón) | 4,29 MB |
| `bergamot.glb` | Bergamota (salida) | 2,84 MB |
| `vanilla.glb` | Vainilla (fondo) | 4,14 MB |
| `oud.glb` | Oud (fondo) | 4,70 MB |

## Cuándo recomendarlo
- **Encaja:** perfumería, licores, aceites, cosmética, cualquier producto en frasco transparente donde el contenido
  sea el atractivo. Sobre fondo oscuro con luz de estudio.
- **No encaja:** productos opacos, o marcas luminosas y juguetonas. El vidrio transmisivo es caro: en móvil de gama
  baja usa `dpr` 1 y evita el bloom.

## Créditos
Código adaptado de Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi.
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Muestra el crédito de forma visible.
