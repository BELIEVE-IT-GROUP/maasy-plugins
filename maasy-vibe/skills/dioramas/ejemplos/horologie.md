# Aurel Horologie: desarma un reloj con el scroll

**Slug:** `horologie` · **Interacción:** el scroll separa en capas un movimiento de reloj (vista explotada) con los engranajes girando · **Estado en Believable:** módulo `exploded-view`

## Qué es
Una landing de relojería independiente. El reloj flota, el cursor lo inclina, y al bajar la cámara entra a una vista explotada del calibre: placa, barrilete con resorte, tren de engranajes, jaula de tourbillon, balancín con espiral y puentes, separados a lo largo de un eje y cada uno con su etiqueta. Al volver arriba, todo se rearma. Es la mejor demostración de "el objeto es la página" cuando el producto tiene piezas que se pueden contar.

## Brief original (resumen fiel)
- **Marca:** Aurel Horologie, relojero ginebrino independiente; calibre AH-01, tourbillon esqueleto.
- **Escena:** el reloj Meshy (`watch.glb`) flotando en el hero; luego un movimiento 100% procedural apilado sobre el eje Z. Las capas se separan con etiquetas con línea guía a anclas 3D ("Barrel · 72 h reserve", "Escapement · 28,800 vph"). Mantener presionada la corona da cuerda: el resorte se aprieta, el indicador de reserva sube y el tren se acelera un momento.
- **Secciones:** Nav · Hero ("Two hundred and eleven parts. One heartbeat.") · El movimiento explotado (pinned, largo) · Acabados (anglage, perlage, Côtes de Genève en primeros planos) · La colección (3 referencias, CHF 48,000+) · Atelier · Footer.
- **Arte:** marfil `#f3efe7`, azul marino, oro rosa `#c89b6d`. "Cormorant Garamond" + "Montserrat" en versalitas. Modo claro, preciso, editorial. Entorno de estudio con softboxes largos para que los metales se vean caros.
- **Debe ser verdad:** el cuadro explotado es una pila flotante de engranajes y puentes brillantes con etiquetas, nítida como un render técnico. Si el reloj Meshy se ve mal de cerca, déjalo pequeño y lejos, o usa el movimiento procedural ensamblado como hero.

## La interacción única
Un solo número, `explode` de 0 a 1, gobierna todo. Cada capa tiene un desplazamiento final `dz` en Z y un retraso; con `p = smoothstep(delay, delay + 0.72, explode)` cada capa se mueve `dz * p`. Las capas del centro arrancan tarde (retraso 0.2) y las de los extremos temprano (0), así la pila "respira" hacia afuera. Dentro de una capa hay subpiezas con su propio `dz` (la tapa del barrilete sube más que el tambor). Mientras tanto los engranajes giran por relación de dientes reales, no por un ángulo inventado.

## Cómo se implementa
El módulo `exploded-view` hace dos cosas.

**1. Movimiento procedural (por defecto).** Arma el calibre en la carga: dientes con perfil real (`gearLoop`, extruidos con `ExtrudeGeometry`), ventanas de aligeramiento, barrilete, rueda central de 80 dientes, tercera de 75, jaula con rueda de escape, balancín con espiral a 4 Hz y tres puentes. Los ejes quedan a la distancia a la que engranan de verdad, y cada rueda gira con la fórmula del original, que asegura que un diente quede en el hueco del otro:

```ts
const mesh = (a: number, NA: number, NB: number, d: number) =>
  -(NA / NB) * (a - d) + d + Math.PI + Math.PI / NB   // d = ángulo entre centros
```

El balancín marca el reloj: 8 semitiempos por segundo, y cada semitiempo adelanta el tren un paso suave (`smooth(-0.075, 0.075, ...)`), con `timeScale` para que el movimiento se vea (por defecto 20 segundos de reloj por segundo real).

**2. Explotar cualquier objeto.** Con `target` el módulo separa los hijos directos (o cada mesh) a lo largo de un eje, ordenados por su posición en ese eje, con el mismo escalonado. Sirve para un GLB de producto que ya viene por partes (tapa, cuerpo, base). No mueve vértices: solo `position` de cada hijo.

Uso en un componente (la cámara se mueve con el progreso de la sección fija):

