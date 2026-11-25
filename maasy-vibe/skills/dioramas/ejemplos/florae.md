# Florae: doscientos mil pétalos, un gesto
**Slug:** `florae` · **Interacción:** una escultura de partículas en GPU que se transforma de flor en flor con el scroll y se aparta del cursor como una brisa · **Estado en Believable:** módulo `particle-morph`

## Qué es
Florae es un archivo botánico y atelier que envía un espécimen extraordinario al mes. La página entera es un solo
objeto hecho de puntos: una rosa que, al hacer scroll, se deshace en un remolino de pétalos y se reordena como
protea, orquídea y mariposa morpho. No hay mallas a la vista: cada punto es una muestra de la superficie del GLB,
con el color de la textura donde cayó. El resultado es puntillista y luminoso, sobre papel crema, no neón.

## Brief original (resumen fiel)
- **Marca:** Florae, "a flower a month, from the edge of the map".
- **Escena:** ≥150k partículas (el original usa 448x448 = 200.704 en escritorio y 320x320 en móvil). Cada forma
  se muestrea con `sampleSurface()` para posiciones y color de textura.
- **Secciones:** nav · hero (la rosa) · 4 secciones de espécimen, cada una con una etiqueta (nombre latino, origen,
  temporada, notas) fija mientras termina el morph · "The archive" (los meses que vienen) · suscripción (48 EUR al
  mes, 3 planes) · footer.
- **Dirección de arte:** crema `#f4efe6`, carmesí `#d6456b`, tinta. Tipografía: Cormorant o EB Garamond en cursiva
  más Inter Tight. Plancha botánica editorial, mucho aire.
- **Must be true:** una rosa hecha de puntos brillantes que se lee claramente como rosa, con profundidad; un cuadro
  a mitad del morph es un remolino de pétalos.

## La interacción única
1. **Scroll = morph.** Rosa, protea, orquídea, morpho. La transición no es un lerp lineal: las partículas salen en
   olas (escalonadas por una semilla propia), suben a un remolino de tres brazos movido por viento curl y caen en
   la forma nueva. Ir y volver con el scroll nunca da saltos porque el remolino pesa por `sin(pi * q)`.
2. **El cursor es una brisa.** Las partículas cerca del rayo del puntero se empujan hacia afuera y vuelven con un
   resorte. Más velocidad del puntero, más empuje.
3. **Clic = ráfaga.** Una explosión radial desde el clic dispersa la flor, que luego florece de nuevo sola.
4. El original, además: la mariposa bate las alas (rotación por lado), puntos de bokeh con profundidad de campo,
   sombra suave sobre el papel y una forma final "archivo" (cabeza de girasol).

## Cómo se implementa
**Con el módulo (lo normal).** `particle-morph` va en `src/components/3d/particle-morph.ts` junto a
`dioramas-engine.ts`. No importa nada fuera de sí mismo. Es asíncrono porque descarga y muestrea los GLB (~15 MB
entre los cuatro, en paralelo).

```tsx
import { useEffect, useRef } from 'react'

export function FloraeHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    const cleanups: (() => void)[] = []

    void (async () => {
      const E = await import('./dioramas-engine')
      const { createParticleMorph } = await import('./particle-morph')
      if (disposed) return
      // Fondo claro: sin bloom y sin tone mapping, o el crema se ve gris.
      const engine = new E.Engine({ canvas, fov: 30, background: '#f4efe6', shadows: false, post: { bloom: false, vignette: 0.1, grain: 0.02 } })
      engine.renderer.toneMapping = E.THREE.NoToneMapping
      cleanups.push(() => engine.dispose())
      engine.camera.position.set(0, 2.54, 4.07) // ~4.8 de distancia, 32 grados de elevación
      engine.camera.lookAt(0, 0.45, 0)

      const morph = await createParticleMorph(
        { scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas },
        { count: matchMedia('(pointer: coarse)').matches ? 25000 : 60000 }
      )
      if (disposed) return morph.dispose()
      cleanups.push(() => morph.dispose())
      engine.onTick((dt, t) => morph.update(dt, t))
      cleanups.push(E.smoothScroll((dt) => engine.frame(dt)))

      // Cada sección de espécimen avanza el morph una forma.
      const st = E.ScrollTrigger.create({
        trigger: '#especimenes', start: 'top 80%', end: 'bottom 60%',
        onUpdate: (self) => morph.setProgress(self.progress * (morph.shapeCount - 1))
      })
      cleanups.push(() => st.kill())
    })()

    return () => { disposed = true; cleanups.reverse().forEach((f) => f()) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" />
}
```

**API del módulo.**
`createParticleMorph(ctx: DioramaCtx, opts?: ParticleMorphOptions): Promise<ParticleMorphHandle>`
- Opciones: `urls`, `sizes`, `axes` (una por forma), `count` (default 40000), `dotSize`, `stagger` (0.55),
  `stiffness` (50), `breezeRadius` (0.4), `breezeStrength` (1), `intro`, `introSeconds`, `gustOnClick`, `onProgress`.
