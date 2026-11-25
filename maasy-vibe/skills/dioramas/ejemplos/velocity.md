# Velocity Lab: mira a través del tenis
**Slug:** `velocity` · **Interacción:** una lente circular sigue el cursor y muestra el modelo en rayos X, térmico o CAD; por fuera queda la foto de producto · **Estado en Believable:** módulo `xray-lens`

## Qué es
Página de lanzamiento del VX-1 Carbon, un tenis de competencia con placa de carbono (marca ficticia). Es una lupa de laboratorio sobre un producto: la lente revela lo que la foto no puede mostrar (placa, espuma, presión de pisada).

## Brief original (resumen fiel)
- **Marca:** Velocity Lab. Titular: "VX-1 Carbon. 186 grams of unfair advantage."
- **Interacción:** una lente circular sigue el cursor. Fuera, el tenis (`white.glb`) es una toma de producto premium; dentro, se renderiza en un modo alterno. El original renderiza la escena dos veces en render targets y compone con una máscara circular con borde refractivo (distorsión leve, franja cromática, anillo brillante fino).
- **Modos** (clic o teclas 1 a 3, etiqueta sobre la lente): X-RAY (casco translúcido con fresnel, placa de carbono como lámina curva brillante, celdas de espuma como retícula de ruido), THERMAL (paleta de mapa de calor desde un campo de presión en la suela) y CAD (aristas limpias y medidas).
- **Scroll:** rota y reubica el tenis por callouts técnicos (líneas guía desde puntos 3D hasta etiquetas). Cambio de colorway blanco a negro (`black.glb`) con disolución por ruido y borde caliente.
- **Secciones:** Nav, Hero, Exploración con lente, Tech (Placa, Espuma, Upper, cada una con movimiento de cámara y datos: stack 38 mm, drop 8 mm, 186 g), Colorways, cuenta regresiva del drop con CTA, Footer.
- **Arte:** blanco clínico de laboratorio `#f2f3f5`, grafito, acentos volt/naranja, cuadrícula precisa, marcas de medición, textos mono. Tipografías Archivo (expandida) y JetBrains Mono. Piso de estudio con reflejo suave.
- **Debe cumplirse:** el hero muestra la lente a mitad del tenis revelando la placa brillante dentro de una toma de producto.

## La interacción única
La lente es un objeto físico: se estira y aplasta según su velocidad (squash and stretch líquido), el borde de vidrio dobla la imagen de afuera, proyecta una sombra suave sobre la página y mantener presionado la amplía (zoom 2,7 en el original). El cambio de modo hace un barrido radial con un filo de color. Todo suma a la sensación de instrumento óptico real.

## Cómo se implementa
En Believable está el módulo `xray-lens` (`packs/believe-dioramas/blocks/xray-lens/xray-lens.ts`). Es una versión simplificada pero con la misma idea de fondo: **re-renderizar el modelo con otros materiales en un render target y mostrarlo solo dentro de un círculo**.

1. **Render alterno.** Cada cuadro, si la lente está abierta, el módulo cambia el material de los meshes del `target` por el del modo activo, oculta lo demás (piso, sprites, etc.), pone `scene.background` del modo, apaga niebla y sombras, y renderiza a un `WebGLRenderTarget` cuadrado que solo cubre la lente. Para eso usa `camera.setViewOffset(W, H, cx - R, cy - R, 2R, 2R)`: la cámara dibuja únicamente la ventana de la lente a la resolución del target, así no se paga la pantalla entera. Después restaura todo.
2. **Composición.** Un triángulo a pantalla completa (espacio de recorte, `renderOrder` altísimo, sin `depthTest`) muestrea el target dentro del círculo y dibuja desde el mismo shader el anillo, el bisel oscuro, el brillo de vidrio y una franja cromática leve. Al estar dentro de la escena, pasa por el postproceso del Engine (bloom, tono) como cualquier otro objeto.
3. **Modos, todos procedurales en el espacio local del modelo** (el campo gira con el modelo): `xray` usa fresnel, celdas de Voronoi 3D y una banda de escaneo con mezcla aditiva sobre caras frontales y traseras; `thermal` pinta un campo de presión (concentrado abajo, con un pulso que recorre el eje largo) con la paleta ironbow; `cad` dibuja contornos por derivadas de normales y profundidad más una cuadrícula, o malla real con `wireframe: true`.
4. **Estado:** `state` es `{ mode, radius, x, y }` (x e y en NDC, radius en px CSS).

