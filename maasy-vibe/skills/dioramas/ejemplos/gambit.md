# Gambit: la Partida Inmortal repetida en mármol

**Slug:** `gambit` · **Interacción:** el scroll reproduce una partida de ajedrez jugada a jugada sobre un tablero de mármol, y al final se juega libre con click · **Estado en Believable:** módulo `chess-replay`

## Qué es
Una landing para un fabricante de juegos de ajedrez de mármol y un club. Una partida famosa (Anderssen contra Kieseritzky, Londres 1851, 45 jugadas) se reproduce con el scroll: las piezas se deslizan, los caballos saltan en arco, las capturadas se tumban y se acomodan junto al tablero. La cámara cambia de ángulo en las jugadas clave y una columna lateral muestra la notación con una nota por jugada. Después de la partida, la persona puede mover piezas.

## Brief original (resumen fiel)
- **Marca:** Gambit, juegos de ajedrez tallados a mano en mármol y un salón de socios.
- **Interacción:** el scroll reproduce la Immortal Game con las jugadas hardcodeadas como pares from/to. Cada paso de scroll es una jugada; las piezas se deslizan con easing, los caballos describen un arco, las capturadas caen, se deslizan fuera y quedan al lado. Luego, juego libre: arrastrar cualquier pieza (raycast, levantarla con sombra, encajar en casillas), sin motor de ajedrez.
- **Piezas:** un GLB por tipo, de mármol de Carrara. Las negras salen de los mismos modelos con una transformación de material (`onBeforeCompile`): el color base se remapea a Nero Marquina con vetas claras y doradas. Los caballos miran al rival.
- **Secciones:** Nav · Hero ("Some games are never finished.") · La partida (pinned, larga) · El juego (Carrara y Nero Marquina, tablero de nogal, 3.900 EUR) · El salón · Footer.
- **Arte:** negro, hueso y latón `#b89b6a`. "Bodoni Moda" o "Playfair Display" + "Inter". Luz de estudio de poca luz: una principal fuerte desde arriba y de lado, contraluces para las siluetas. Lujoso y cerebral.
- **Debe ser verdad:** un cuadro a mitad de partida con un caballo en pleno salto sobre el tablero reflectante, luz dramática, que parezca un aviso de lujo.

## La interacción única
Un solo número `P` de 0 a 46: la parte entera es la jugada, la fraccionaria es el avance dentro de ella. La posición de cada pieza es función pura de `P`, así que el scroll hacia atrás deshace la partida sin lógica extra. Cuatro poses por jugada: el que mueve (desliza con una pequeña inclinación, o salta si es caballo), la víctima (se inclina sobre el borde de su base hasta su ángulo de reposo, se levanta y vuela a su "tumba"), las demás (quietas), y un epílogo (`P` de 45 a 46) donde el rey negro se tumba.

## Cómo se implementa
El módulo `chess-replay` trae todo: tablero, 32 piezas, reproducción y juego libre. Lo importante, para saber qué tocar:

1. **Derivar estados.** `replayGame()` recorre las 45 jugadas sobre un tablero `casilla -> id` y guarda una foto por jugada (`states[k]` = tablero antes de la jugada k, con la posición en las tumbas). Cada pieza tiene un id estable (`wg1` = caballo de rey blanco).
2. **Pose como función.** `poseMove(antes, despues, jugada, u)` calcula la pose de cada pieza. El caballo sube `(1.05 + dist * 0.14) * sin(PI * e)^0.92`; las demás se inclinan unos 0.075 rad en el eje perpendicular a su movimiento.
3. **Caída de la víctima.** Se calcula el ángulo de reposo (`restAngle`) girando la pieza sobre el borde de su base hasta que otro punto toca la mesa; se anima con `fall(t)` (cae con aceleración y rebota un 4 %) y luego vuela a `gravePose`.
4. **Negras desde las blancas.** `marble(src, black, vetas)` crea un `MeshPhysicalMaterial` con `onBeforeCompile`. Para el negro, las vetas son donde el Carrara es más oscuro que su entorno (se compara un mip bajo con uno alto de la textura) y se pintan en dorado y hueso sobre un fondo casi negro.
5. **Caballo mirando al rival.** Los modelos miran a +Z; las blancas giran PI, las negras 0, con un pequeño jitter. Peones y torres reciben un giro al azar para que las vetas no se repitan.
6. **Juego libre.** `startFreePlay(fromPly)` toma la posición de esa jugada y pasa a clicks: click en pieza propia la selecciona y muestra discos en las casillas legales, click en un destino juega con la misma animación del replay. Las piezas se eligen con un cilindro invisible por pieza (no contra 60 mil triángulos).

**Qué reglas trae el juego libre.** Movimiento de cada pieza, camino libre, peones (paso doble, captura en diagonal, promoción automática a dama), y jaque: no se puede dejar al propio rey en jaque, y el estado dice `check`, `checkmate` o `stalemate`. No trae enroque ni captura al paso, ni subpromoción. El original solo dejaba arrastrar sin reglas; esto es más estricto a propósito.

Uso en un componente:

