# Bell & Moss: limpia el vidrio y conoce el mundo de adentro
**Slug:** `terrarium` · **Interacción:** una campana de vidrio empañada que el cursor limpia, y el vaho vuelve solo en unos 8 segundos · **Estado en Believable:** módulo `glass-wipe`

## Qué es
Bell & Moss es un estudio londinense que construye terrarios sellados bajo campana de vidrio soplado, que viven
décadas sin riego. La página es lo opuesto a las oscuras: lino cálido, verdes salvia y musgo, nogal. Una campana
cubre un clima en miniatura y el visitante lo descubre pasando el cursor por el vidrio empañado.

## Brief original (resumen fiel)
- **Campana:** `LatheGeometry` con perilla; `MeshPhysicalMaterial` con transmisión, grosor, ior 1.5 y algo de
  dispersión.
- **Vaho:** el interior del vidrio está empañado y el cursor lo limpia. Raycast a la campana, pintar las UV del golpe
  en una máscara; la máscara controla la rugosidad del vidrio y un velo lechoso (empañado = escarchado, limpio =
  cristal) más un normal de gotas. Vuelve a formarse en ~8 s; las gotas se acumulan en los bordes limpios y corren.
  Debe ser obvio y satisfactorio.
- **Tres climas:** bosque de musgo (`moss.glb`), desierto (`desert.glb`), trópico (`tropic.glb`). Al cambiar, la
  campana sube (animada), la base de nogal gira, el mundo se intercambia, la campana baja y se vuelve a empañar.
- Esporas o luciérnagas flotando adentro, luz de ventana desde la izquierda con sombra real y oclusión suave.
- **Secciones:** nav · hero ("A whole climate under glass. Water it once, in 2031.") · Climas (3 pestañas que
  mueven el 3D) · "Inside the glass" (diagrama explotado: al hacer scroll el mundo sube y se separan capas
  procedurales: piedras de drenaje, carbón, malla, tierra, musgo, con etiquetas) · Cuidado ("Light: bright, indirect.
  Water: never.") · Tienda (3 terrarios, 240 a 680 GBP) · footer.
- **Arte:** lino `#efe9dd`, salvia y musgo, nogal. Fraunces + Manrope. Suave, calmado, táctil.
- **Must be true:** una campana empañada con una franja limpia que revela el mundo de musgo es el cuadro héroe.

## La interacción única
Limpiar el vidrio es el gancho: el visitante entiende la página con la mano. El original además dibuja un "dedo
fantasma" que hace una franja sola si nadie ha limpiado en un rato (así el primer cuadro siempre muestra el mundo a
través de una ventana limpia), pinta un cursor de pincel del tamaño real de la huella y, en táctil, limpia al arrastrar.

## Cómo se implementa
**Con el módulo.** `glass-wipe` va en `src/components/3d/glass-wipe.ts`. Trae la campana (borde, cristal, perilla),
la máscara de vaho y el pincel. El mundo de adentro lo pones tú, con su base en y = 0.

```tsx
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  let disposed = false
  const cleanups: (() => void)[] = []
  void (async () => {
    const E = await import('./dioramas-engine')
    const { createGlassWipe } = await import('./glass-wipe')
    if (disposed) return
    const engine = new E.Engine({ canvas, fov: 28, near: 0.05, far: 60, background: '#e7dfd0', post: { bloom: false, vignette: 0.3 } })
    engine.renderer.toneMapping = E.THREE.NeutralToneMapping // fondo claro: nada de AgX
    cleanups.push(() => engine.dispose())
    engine.scene.environment = E.studioEnvironment(engine.renderer, { top: 0xf6efe2, bottom: 0xd9cdb8,
      panels: [{ pos: [-9, 3.3, 1.4], size: [1.3, 3.2], intensity: 11, color: 0xfff2de }] }) // la ventana a la izquierda
    engine.camera.position.set(0.4, 1.3, 5.2)
    engine.camera.lookAt(0, 0.75, 0)

    const wipe = createGlassWipe({ scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas }, { brush: 0.1, refogSeconds: 8 })
    cleanups.push(() => wipe.dispose())
    const world = (await E.loadGltf(MOSS_URL)).scene // altura < ~1.3, base en y = 0
    E.normalize(world, 1.1, { ground: true, axis: 'max' })
    wipe.group.add(world) // gira y sube con la campana
    engine.onTick((dt, t) => wipe.update(dt, t))
    cleanups.push(E.smoothScroll((dt) => engine.frame(dt)))
  })()
  return () => { disposed = true; cleanups.reverse().forEach((f) => f()) }
}, [])
```
Para el cambio de clima, anima `wipe.group.position.y` con GSAP (sube, cambia el hijo, baja) y llama `wipe.fogAll()`
al bajar. Para el diagrama explotado, mueve el mundo hacia arriba dentro del grupo con ScrollTrigger y deja las capas
como mallas aparte.

