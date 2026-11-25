# Lithos: abre una geoda manteniendo presionado

**Slug:** `lithos` · **Interacción:** mantener presionado agrieta una geoda sellada, que se parte y revela amatista brillante; el cursor es una luz · **Estado en Believable:** solo referencia (la geoda depende de un shader y de una geometría medida); el gesto de mantener presionado ya existe como módulo `hold-power`

## Qué es
Una galería de especímenes minerales y una línea de joyería. En el hero hay una geoda cerrada sobre terciopelo negro. Mantienes presionado: grietas violetas se encienden por la costura, cae polvo, la piedra tiembla, y a los 1.9 segundos se parte. La tapa se levanta y se recuesta atrás; dentro brilla la amatista con destellos que titilan según desde dónde mires. Luego el scroll recorre la colección (cuarzo, pirita, amonita) y el cursor es una luz puntual que orbita el espécimen.

## Brief original (resumen fiel)
- **Marca:** Lithos, galería de minerales de museo y joyería cortada de ellos.
- **Interacción:** la geoda cerrada se arma con **dos copias** de `geode.glb` (una mitad cortada con la cavidad hacia arriba), la de arriba espejada para que los cortes se junten. Al mantener: grietas violetas brillan en la costura (shader + partículas de polvo cayendo), la piedra tiembla y se parte; la mitad de arriba sube y se gira, y aparece la cavidad de amatista. Destello: ruido de alta frecuencia por especular por dependencia de la vista, para que las facetas titilen; bloom. Después, scroll por la colección: cuarzo claro (material físico con transmisión, dispersión e iridiscencia, que se vea cristal real), pirita (metal espejo con reflejos nítidos de estudio), amonita (iridiscencia de película delgada). **El cursor es una luz**: orbita una luz puntual pequeña alrededor del espécimen, con brillos y sombras en movimiento.
- **Secciones:** Nav · Hero ("Four billion years of patience.") · La grieta · La colección (4 especímenes con localidad, edad, peso, precio) · Joyería · Procedencia y ética · Footer.
- **Arte:** negro terciopelo, violeta amatista `#9d6bff`, platino. "Cinzel" o "Italiana" + "Jost". Luz de vitrina de museo: una principal pequeña y dura más una softbox, sombra profunda.
- **Debe ser verdad:** el cuadro de la geoda abierta con la amatista brillando es impresionante; el cuarzo se ve como cristal de verdad, no plástico.

## La interacción única
El gesto es una **barra de carga que se descarga sola**. En el original, `hold` sube mientras estás presionando y cae al soltar:

```ts
const HOLD_TIME = 1.9
hold = clamp(hold + (holding ? dt / HOLD_TIME : -dt * 0.9))        // soltar a la mitad la deja volver
uCrack = Math.max(smoothstep(hold) * 0.95, 0.05 + 0.035 * Math.sin(t * 1.6))   // grieta + un latido tenue en reposo
const a = hold * hold * 0.0065 + (hold > 0.85 ? (hold - 0.85) * 0.03 : 0)      // temblor que crece al final
pair.position.set(Math.sin(t * 71) * a, Math.abs(Math.sin(t * 53)) * a * 0.6, Math.cos(t * 67) * a)
if (hold >= 1) split()
```

La grieta "late" un poco incluso en reposo para que la gente adivine que hay algo vivo antes de tocarla. El temblor es de piedra bajo presión, no un celular vibrando: amplitud cuadrática en `hold` y frecuencias primas distintas por eje.

### ¿Se puede reutilizar de forma simple?
Sí, la parte del gesto. El módulo `hold-power` trae justo ese mecanismo: mantener presionado (puntero o barra espaciadora) carga `state.charge` de 0 a 1 en `holdSeconds`, soltar lo vacía en `decaySeconds` (su default de 1.1 s equivale al `-dt * 0.9` del original), y al llegar a 1 llama a `onPowered`. Pasa `select: () => false` para que no toque los materiales de la geoda (por defecto enciende un brillo naranja en el modelo) y `shake` para el temblor de vista. Con eso:
- `hold.state.charge` va a `uCrack`, a la amplitud del temblor de la piedra y al brillo de una luz;
- `onPowered` dispara la animación de partir (`split()` abajo).

Lo que NO es reutilizable de forma simple es lo específico de la geoda: la geometría espejada con el plano de corte medido, y el shader de grietas y de destellos. Para otro objeto (una caja que se abre, una fruta, un huevo) se necesita un modelo cortado en dos mitades y una textura de grietas propia.

## Cómo se implementa
**1. Dos mitades de un mismo modelo.** `geode.glb` es una mitad con corte plano y cavidad hacia arriba. Se mide una vez el plano de corte (en el original `PLANE_N = (-0.01168, 0.74314, 0.66903)`, `PLANE_D = 0.2214`; son números de ese archivo y no sirven para otro), se rota el modelo para que el plano quede en `y = 0` y se clona con `scale.y = -1` para la tapa. Jerarquía: `pair` (el temblor) contiene `root` de cada mitad, que contiene `flip` (espejo), que contiene `align` (plano a y=0), que contiene la escena del GLB.

**2. Mismo material, otro patrón de grietas.** La tapa clona el material y cambia un uniforme `uSide` (+1 o -1) que desplaza las coordenadas del campo de grietas, para que no sea una imagen en espejo.

