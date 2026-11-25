# Artemis: camina por la Luna con el scroll

**Slug:** `artemis` · **Interacción:** un astronauta con rig camina atado al scroll (avanza, retrocede, trota si scrolleas fuerte) y deja huellas · **Estado en Believable:** módulo `rigged-walker`

## Qué es
Una landing de turismo lunar. El scroll no desplaza la página: lleva a un astronauta por el regolito. Cuando scrolleas despacio camina, cuando scrolleas rápido pasa a un trote de baja gravedad con vuelo, cuando paras se queda quieto, y si subes camina hacia atrás. Cada bota deja una huella en el suelo. El truco que lo hace creíble: el ciclo de caminar avanza por **distancia recorrida**, no por tiempo, así que los pies nunca patinan.

## Brief original (resumen fiel)
- **Marca:** Artemis, turismo lunar: siete días en un puesto avanzado del polo sur.
- **Interacción:** scroll para caminar. El astronauta sale riggeado de Meshy; el ciclo se ata a la velocidad de scroll (en el original se desacopla del tiempo y se ata a la distancia). Avanza con un rebote de baja gravedad. Las **huellas** se estampan donde cae cada pie. El polvo sube en arcos balísticos lentos (1/6 g, sin arrastre ni nubes). Un solo sol duro, cielo negro con la Tierra sobre el horizonte, sombras larguísimas, apenas luz de "tierra-luz" de relleno. Terreno: plano grande desplazado con cráteres y rocas instanciadas. El módulo de aterrizaje (`lander.glb`) aparece como destino.
- **Secciones:** Nav · Hero ("One small step, repeated 40,000 times.") · La caminata (scroll largo y fijo) · El puesto · Los siete días (itinerario) · Entrenamiento y chequeo médico · Precio ("$4.2M, all-inclusive") · Footer.
- **Arte:** gris estricto, negro puro, blanco y un solo acento: naranja de traje. "Space Grotesk" + "Barlow Condensed" en lecturas de misión. Archivo de la NASA con aire de Apple.
- **Debe ser verdad:** un cuadro del astronauta a media zancada, huellas detrás, sombra larga y la Tierra en el cielo negro.

## La interacción única
Tres ideas que juntas dan el efecto, todas en `rigged-walker`:

1. **Objetivo y seguimiento.** El scroll fija una distancia objetivo `d = progreso * largo`. El personaje la persigue con una velocidad amortiguada: `v = damp(v, clamp(gap * 2.1, -vmax, vmax), 3.2, dt)`, con tope `vmax = 2.5 + max(0, |gap| - 5) * 1.4`. Si lo dejas atrás por mucho, corre para alcanzarlo.
2. **Fase por distancia.** `phase += ds / stride`, donde `stride` (cuánto avanza el cuerpo en un ciclo) se mide del propio clip: se muestrea 96 veces y se promedia la velocidad del pie cuando está apoyado. Con `ds` negativo el ciclo corre al revés y el personaje retrocede sin patinar.
3. **Mezcla caminar, trote y reposo.** Entre 1.6 y 2.8 unidades/s se mezcla de `walk` a `run` (con su propio desfase de contacto) y el clip de trote aporta un "vuelo" que levanta el cuerpo. En reposo el original sintetiza una pose de pie con respiración; el módulo simplifica: congela el clip `walk` en la fase de pies juntos.

Las **huellas** nacen de detectar el contacto: cuando el tobillo baja bajo un umbral sobre el suelo se estampa un plano con la suela, orientado al rumbo del pie. En el original son decals que reusan el shader del regolito (mismo albedo, normales y sombras); aquí son un `InstancedMesh` con una textura canvas de suela (antepié, talón, tacos en V) y `alphaMap`.