```tsx
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  let disposed = false
  const cleanups: (() => void)[] = []
  void (async () => {
    const E = await import('./dioramas-engine')
    const { createXrayLens, XRAY_LENS_MODELS } = await import('./xray-lens')
    if (disposed) return
    const engine = new E.Engine({ canvas, background: '#eceef0', post: { bloom: { strength: 0.25, threshold: 0.9 }, vignette: 0.3, grain: 0.03 } })
    cleanups.push(() => engine.dispose())
    const { scene, camera, renderer } = engine
    scene.environment = E.studioEnvironment(renderer, { top: new E.THREE.Color('#ffffff'), bottom: new E.THREE.Color('#c9ccd1') })
    const gltf = await E.loadGltf(XRAY_LENS_MODELS.white)
    if (disposed) return
    const shoe = gltf.scene
    E.normalize(shoe, 3)                 // lado mayor 3 unidades, apoyado en y = 0
    E.prepModel(shoe, renderer)
    scene.add(shoe)
    camera.position.set(0.5, 1.4, 4.5)
    camera.lookAt(0, 0.6, 0)
    const lens = createXrayLens({ scene, camera, renderer, canvas }, { target: shoe, radius: 150, coreY: 0.3 })
    cleanups.push(() => lens.dispose())
    engine.onTick((dt, t) => {
      lens.update(dt, t)
      labelRef.current?.style.setProperty('transform', `translate3d(${(lens.state.x * 0.5 + 0.5) * innerWidth}px, ${(0.5 - lens.state.y * 0.5) * innerHeight}px, 0)`)
    })
    cleanups.push(E.smoothScroll((dt) => engine.frame(dt)))
  })()
  return () => { disposed = true; for (const c of cleanups.reverse()) c() }
}, [])
```

- **API:** `lens.setMode('xray' | 'thermal' | 'cad')`, `lens.setLens(x, y, snap?)` en NDC para manejarla por código (útil para el autoplay del hero), `lens.setRadius(px)` (0 la cierra) y `lens.state`. Con `followPointer: true` (default) sigue el puntero de la ventana y se cierra al salir; con `false` la manejas tú. Las teclas 1 a 3 cambian de modo (`keys: false` las apaga).
- **Etiqueta del modo y reglas de medición** son HTML: posiciónalas desde `lens.state` con un `transform`, como arriba. El módulo no dibuja texto.
- **Qué espera la escena:** fondo claro (el modo `xray` mezcla en aditivo sobre un fondo casi negro dentro de la lente, por eso se nota); luces de estudio normales para la parte de afuera; un `target` con los meshes del modelo. Sin `target` re-renderiza toda la escena. `coreY` (0 a 1, altura normalizada) pone el brillo interno en las xray; para un modelo que no sea calzado, apágalo con `coreY: null` o muévelo.
- **Costo:** un render extra del modelo por cuadro, solo del tamaño de la lente. `maxRadius` (260 por defecto) fija el tamaño del target; en móvil conviene `radius: 110` y `maxRadius: 160`.
- **Verificado en headless con `white.glb`:** los tres modos compilan sin errores, se ve el casco azul con celdas y el núcleo cálido en `xray`, el degradado ironbow en `thermal` y los contornos con cuadrícula en `cad`; al cerrar el radio a 0 el triángulo se oculta y `dispose()` deja la escena sin el objeto.
- **Lo que no trae** (del original): transición de barrido entre modos, zoom de lupa, perfil real de la suela, callouts con líneas guía y el disolver de colorway. Para el disolver, la receta es un parche de material con un campo de ruido en espacio local: `float dF = disField(vSP) - uDis;` y `if (dF < 0.0) discard;` en el blanco, el signo contrario en el negro, y emisión naranja a blanco donde `abs(dF)` es pequeño (`dEdge`). Anima `uDis` de -0,25 a 1,2.

## Modelos
| Archivo | URL R2 | Qué es | Tamaño aprox. |
|---|---|---|---|
| `white.glb` | `https://files.believe-global.com/believable/dioramas/v1/velocity/white.glb` | Tenis de carrera, colorway blanco. Un mesh, un material | 4,1 MB |
| `black.glb` | `https://files.believe-global.com/believable/dioramas/v1/velocity/black.glb` | El mismo tenis, colorway negro | 4,1 MB |

El original escala a 2 unidades de largo (285 mm reales, 142,5 mm por unidad) para que la cuadrícula del piso sea métrica.

## Cuándo recomendarlo
- **Sí:** productos con anatomía interna que vale la pena enseñar (calzado, audífonos, relojes, electrónica, herramientas, juguetes con mecanismo), marcas técnicas o de rendimiento, páginas de lanzamiento con "tecnología".
- **No:** productos planos o sin interior que mostrar (ropa lisa, papelería), marcas cálidas y artesanales, y sitios táctiles donde no hay cursor: ahí maneja la lente con `setLens` y un recorrido automático, o con el dedo mediante `pointerdown`/`pointermove` (el módulo ya los escucha).
- No uses el modo térmico para afirmar datos reales de presión: es ilustrativo.

## Créditos
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. El módulo `xray-lens` es un port simplificado de `examples/velocity` (MIT, Copyright (c) 2026 Blendi).