**3. Shader de la geoda (`onBeforeCompile`).** Se calcula la posición en el "espacio de la mitad" (`vHalf`, con el plano de corte en y=0) y se usa para:
- Distinguir la **cavidad** (la normal apunta hacia el centro y está bajo el plano) de la corteza exterior: `gCav = smoothstep(0.0, 0.3, -dot(gN, normalize(vHalf + vec3(0,0.06,0)))) * (1.0 - smoothstep(-0.016, -0.002, vHalf.y))`.
- Pintar la corteza de basalto marrón con manchas de óxido y un relieve de grumos botrioidales (Worley invertido, derivado en espacio de pantalla con `dFdx`/`dFdy`).
- Las **grietas**: una red de Worley (`crackNet`, diferencia entre el segundo y el primer vecino) en capas, de la que solo "se rompen" algunas paredes (`keep`), con un ancho que crece con `uCrack` y un alcance vertical `reach` que se abre desde la costura. Se suma luz violeta (`uCrackColor`) con parpadeo en el canal emisivo.
- Los **destellos de la cavidad**: se parte el espacio en celdas (`floor(vHalf * 95)`), cada celda decide si es una estrella y qué tan inclinada está su faceta (`nf = normalize(normal + (rnd - 0.5) * 1.35)`); el brillo es un especular muy cerrado (`pow(..., 260)`) contra dos luces en espacio de vista, multiplicado por un titileo con fase aleatoria por celda.

**4. La partida (GSAP, 3 segundos).** Al llegar `hold` a 1: un destello de la grieta (`uCrack` a 1.5 en 0.12 s) que se apaga en 2.4 s, `uSeal` a 0 (el sello blanco de ágata desaparece), una `PointLight` violeta que sube a 9 y cae a 0.35, `uInner` (brillo interno de la cavidad) sube y baja, `uGlint` a 1, y la tapa recorre una trayectoria `lidT` de 0 a 1: sube (0 a 0.34), cuelga un latido, gira hacia atrás y baja sobre el terciopelo. Chispas de roca (`InstancedMesh`) saltan con gravedad `-3.2` y rebote amortiguado.

**5. Cuarzo, pirita, amonita.** El cuarzo es `MeshPhysicalMaterial` con `transmission: 1`, `ior: 1.544`, `dispersion: 2.2`, `iridescence: 0.2`, más una reflexión interna falsa con IOR distinto por canal (`refract` tres veces con 1.52, 1.545, 1.575 y `getIBLRadiance`) para separar el "fuego". Las vetas lechosas salen de un ruido sobre la altura. Es lo que hace que no parezca plástico.

**6. El cursor es una luz.** Un `SpotLight` con sombra cuelga del rayo del puntero a una distancia fija frente al espécimen, con `lerp` rápido (`1 - exp(-10 dt)`); si el puntero lleva varios segundos quieto, su intensidad se apaga y el espécimen vuelve a la luz de estudio.

Esqueleto del gesto con `hold-power` (las dos mitades y el material con `uCrack` son tuyos; el módulo solo aporta la carga):

```tsx
useEffect(() => {
  let off: Array<() => void> = []
  let dead = false
  ;(async () => {
    const E = await import('./dioramas-engine')
    const { createHoldPower } = await import('./hold-power')
    if (dead || !canvasRef.current) return
    const engine = new E.Engine({ canvas: canvasRef.current, background: '#050407', post: { bloom: { strength: 0.9, threshold: 0.6 }, vignette: 0.7 } })
    const crack = { value: 0 }                       // el uniform uCrack de tu material de geoda
    const hold = createHoldPower(
      { scene: engine.scene, camera: engine.camera, renderer: engine.renderer, canvas: engine.canvas },
      { select: () => false, holdSeconds: 1.9, decaySeconds: 1.1, shake: 3, onPowered: () => split() }
    )
    const split = () => { /* timeline GSAP de la sección "La partida": tapa, luz violeta, uGlint */ }
    engine.onTick((dt, t) => {
      hold.update(dt, t)
      const h = hold.state.charge
      crack.value = Math.max(h * h * (3 - 2 * h) * 0.95, 0.05 + 0.035 * Math.sin(t * 1.6))
    })
    off = [E.smoothScroll((dt) => engine.frame(dt)), () => hold.dispose(), () => engine.dispose()]
  })()
  return () => { dead = true; off.forEach((f) => f()) }
}, [])
```

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/lithos/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `geode.glb` | Mitad de geoda de amatista con corte plano y cavidad hacia arriba (se usa dos veces, una espejada) | 6.2 MB |
| `quartz.glb` | Racimo de cuarzo transparente | 4.1 MB |
| `pyrite.glb` | Pirita en cubos | 4.3 MB |
| `ammonite.glb` | Amonita fosilizada | 4.6 MB |

Son casi 19 MB en total: carga solo el espécimen visible y el resto a demanda al acercarse la sección.

## Cuándo recomendarlo
- **Encaja:** joyería, minerales, cosmética de lujo con envase que se abre, cualquier producto con un "revelado" (una caja, un huevo, un cofre, una fruta partida), museos y colecciones, experiencias de desbloqueo. La idea "mantén presionado" es más memorable que un botón.
- **No encaja:** productos que no tengan un interior que mostrar, o públicos en móvil con conexiones lentas (cada modelo pesa 4 a 6 MB y el shader es costoso). Tampoco cuando la accesibilidad exige una alternativa: ofrece siempre un botón "Abrir" por teclado además del gesto.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
