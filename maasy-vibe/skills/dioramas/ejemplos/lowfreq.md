# Low Frequency: pon la mano sobre el disco

**Slug:** `lowfreq` · **Interacción:** un tornamesa que suena de verdad; arrastras el disco para rayarlo y el audio sigue tu mano (adelante, atrás, frenado) · **Estado en Believable:** módulo `vinyl-deck`

## Qué es
Un bar de escucha estilo Tokio y sello discográfico. El hero es un primer plano del plato con un disco de vinilo de surcos finos bajo un foco cálido, y un anillo de espectro que late alrededor. Pulsas play y el disco acelera; suena una pista lo-fi hecha en el propio navegador. Si arrastras el disco, lo rayas: la música va más rápida, más lenta o al revés según cómo muevas la mano, y al soltar el plato vuelve a su velocidad. Las bocinas laten con los graves. Sin sonido todo sigue vivo: el disco gira despacio y el espectro se anima con un ritmo simulado.

## Brief original (resumen fiel)
- **Marca:** Low Frequency, bar de escucha estilo Tokio y sello.
- **Interacción:** un plato (`turntable.glb`) con un disco procedural encima (surcos finos con brillo anisotrópico radial, etiqueta impresa). Play: el disco acelera y suena un loop lo-fi house/jazz sintetizado en WebAudio (bombo, caja, hats, bajo, acordes tipo Rhodes) renderizado a un `AudioBuffer` con `OfflineAudioContext`. Arrastrar el disco hace scratch: `playbackRate` sigue la velocidad angular de la mano, hacia atrás con un buffer invertido; al soltar, vuelve a acelerar. Visuales reactivos con un `AnalyserNode`: el woofer de la bocina (`speaker.glb`) pulsa, la luz del cuarto respira, el polvo en el haz baila, un anillo de espectro rodea el plato. El estado mudo debe verse vivo (giro en reposo y espectro falso).
- **Escena:** bar a media luz, pared de discos (fundas procedurales con portadas generadas), brillo cálido de amplificador de tubos, un solo foco cálido sobre el plato, neblina. Paleta berenjena, ámbar y lavanda.
- **Secciones:** Nav · Hero ("Put your hand on the record.") · Prensado de la semana (lista de pistas con botones que posicionan la aguja) · El bar (horarios, 12 asientos, "no phones on the counter") · Catálogo del sello (fundas que se inclinan al pasar el cursor) · Club de discos (membresía) · Footer.
- **Arte:** casi negro berenjena, ámbar, lavanda `#a78bfa`. Fuentes "Syne" o "Unbounded" más "Space Mono". Granulado y analógico.
- **Debe ser verdad:** el hero es un primer plano del disco girando bajo el foco cálido con el anillo de espectro, y la interfaz invita claramente a "arrastra para rayar".

## La interacción única
El plato es **el reproductor**. No hay un reloj de audio aparte: la velocidad a la que gira el disco ES el `playbackRate` de la música. Con la mano puesta, el disco sigue tu puntero; la velocidad angular que mides se convierte en tasa de reproducción (negativa si giras al revés, y entonces suena el buffer invertido). Al soltar, el motor del plato lo devuelve a 33 1/3 rpm con una curva de inercia. Todo lo demás (anillo, woofer, luz) escucha el mismo audio.

## Cómo se implementa
**1. Medidas del modelo.** `turntable.glb` es una sola malla con posiciones cuantizadas (normalizadas a int16): su espacio local va de -1 a 1. Todas las medidas del disco están en ese espacio, medidas a mano sobre el archivo: centro `(-0.205, 0)`, radio `0.703`, cara del plato a `y = 0.1755`, etiqueta de radio `0.232`, agujero `0.0165`. El disco se añade como hijo de la malla (`mesh.add(record)`), así hereda su escala y no hay que convertir unidades.

**2. Disco procedural.** Un `RingGeometry` (la cara con surcos), un `LatheGeometry` (borde elevado y costado) y un `CircleGeometry` con una textura de canvas (la etiqueta, con texto en arco y el agujero recortado con `destination-out`). La cara usa `MeshPhysicalMaterial` con `anisotropy`, y un `onBeforeCompile` que lee una textura 1D radial de 2048 texels: R = volumen de la pista en ese radio, G = ruido fino, B = surco (1) o liso (0). Con eso se modula la rugosidad, y en `lights_physical_fragment` se fuerza la dirección de anisotropía a la **radial** para que el brillo sea el abanico típico de un vinilo:

```glsl
vec3 radV = normalize(vRadV - normal * dot(vRadV, normal));      // vRadV: dirección radial en espacio de vista
material.anisotropy = clamp(uAniso * lfGroove * (0.75 + lfAmp * 0.25) * (1.0 - lfScr), 0.0, 0.97);
material.alphaT = mix(pow2(material.roughness), 1.0, pow2(material.anisotropy));
material.anisotropyT = radV;
material.anisotropyB = normalize(cross(normal, radV));
```

Los surcos visibles se tallan con la **envolvente de volumen del audio ya renderizado** (RMS en 256 puntos), así que las bandas oscuras y claras del disco corresponden de verdad a la música. Polvo y rayones salen de un canvas con motas rojas y arañazos verdes que se leen en el shader.

**3. Audio sintetizado.** Cada pista es un loop de 8 compases que se renderiza una vez con `OfflineAudioContext` (44.1 kHz, estéreo): bombo con barrido de tono, caja y palmas con ruido filtrado, hats, bajo (seno más sierra con filtro), piano FM tipo Rhodes (portadora y modulador 1:1 con índice que decae, más un parcial de tine), reverb de cuarto con ruido filtrado, wow y flutter de cinta (dos LFO sobre un `DelayNode`), saturación `tanh`, compresor, y al final crujido y siseo de vinilo **prensados en el mismo buffer** (por eso se rayan junto con la música). La cola de la reverb se pliega sobre el inicio para que el loop no tenga costura. Se renderiza en el primer `play()`, no al cargar.