**API.** `createGlassWipe(ctx: DioramaCtx, opts?: GlassWipeOptions): GlassWipeHandle` (síncrona).
- Opciones: `brush` (0.1, unidades de escena), `refogSeconds` (8), `hover` (true: limpia con solo pasar; false: exige
  presionar), `startClear`, `fogRoughness` (0.46), `milk` (0.5), `resolution` ([320, 160]).
- Handle: `group`, `glass`, `state { cleared, wiping }`, `update(dt, t)`, `wipeAt(clientX, clientY)`, `clearAll()`,
  `fogAll()`, `dispose()`. `cleared` es la fracción de superficie limpia 0..1, ponderada por área real del vidrio:
  sirve para ocultar una pista ("limpia el vidrio") cuando pasa de 0.15, o para un dedo fantasma si lleva 0 un rato.
- La campana mide 0.666 de radio y 1.4 de alto (1.62 con la perilla). Escala `group` de forma uniforme si hace falta.

**Cómo funciona por dentro:**
1. *UV con significado.* El perfil se muestrea por longitud de arco (`SplineCurve.getSpacedPoints`) y se tornea con
   `LatheGeometry`; así `u` es el ángulo y `v` la distancia sobre el vidrio, y un pincel circular en el mundo es una
   elipse en UV (`du = r / (2 pi radio)`, `dv = r / largoDeArco`).
2. *Máscara.* Un `Uint8Array` de 320 x 160 en CPU (`1` = limpio) que se sube cada cuadro a una `DataTexture` `RedFormat`
   con `RepeatWrapping` en `u`. El rayo golpea un proxy de baja resolución con las mismas UV y se pinta **en la cara
   cercana y en la lejana**: así la franja se ve limpia de lado a lado y no queda vaho en la pared de atrás.
   Entre dos cuadros se interpola el trazo para que un movimiento rápido no deje puntos sueltos.
3. *Vaho que vuelve.* Cada celda recupera vaho a `(0.15 + 2.2 * (1 - limpio)) / refogSeconds` por segundo: lento
   al principio y acelerando, como la condensación real.
4. *Material.* `MeshPhysicalMaterial` con transmisión y dos parches vía `onBeforeCompile`: en `roughnessmap_fragment`
   se calcula `vaho = smoothstep(umbral - 0.1, umbral + 0.1, 1 - mascara)` contra un umbral moteado (dos octavas de
   ruido periódico), así el vaho reaparece como **puntitos que nuclean**, no como un fundido plano, y sube la
   rugosidad; antes de `opaque_fragment` mezcla `outgoingLight` hacia un velo lechoso desaturado.

**Simplificado respecto al original:** la máscara del original es un render target `HalfFloat` de 2048 x 1024 con
ping-pong en GPU, y guarda además una banda húmeda, rastros y la altura de gotas que ruedan (hasta 72 gotas con su
propio pase instanciado), con normales de lente de gota, brillos en el agua y borde oscuro del menisco. El módulo
solo trae vaho, limpieza y nucleación. Si el cliente pide gotas corriendo, hay que portarlas del original
(`examples/terrarium/glass.js`, clase `FogGlass`).

## Modelos
Base: `https://files.believe-global.com/believable/dioramas/v1/terrarium/`

| Archivo | Qué es | Tamaño |
|---|---|---|
| `moss.glb` | Bosque de musgo | 8,39 MB |
| `desert.glb` | Desierto alto | 6,97 MB |
| `tropic.glb` | Trópico de nubes | 7,31 MB |

Cargarlos todos de golpe son ~22 MB: carga el primero y trae los otros dos cuando el usuario toque su pestaña.

## Cuándo recomendarlo
- **Encaja:** plantas, terrarios, cristalería, perfumes y velas en campana, hoteles y spas, ciencia o naturaleza
  "bajo vidrio", cualquier cosa que esté detrás de una ventana empañada: ventanas de autos, espejos de baño.
  Marcas calmadas, claras y táctiles.
- **No encaja:** marcas agresivas, nocturnas o de alta velocidad. En móvil, el hover no existe: pon `hover: false`
  y deja limpiar al arrastrar (y una pista visible).

## Créditos
Código adaptado de Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi.
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Muestra el crédito de forma visible.