- Handle: `group`, `state { shape, target, morph, scatter }`, `count`, `shapeCount`, `update(dt, t)`,
  `morphTo(i, seconds?)`, `setProgress(p)` (0 a shapeCount-1, para scroll), `gust(strength?)`, `dispose()`.
- `morphTo` sirve para botones o pestañas; `setProgress` para scroll. No los mezcles en el mismo gesto.
- Para tus propios modelos: `urls: [...]`, `sizes: [...]`, `axes: ['y' | 'max']`. Flores en tallo van con `'y'`
  (encaja por alto); mariposas y cosas anchas con `'max'`.
- Con `prefers-reduced-motion`, no montes el canvas: deja un póster con la rosa.

**Cómo funciona por dentro** (para ajustarlo sin romperlo):
1. *Muestreo.* `MeshSurfaceSampler` de three toma N puntos de la malla más grande del GLB, con posición, normal y
   UV. El color sale de leer la textura base en un canvas 2D (máximo 1024 px) en la UV de cada muestra. Se respeta
   `texture.flipY` (el camino ImageBitmap lo trae en `false`).
2. *Encaje y orden.* Los puntos se centran y se escalan midiendo los puntos mismos. Luego se **ordenan por altura**:
   el texel `j` queda a la misma altura relativa en todas las formas, así el tallo de la rosa viaja al tallo de la
   protea. Se empacan en tres `DataTexture` por forma: posición (float RGBA), color y normal (RGBA8).
3. *Simulación.* `GPUComputationRenderer` con dos variables, posición y velocidad. Cada partícula tiene un
   "hogar" `H = vortex(mix(A, B, e), w, semilla)` y un resorte hacia él. El escalonado es una línea:
   ```glsl
   float stageQ(float s){ return clamp((uF - s * uStagger) / (1.0 - uStagger), 0.0, 1.0); }
   float q = stageQ(s.x), e = q * q * (3.0 - 2.0 * q), w = sin(3.14159265 * q);
   ```
4. *Brisa.* Distancia de la partícula al rayo del puntero (en el espacio local del grupo) con caída gaussiana:
   ```glsl
   vec3 d = (P - uRayO) - uRayD * dot(P - uRayO, uRayD);
   float fall = exp(-dot(d, d) / (uBreezeR * uBreezeR));
   acc += (normalize(d) * 24.0 + uRayV * 13.0 + curl(P * 2.0, uTime) * 8.0) * fall * uBreeze;
   ```
5. *Ráfaga.* `scatter` salta a 1, baja la rigidez del resorte a casi cero (`1 - 0.92 * scatter`), empuja radial
   desde el clic y decae con `exp(-1.3 t)`: las partículas vuelan y vuelven solas.
6. *Dibujo.* Un solo `THREE.Points`; cada punto lee su posición de la textura de simulación por el atributo
   `ref`. Tamaño por profundidad, color con luz envolvente simple (ambiente + luz clave + transmisión) en el shader.
7. *Costo.* El tamaño de punto escala con `1 / lado` para mantener la cobertura: menos partículas, puntos más
   grandes. 40k partículas con puntos de ~5 px se parece al original (200k con ~2.4 px) y corre en una laptop sin
   GPU dedicada.

**Lo que el módulo NO trae** (el original sí): pasada de brillo y bokeh por profundidad de campo, sombra del
espécimen sobre el papel, polen flotante, oclusión ambiental por densidad de puntos, aleteo de la morpho y la
forma "archivo". Si el cliente los pide, se construyen aparte sobre el handle (`handle.group` es un `THREE.Group`).

## Modelos
Base: `https://files.believe-global.com/believable/dioramas/v1/florae/`

| Archivo | URL | Qué es | Tamaño |
|---|---|---|---|
| `rose.glb` | `.../florae/rose.glb` | Rosa abierta, forma de partida | 3,05 MB |
| `protea.glb` | `.../florae/protea.glb` | Protea rey | 5,09 MB |
| `orchid.glb` | `.../florae/orchid.glb` | Orquídea phalaenopsis | 3,27 MB |
| `morpho.glb` | `.../florae/morpho.glb` | Mariposa morpho azul | 3,61 MB |

Meshopt + WebP. El módulo ya los usa por defecto (`PARTICLE_MORPH_MODELS`).

## Cuándo recomendarlo
- **Encaja:** botánica, perfumería, joyería, cosmética, floristería, suscripciones de producto natural, arte,
  cualquier marca cuyo mensaje sea transformación o catálogo de piezas únicas. Funciona con 2 a 6 formas.
- **No encaja:** marcas que necesitan ver el producto nítido y exacto (electrónica, ropa, alimentos con etiqueta):
  las partículas sugieren, no muestran. Tampoco en páginas con muchísimo texto sobre el canvas: la escultura pide
  aire. Evita fondos oscuros con este módulo tal cual, está afinado para papel claro.
- Móvil: baja `count` a 20-25k y deja la brisa (el toque la activa al arrastrar).

## Créditos
Código de interacción adaptado de Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi.
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Muestra el crédito de forma visible en la página.