```tsx
import { useEffect, useRef } from 'react'

export function ExplodedWatch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let off: Array<() => void> = []
    let dead = false
    ;(async () => {
      const E = await import('./dioramas-engine')
      const { createExplodedView } = await import('./exploded-view')
      if (dead || !canvasRef.current) return
      const canvas = canvasRef.current
      const engine = new E.Engine({ canvas, background: '#f3efe7', post: { bloom: { strength: 0.2, threshold: 0.95 }, vignette: 0.25, grain: 0.03 } })
      const { scene, camera, renderer } = engine
      scene.environment = E.studioEnvironment(renderer, { top: '#ffffff', bottom: '#d9d2c4' })
      const view = createExplodedView({ scene, camera, renderer, canvas }, { size: 1.4, colors: { rose: '#c89b6d' } })
      view.root.rotation.set(-0.5, 0.6, 0)
      engine.onTick((dt, t) => {
        const r = sectionRef.current!.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))   // 0..1 dentro de la sección fija
        view.setExplode(E.smooth(0.05, 0.6, p))
        view.update(dt, t)
        camera.position.set(0.4, 0.3, 4 + 5 * view.state.explode)               // más lejos cuanto más abierto
        camera.lookAt(0, 0, 0)
      })
      off = [E.smoothScroll((dt) => engine.frame(dt)), () => view.dispose(), () => engine.dispose()]
    })()
    return () => { dead = true; off.forEach((f) => f()) }
  }, [])
  return (
    <section ref={sectionRef} style={{ height: '400vh' }}>
      <canvas ref={canvasRef} style={{ position: 'sticky', top: 0, width: '100%', height: '100vh', display: 'block' }} />
    </section>
  )
}
```

Qué espera la escena alrededor:
- **Luz:** los metales viven del entorno. Sin `scene.environment` (usa `studioEnvironment` del motor con softboxes largos) se ven grises y planos. Agrega una luz direccional con sombra para las sombras de contacto entre capas.
- **Cámara:** con `size: 1` la placa mide 2 unidades de ancho y la pila explotada mide unas 2.5 en profundidad; aleja la cámara al abrir. La cara del dial mira a +Z, 12 en punto es +Y. Rota `view.root` para ver la pila en diagonal, es lo que da el aspecto de render técnico.
- **Etiquetas:** `view.anchorNames` da `plate`, `barrel`, `train`, `cage`, `balance`. `view.anchorWorld('barrel')` devuelve la posición 3D; proyéctala con la cámara y mueve un `div` con su línea guía en HTML.

Estado para verificar por código: `view.state` es `{ explode, parts, beat, balance, centerAngle }`. Un test headless puede llamar `setExplode(1)` y comprobar que `root.children` quedaron en `z` distintas, y avanzar `update(1/60, t)` y ver que `beat` y `centerAngle` cambian.

Qué se simplificó respecto al original: los acabados por shader (Côtes de Genève, perlage, anglage con bisel), el pasador de áncora, la corona con cuerda, los rubíes con transmisión y la espiral con shader. El resultado se ve como un modelo técnico limpio, no como el render de joyería del original. Si la marca necesita ese nivel, aplica texturas de rayas a `plate` y `bridge` o pídele al agente cargar el `watch.glb` y usarlo en el hero junto al movimiento.

Cuerda por mantener presionado (la corona): el original sube la tensión del resorte mientras se mantiene el click y acelera el tren. Hoy no está en el módulo. Para el gesto de mantener presionado usa el módulo `hold-power` y, si el cliente lo pide, amplía `exploded-view` con una opción que acelere `timeScale` mientras dure la carga.

## Modelos
| Archivo | URL R2 | Qué es | Tamaño |
|---|---|---|---|
| `watch.glb` | `https://files.believe-global.com/believable/dioramas/v1/horologie/watch.glb` | Reloj Meshy ensamblado, para el hero (el original lo deja flotando, el cursor lo inclina). No se explota: es una malla única. | 5.6 MB |

El módulo procedural no necesita ningún GLB.

## Cuándo recomendarlo
- **Encaja:** relojes, joyería mecánica, bicicletas y componentes, audio de alta gama, cámaras, herramientas de precisión, cualquier producto cuya promesa sea "mira lo bien hecho que está por dentro". También sirve para explicar un servicio por capas (infraestructura, stack) usando `target` con un modelo propio.
- **No encaja:** productos sin partes visibles que contar, marcas de consumo rápido, o landings que necesitan carga ligera: la pila procedural suma unos 76 mil triángulos y requiere un dispositivo con GPU decente. En móvil baja `size` y evita `post` pesado.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi; módulo portado y simplificado de `examples/horologie`. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (se debe mostrar el crédito en la página si se usa `watch.glb`).