**4. El reproductor guiado por el plato.** Un `AudioBufferSourceNode` en loop. Cada frame se le pasa `rate = spin / OMEGA` (OMEGA es 33 1/3 rpm en rad/s):

```ts
const mag = Math.abs(rate)
const dir = rate < -0.003 ? -1 : rate > 0.003 ? 1 : lastDir
if (!src || dir !== lastDir) startSource(dir)                    // al cambiar de sentido, cambia al buffer invertido
src.playbackRate.setTargetAtTime(Math.max(mag, 0.0005), now, 0.008)
gate.gain.setTargetAtTime(mag < 0.02 ? 0 : Math.min(1, mag * 3), now, 0.01)   // casi parado = silencio
// posición real: pos += appliedRate * dtAudio; reversa = empieza en (duración - pos) del buffer invertido
```

**5. La mano.** Se lanza un rayo a un plano horizontal a la altura de la cara del disco. Al apretar dentro del radio (con 6 % de margen) se guarda el ángulo `phi = atan2(-dz, dx)`. En cada movimiento se acumula el ángulo con `atan2(sin d, cos d)` para que cruzar la discontinuidad no salte, y se ignora una zona muerta alrededor del eje. Con la mano puesta:

```ts
angle = damp(angle, grabTarget, 38, dt)                            // el disco persigue la mano
spin  = damp(spin, -(angle - prev) / dt, 28, dt)                   // la velocidad medida es la del audio
```

Al soltar: `spin = damp(spin, motor, up ? 3.2 : 2.4, dt)`, con motor = 33 1/3 rpm si suena y 26 % de eso en reposo (el giro lento "vivo").

**6. Espectro y reacción.** `AnalyserNode` (FFT 2048, suavizado 0.7) leído a 72 bandas en escala logarítmica de 38 Hz a 11 kHz. Un anillo de 144 barras instanciadas (una `InstancedBufferGeometry`, el largo de cada barra sale de una `DataTexture` de amplitudes) rodea el plato; los graves miran al frente y los agudos dan la vuelta por detrás. El nivel de graves y un detector de bombo (`max(0, bass - 0.35) / 0.65` con caída exponencial) empujan el cono del woofer: un `onBeforeCompile` en el material de la bocina desplaza los vértices del círculo del cono en `z`. Sin audio, `fakeSpectrum` produce un patrón a 118 bpm para que el anillo y el woofer sigan moviéndose.

**Uso con el módulo `vinyl-deck`** (lo hace todo lo anterior salvo el brazo animado, que queda fijo donde lo modeló Meshy):

```tsx
useEffect(() => {
  let off: Array<() => void> = []
  let dead = false
  ;(async () => {
    const E = await import('./dioramas-engine')
    const { createVinylDeck } = await import('./vinyl-deck')
    if (dead || !canvasRef.current) return
    const engine = new E.Engine({ canvas: canvasRef.current, background: '#0a0710', post: { bloom: { strength: 0.6, threshold: 0.8 }, vignette: 0.7, grain: 0.05 } })
    engine.scene.environment = E.studioEnvironment(engine.renderer, { top: 0x1a1226, bottom: 0x050308 })
    const key = new E.THREE.SpotLight(0xffc27a, 90, 0, 0.45, 0.6, 2)   // el foco cálido sobre el plato
    key.position.set(0.3, 2.2, 0.5); key.castShadow = true
    engine.scene.add(key, key.target)
    const deck = await createVinylDeck(
      { scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas: engine.canvas },
      { size: 1, interactionTarget: window }                          // window si hay contenido encima del canvas
    )
    if (dead) { deck.dispose(); engine.dispose(); return }
    engine.camera.position.set(0, 1.5, 1.3); engine.camera.lookAt(0, 0.1, 0)
    engine.onTick((dt, t) => { deck.update(dt, t); setLevel(deck.state.level) })
    playRef.current = () => deck.play()                              // conéctalo a un onClick: el audio exige un gesto
    off = [E.smoothScroll((dt) => engine.frame(dt)), () => deck.dispose(), () => engine.dispose()]
  })()
  return () => { dead = true; off.forEach((f) => f()) }
}, [])
```

Detalles del módulo: `state` expone `{ playing, rpm, rate, level, held, hover, track, angle, audioLive }` para verificar por código; `cue(i)` cambia de pista (dos incluidas: house y hip hop); `deck.group` es el contenedor que se mueve en la escena (solo rotación en Y); `deck.center()` da el centro del disco en mundo (para anclar etiquetas DOM). Pide una luz de acento cálida arriba y un env map con un softbox para que el vinilo tenga brillo; sin entorno el disco se ve negro plano.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/lowfreq/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `turntable.glb` | Plato giradiscos con plinto, brazo y tapa de control (una sola malla cuantizada) | 4.1 MB |
| `speaker.glb` | Bocina de piso con cono de woofer | 3.5 MB |

## Cuándo recomendarlo
- **Encaja:** bares y clubes, sellos y tiendas de discos, festivales, marcas de audio y de hardware musical, cualquier producto sonoro donde "tocar" sea parte de la promesa. Funciona porque la interacción se oye, no solo se ve.
- **No encaja:** marcas que no pueden poner sonido (oficinas, contextos formales), públicos que llegan en móvil con datos limitados (son 7.6 MB y una síntesis de audio que cuesta CPU en el primer play), o páginas donde el scroll debe ser el único gesto. Ofrece siempre un botón de silencio y no inicies audio sin un clic.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