## Cómo se implementa
```tsx
import { useEffect, useRef } from 'react'

export function MoonWalk() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let off: Array<() => void> = []
    let dead = false
    ;(async () => {
      const E = await import('./dioramas-engine')
      const { createRiggedWalker } = await import('./rigged-walker')
      if (dead || !canvasRef.current) return
      const canvas = canvasRef.current
      const engine = new E.Engine({ canvas, background: '#000000', exposure: 1.1, post: { bloom: { strength: 0.15, threshold: 0.95 }, vignette: 0.5, grain: 0.05 } })
      const { scene, camera, renderer } = engine
      const sun = new E.THREE.DirectionalLight('#ffffff', 5)
      sun.position.set(-6, 3, -4)          // sol bajo y duro, sombras largas
      sun.castShadow = true
      sun.shadow.camera.left = sun.shadow.camera.bottom = -8
      sun.shadow.camera.right = sun.shadow.camera.top = 8
      scene.add(sun, new E.THREE.AmbientLight('#9fb4ff', 0.12))   // tierra-luz tenue
      const ground = new E.THREE.Mesh(new E.THREE.PlaneGeometry(200, 200), new E.THREE.MeshStandardMaterial({ color: '#8d8d8d', roughness: 1 }))
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)
      const walker = await createRiggedWalker({ scene, camera, renderer, canvas }, { length: 40, height: 1.8, footprints: { color: '#1a1a1a', opacity: 0.6 } })
      if (dead) return walker.dispose()
      engine.onTick((dt, t) => {
        const r = sectionRef.current!.getBoundingClientRect()
        walker.setProgress(Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))))
        walker.update(dt, t)
        const p = walker.root.position
        camera.position.lerp(new E.THREE.Vector3(p.x + 1, 1.4, p.z + 4.5), 0.06)   // cámara lateral que lo acompaña
        camera.lookAt(p.x + 1.5, 1, p.z)
      })
      off = [E.smoothScroll((dt) => engine.frame(dt)), () => walker.dispose(), () => engine.dispose()]
    })()
    return () => { dead = true; off.forEach((f) => f()) }
  }, [])
  return (
    <section ref={sectionRef} style={{ height: '600vh' }}>
      <canvas ref={canvasRef} style={{ position: 'sticky', top: 0, width: '100%', height: '100vh', display: 'block' }} />
    </section>
  )
}
```

Opciones del módulo que importan: `path` (una `THREE.Curve` para que el recorrido sea curvo en vez de una recta sobre +X), `heightAt(x, z)` (si el suelo no es plano; el personaje y las huellas se pegan a esa altura), `onStep` (callback por pisada, para soltar polvo con tu propio sistema de partículas), `maxSpeed`, y `source` (URL o un GLTF ya cargado con `loadGltf` del motor, para tener barra de progreso).

Estado para verificar por código: `walker.state` es `{ progress, distance, length, speed, clip, phase, steps, direction }`. Tras `setProgress(0.3)` y unos segundos de `update`, `distance` debe acercarse a `0.3 * length`, `clip` pasar por `run` o `walk` y volver a `idle`, y `steps` crecer. Con `setProgress(0.1)` después, `speed` es negativa y `direction` es `'back'`. `snapTo(v)` salta al punto y estampa las huellas del camino (útil al recargar a media página).

Qué NO está en el módulo (viene del original, `examples/artemis`): el terreno con cráteres y el shader de regolito con sombras raymarched (`terrain.js`), la Tierra (una imagen tipo Blue Marble sobre una esfera, con halo de atmósfera e iluminada por el mismo sol, `sky.js`), el polvo balístico (`dust.js`), el módulo de aterrizaje y el puesto (`outpost.js`), y la cámara de seguimiento con anticipación. Para un cielo negro con la Tierra alcanza una esfera con textura y un `PointLight`; para el polvo, usa `onStep` y partículas con aceleración `-g/6`.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/artemis/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `astro-rig.glb` | Astronauta con rig (24 huesos) y los clips `walk`, `run` e `idle`, con texturas PBR. Es el que usa el módulo. El clip `idle` de Meshy no sirve (por eso el original lo sintetiza y el módulo lo reemplaza). | 3.8 MB |
| `lander.glb` | Módulo de aterrizaje, el destino del recorrido | 5.6 MB |
| `astro.glb`, `astro.rigged_character_glb.glb`, `astro.walking_glb.glb`, `astro.running_glb.glb`, `astro.animation_glb.glb`, `astro.walking_armature_glb.glb`, `astro.running_armature_glb.glb` | Piezas crudas de Meshy con las que se armó `astro-rig.glb` (malla estática, malla riggeada, animaciones sueltas). No se usan en la página. | 36 KB a 3.5 MB |

Los nombres de hueso que el módulo exige: `LeftFoot`, `RightFoot`, `LeftToeBase`, `RightToeBase`. Otro personaje con rig propio sirve si usa esos nombres y trae un clip `walk` (y opcionalmente `run`); si no, ajusta las constantes en `rigged-walker.ts`.

## Cuándo recomendarlo
- **Encaja:** viajes y turismo, expediciones, rutas de senderismo o ciclismo, historias de progreso (un recorrido en el que el avance de la persona es el avance de la página), cualquier marca con un personaje o mascota con rig. Funciona con cualquier terreno si pasas `heightAt`.
- **No encaja:** productos sin personaje, páginas cortas (el efecto necesita 400 a 600 vh de recorrido para respirar) o dispositivos muy lentos: el personaje es una malla con piel de ~3.8 MB más sombras en tiempo real.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi; módulo portado y simplificado de `examples/artemis/astronaut.js` y `prints.js`. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