```tsx
import { useEffect, useRef } from 'react'

export function ImmortalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const noteRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    let off: Array<() => void> = []
    let dead = false
    ;(async () => {
      const E = await import('./dioramas-engine')
      const { createChessReplay } = await import('./chess-replay')
      if (dead || !canvasRef.current) return
      const canvas = canvasRef.current
      const engine = new E.Engine({ canvas, background: '#0a0908', post: { bloom: { strength: 0.25, threshold: 0.9 }, vignette: 0.6, grain: 0.04 } })
      const { scene, camera, renderer } = engine
      scene.environment = E.studioEnvironment(renderer, { top: '#241f1a', bottom: '#050505' })
      scene.environmentIntensity = 0.8
      const key = new E.THREE.SpotLight('#fff1dc', 900, 40, 0.5, 0.6)
      key.position.set(-6, 12, 5)
      key.castShadow = true
      scene.add(key)
      // El suelo de las capturadas queda en y = -0.34 (tableY).
      const floor = new E.THREE.Mesh(new E.THREE.PlaneGeometry(60, 60), new E.THREE.MeshStandardMaterial({ color: '#0d0b0a', roughness: 0.9 }))
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.34
      floor.receiveShadow = true
      scene.add(floor)
      const game = await createChessReplay({ scene, camera, renderer, canvas }, { models: 'full' })
      if (dead) return game.dispose()
      let freeMode = false
      engine.onTick((dt, t) => {
        const r = sectionRef.current!.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
        if (!freeMode) game.setProgress(p)
        if (p >= 1 && !freeMode) { freeMode = true; game.startFreePlay(0) }   // o startFreePlay(45) para seguir desde el mate
        if (p < 0.98 && freeMode) { freeMode = false; game.setProgress(p) }
        game.update(dt, t)
        if (noteRef.current) noteRef.current.textContent = `${game.state.san} ${game.state.note}`
        // La cámara sigue la acción: baja en las jugadas de caballo.
        const f = game.focus
        camera.position.lerp(new E.THREE.Vector3(f.x * 0.3 - 1.5, 7 + (game.state.ply % 7) * 0.3, 8), 0.04)
        camera.lookAt(f.x * 0.5, 0.4, f.z * 0.5)
      })
      off = [E.smoothScroll((dt) => engine.frame(dt)), () => game.dispose(), () => engine.dispose()]
    })()
    return () => { dead = true; off.forEach((f) => f()) }
  }, [])
  return (
    <section ref={sectionRef} style={{ height: '900vh' }}>
      <canvas ref={canvasRef} style={{ position: 'sticky', top: 0, width: '100%', height: '100vh', display: 'block' }} />
      <p ref={noteRef} style={{ position: 'fixed', left: 24, bottom: 24 }} />
    </section>
  )
}
```

Qué espera la escena alrededor: el suelo (mesa) en `tableY = -0.34`, una luz principal con sombra, entorno de estudio, cámara a 7 a 10 unidades. El tablero ocupa 8 por 8 con a1 en (-3.5, +3.5): las blancas están hacia +z, así que la cámara cómoda mira desde +z. Para que el mármol refleje, añade `PlanarReflection` de `dioramas-reflector.ts` sobre el plano del tablero; el módulo no lo incluye. Es el tablero ya "mojado" lo que da el aspecto de aviso de lujo.

Estado para verificar por código: `game.state` es `{ progress, ply, plyFloat, san, note, mode, turn, selected, legal, status, freeMoves, captured }`. Por ejemplo `setProgress(1)` debe dar `ply === 45`, `san === 'Be7#'` y `captured === 9`. `game.legalMoves('e2')` en la posición inicial devuelve `['e3', 'e4']`. `game.move('e2', 'e4')` devuelve `true`.

Notas de uso:
- `models: 'far'` carga versiones de ~6 KB sin textura (mármol liso), para pruebas o conexiones lentas. `models: 'procedural'` no descarga nada y usa tornos de three.
- Las anotaciones por jugada vienen en inglés; pasa `notes` (45 textos) para traducirlas.
- El original alarga las jugadas clave (el salto de caballo a g7 casi en cámara lenta). El módulo usa duración uniforme: si lo quieres, remapea el progreso con una tabla de duraciones antes de llamar a `setProgress`.
- Peso: el módulo pesa unos 38 KB de fuente. Pasa de lo ideal (25 KB) por las 45 anotaciones, el shader de mármol, el respaldo torneado y las reglas; la lógica de ajedrez en sí es poco más de 3 KB, por eso el juego libre entró completo.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/gambit/` por delante. El original carga `pawn-lo` para el peón (el `pawn.glb` es la versión más pesada) y todos los `far-*` para el nivel de detalle lejano.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `king.glb` | Rey, mármol Carrara con textura | 2.9 MB |
| `queen.glb` | Dama | 2.4 MB |
| `bishop.glb` | Alfil | 1.6 MB |
| `knight.glb` | Caballo | 2.4 MB |
| `rook.glb` | Torre | 1.4 MB |
| `pawn-lo.glb` | Peón (el que usa el módulo) | 0.5 MB |
| `pawn.glb` | Peón de más resolución | 1.6 MB |
| `far-{king,queen,bishop,knight,rook,pawn}.glb` | Versiones lejanas sin textura (opción `models: 'far'`) | 6 a 7 KB c/u |

Suma de la partida con `models: 'full'`: unos 11 MB. Es mucho para móvil; ofrece `far` ahí o muestra un preloader (`dioramas-ui.ts`).

## Cuándo recomendarlo
- **Encaja:** juegos de mesa de lujo, clubes y academias de ajedrez, bares y cafés temáticos, relojes o joyas con relato de "partida", cualquier marca que pueda contar una historia en pasos discretos (una receta, una ruta, una partida deportiva).
- **No encaja:** marcas sin una secuencia de pasos clara, o donde 11 MB de modelos no se justifican. Tampoco si la gente espera un motor de ajedrez: no hay IA ni PGN arbitrario (la partida está fija; para otra, cambia la tabla `PLIES` del módulo).

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi; módulo portado y simplificado de `examples/gambit`. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
