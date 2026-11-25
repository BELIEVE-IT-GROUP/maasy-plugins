# Hangar Nine: mantén presionado para encender una máquina de cuarenta toneladas
**Slug:** `hangar` · **Interacción:** mantener el puntero o la barra espaciadora carga un medidor 0..1; al llenarse el modelo se enciende por etapas · **Estado en Believable:** módulo `hold-power`

## Qué es
Sitio de reclutamiento de pilotos de prueba de un fabricante ficticio de mechas. La escena arranca casi negra: el mecha (`mech.glb`) apenas se ve, con balizas rojas. El visitante mantiene presionado para "encender el reactor". Es una landing de ceremonia: el momento de encendido es el producto, no un adorno.

## Brief original (resumen fiel)
- **Marca:** Hangar Nine, programa de pilotos de prueba. Titular: "HN-9 'Warden'. Forty tons. One pilot."
- **Escena:** hangar industrial con grúas, pasarelas, marcas de peligro en el piso, concreto mojado con reflejo (PlanarReflection), niebla y chispas de soldadura de un brazo de grúa. El dron (`drone.glb`) orbita con su propio reflector.
- **Al completar la carga:** cuatro focos cruzados se encienden por turnos con haces volumétricos (VolumetricSpotEffect) y polvo en los haces, el visor del mecha se ilumina, estallan vapores de las válvulas, arranca un HUD (línea de escaneo, retículas, lecturas) y un plano de escaneo sube por el mecha revelando una malla holográfica (shader con altura de mundo y cuadrícula triplanar con fwidth).
- **Después:** el scroll orbita la cámara alrededor del mecha con puntos calientes (Reactor, Actuadores, Blindaje, Armas) proyectados desde 3D.
- **Secciones:** Nav, Hero, Encendido, Especificaciones (hotspots), Estadísticas (altura 11,4 m, reactor 42 MW, velocidad 68 km/h), solicitud al programa, Footer.
- **Arte:** gris gunmetal, niebla gris, ámbar de peligro `#ffb000`, cian HUD con mesura. Tipografías Chakra Petch / Rajdhani y Share Tech Mono. Referencia: secuencias de título de Titanfall y Pacific Rim.
- **Debe cumplirse:** cuadro encendido (mecha imponente bajo focos cruzados, reflejos, HUD) y cuadro apagado (negro con luz estroboscópica roja y la pista de "mantén presionado").

## La interacción única
Presionar y mantener (puntero o espacio) llena un indicador radial. El original tarda `HOLD_TIME = 1.9` s en llegar a 1 y vacía a razón de 1,1 por segundo al soltar. Mientras carga: el visor parpadea cada vez más, el temblor de cámara crece con `charge²`, las balizas giran más rápido, hay un corte RGB radial con rayas de zoom (efecto `HN9Surge`) y suena un zumbido que sube de tono. Al llegar a 1 hay un golpe: apagón breve, destello, sacudida fuerte y la secuencia de encendido. No hay marcha atrás: queda encendido.

## Cómo se implementa
En Believable la parte portable es el módulo `hold-power` (`packs/believe-dioramas/blocks/hold-power/hold-power.ts`). Hace lo central del original: carga con inercia, encendido por etapas del modelo, luces que suben, temblor y zumbido. NO incluye la secuencia GSAP del hangar (bahías, focos, vapor, HUD, escaneo); eso se arma aparte con `onPowered` como disparador.

1. **Carga con inercia.** La velocidad de carga se suaviza (`vel += (want - vel) * (1 - exp(-6 dt))`), así que el medidor acelera en vez de saltar. `want` es `1/holdSeconds` al mantener y `-1/decaySeconds` al soltar.
2. **Encendido por etapas.** El módulo parchea con `onBeforeCompile` los materiales del modelo y suma `totalEmissiveRadiance` después de `#include <emissivemap_fragment>`. `mech.glb` tiene UN solo material (`Material_0`, sin mapa emisivo), así que no se puede encender "por material": el brillo sale de una máscara por tono sobre el albedo (los píxeles naranja del modelo son visor, reactor y franjas de peligro). Las etapas son bandas de altura del bbox local del modelo (`stages`, de abajo hacia arriba), cada una con su umbral de carga y parpadeo de arranque.
3. **Modos de brillo (`glow`).** `'hue'` (máscara por tono, default para materiales sin mapa emisivo), `'emissive-map'` (multiplica el emisivo existente por la carga) o `'all'` (todo el material). También acepta una función por material, y `select(material, mesh)` filtra cuáles se parchean (por nombre, por ejemplo). `region` restringe el brillo a una esfera del bbox, como hizo el original con la cabeza.
4. **Luces.** Las que pases en `lights` suben de `lightsOff` (6 %) a su intensidad original con una curva suave de la carga, con un empujón extra en el destello.
5. **Temblor.** Se aplica con `camera.setViewOffset` (px), no con la posición: no pelea con tu controlador de cámara ni con `lookAt`.
6. **Sonido (opcional).** Dos sierras desafinadas por un pasa-bajos cuyo corte y tono suben con la carga, más golpe grave y acorde al encender. Nunca arranca solo: con `sound: true` se crea en el primer `pointerdown` o tecla; también `enableSound()` dentro de un gesto.

Uso completo en React (el import dinámico evita `window` en el prerender):

```tsx
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  let disposed = false
  const cleanups: (() => void)[] = []
  void (async () => {
    const E = await import('./dioramas-engine')
    const { createHoldPower, HOLD_POWER_MECH_PRESET, HOLD_POWER_MECH_URL } = await import('./hold-power')
    if (disposed) return
    const engine = new E.Engine({ canvas, background: '#040506', post: { bloom: { strength: 0.9, threshold: 0.62 }, vignette: 0.7, grain: 0.05 } })
    cleanups.push(() => engine.dispose())
    const { scene, camera } = engine
    const lamp = new E.THREE.PointLight(0xffa040, 220, 40)
    lamp.position.set(0, 9, 8)
    scene.add(new E.THREE.HemisphereLight(0x8899aa, 0x111111, 0.35), lamp)
    const key = new E.THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(6, 12, 10)
    scene.add(key)
    const gltf = await E.loadGltf(HOLD_POWER_MECH_URL)
    if (disposed) return
    const mech = gltf.scene
    E.normalize(mech, 11.4, { axis: 'y' })
    E.prepModel(mech, engine.renderer)
    scene.add(mech)
    camera.position.set(14, 8, 26)
    camera.lookAt(0, 6, 0)
    const power = createHoldPower(
      { scene, camera, renderer: engine.renderer, canvas },
      { target: mech, lights: [lamp], sound: true, ...HOLD_POWER_MECH_PRESET, onPowered: () => setOnline(true) }
    )
    cleanups.push(() => power.dispose())
    engine.onTick((dt, t) => {
      power.update(dt, t)
      setCharge(power.state.charge) // si pintas un medidor, hazlo con una ref, no con setState por cuadro
    })
    cleanups.push(E.smoothScroll((dt) => engine.frame(dt)))
  })()
  return () => {
    disposed = true
    for (const c of cleanups.reverse()) c()
  }
}, [])
```

- **API:** `power.state` es `{ charge, powered, holding, stage, flash }` (objeto vivo), `power.setHolding(bool)` dispara por código, `power.reset()` apaga, `power.enableSound()`. Opciones útiles: `holdSeconds`, `decaySeconds`, `intensity`, `glowColor`, `hue`, `region`, `order`, `shake`, `trigger` (si el canvas está detrás del contenido con `pointer-events: none`, pasa la sección como `trigger`), `latch: false` para un acelerador que sube y baja.
- **Otro modelo:** si trae mapa emisivo, el default `'emissive-map'` lo usa tal cual. Si trae un material por pieza luminosa, usa `select: (m) => /glow|led|visor/i.test(m.name)` con `glow: 'all'`. Si el brillo debe salir de otro color del albedo, cambia `hue` (0 rojo, 0,17 amarillo, 0,33 verde, 0,55 cian) y `glowColor`.
- **Medidor y HUD:** son HTML. Pinta el radial con una variable CSS (`--c`) escrita desde `onTick`, no con estado de React.
- **Verificado en headless con `mech.glb`:** sin shaders con error; con el dedo abajo la carga llega a 0,35 a los 0,9 s y a 1 poco después de los 2 s, `powered` pasa a true, las franjas y el visor naranja se encienden y las luces suben. Al soltar antes de llegar vuelve a 0.

Efectos del original que el módulo no trae y se arman con piezas del motor: haces volumétricos (`VolumetricSpotPass` de `dioramas-volumetric.ts`), piso mojado (`PlanarReflection` de `dioramas-reflector.ts`), cursor y preloader (`dioramas-ui.ts`), ruido fbm para el vapor (`fbmTexture` de `dioramas-textures.ts`).

## Modelos
| Archivo | URL R2 | Qué es | Tamaño aprox. |
|---|---|---|---|
| `mech.glb` | `https://files.believe-global.com/believable/dioramas/v1/hangar/mech.glb` | Mecha de 11,4 m (se escala con `normalize(m, 11.4, { axis: 'y' })`). Un mesh, un material, textura base + metal/rugosidad | 7,1 MB |
| `drone.glb` | `https://files.believe-global.com/believable/dioramas/v1/hangar/drone.glb` | Dron que orbita el mecha (1,7 m en el original) | 4,6 MB |

## Cuándo recomendarlo
- **Sí:** lanzamientos de hardware, vehículos, equipos o juegos donde el "encendido" es la historia; demos de producto con un momento de revelación; reclutamiento con tono cinematográfico; cualquier objeto con zonas luminosas (reactor, pantallas, luces).
- **No:** marcas cálidas o de servicios (salud, educación, alimentos), páginas que deben leerse rápido, y pantallas táctiles sin teclado donde mantener presionado compite con el scroll (ahí ofrece un botón grande de mantener, no el lienzo completo).
- Con `prefers-reduced-motion`, no montes el canvas: deja un póster con el modelo ya encendido.

## Créditos
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. El módulo `hold-power` es un port simplificado de `examples/hangar` (MIT, Copyright (c) 2026 Blendi).
