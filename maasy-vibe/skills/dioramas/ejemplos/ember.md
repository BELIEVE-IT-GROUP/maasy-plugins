# Hammer & Ember: calienta la hoja, golpea el acero
**Slug:** `ember` · **Interacción:** el scroll calienta el acero (emisión de cuerpo negro), el clic golpea con un martillo y lanza chispas, mantener presionado activa el fuelle · **Estado en Believable:** solo referencia (la interacción depende de una espada y un yunque concretos; los patrones sí se reusan)

## Qué es
Landing de un atelier ficticio de dos personas que forja espadas de acero damasco por encargo. Una forja oscura con carbones encendidos, la espada sobre el yunque y el martillo a mano. Debe sentirse pesada, caliente y ruidosa incluso en silencio.

## Brief original (resumen fiel)
- **Marca:** Hammer & Ember. Titular: "Every blade is folded 512 times. None are made twice."
- **El scroll calienta el acero:** se parchea el material de la espada con `onBeforeCompile` para sumar emisión de cuerpo negro. El calor avanza desde la punta hacia la guarda con bordes rotos por ruido: rojo apagado, cereza, naranja, amarillo-blanco, con emisión HDR para que el bloom la agarre. Más distorsión de aire caliente en pantalla sobre la zona caliente y escamas brillantes.
- **Clic para golpear:** el martillo (`hammer.glb`) cae sobre el punto caliente (anticipación y golpe), estalla un chorro de chispas en GPU (cientos, estiradas por la velocidad, con gravedad, rebote en el piso y color que se enfría), sacudida de cámara, destello de luz en las paredes y un "clang" metálico sintetizado (WebAudio, opcional). Contador "folds: 3/512".
- **Mantener presionado:** fuelle. Los carbones brillan más, las brasas suben, el calor se propaga más rápido.
- **Final del scroll:** el temple. Vapor, el calor se apaga y la hoja ya fría muestra su patrón de damasco.
- **Escena:** fragua de piedra y ladrillo con carbones emisivos animados por ruido, luces naranjas parpadeantes (una proyecta sombra), herramientas en la pared con luz de contorno, brasas siempre subiendo, piso de hollín.
- **Secciones:** Nav, Hero, El proceso (Plegar, Forjar, Temple, Pulido, cada una un estado de cámara), El acero (capas, carbono, dureza HRC 58 a 60), Encargos (desde 4.800 EUR), Testimonios, Footer.
- **Arte:** negro hollín, naranja fundido `#ff6a1f`, blanco hueso. Tipografías condensada (Oswald o Bebas Neue) y Crimson Pro. Grano y resplandor.
- **Debe cumplirse:** un cuadro a mitad de scroll con la hoja naranja-blanca sobre el yunque y chispas en el aire.

## La interacción única
Tres gestos en un mismo puntero: scroll = temperatura, toque corto = golpe, mantener 280 ms = fuelle. La espada es una sola malla con una sola textura, así que el original calcula un **marco de hoja** por vértice (atributo `blade`: `u` de la punta a la guarda, `v` de filo a filo) con análisis de componentes principales (`analyseSword`) para poder hablar de "avance del calor" en términos de la hoja y no del mundo.

## Cómo se implementa
1. **Marco de la hoja.** Se calcula el eje principal de los vértices (iteración de potencia sobre la matriz de covarianza), se proyecta cada vértice y se normaliza a `u` 0..1. Una versión mínima sirve para cualquier objeto largo: eje mayor del bbox local y `u = (p.x - tip) / length`.
2. **Cuerpo negro.** Una rampa por temperatura en Kelvin (el original la vive en `glsl.js`):

```glsl
vec3 blackbody(float K){
  float t = K / 100.0;
  float g = clamp((99.4708025861 * log(max(t, 1.0)) - 161.1195681661) / 255.0, 0.0, 1.0);
  float b = t <= 19.0 ? 0.0 : clamp((138.5177312231 * log(t - 10.0) - 305.0447927307) / 255.0, 0.0, 1.0);
  vec3 c = pow(vec3(1.0, g, b), vec3(2.2));
  c.g += smoothstep(1250.0, 1750.0, K) * 0.16;   // el ojo lee el acero más caliente como amarillo-blanco
  c.b += smoothstep(1450.0, 1850.0, K) * 0.07;
  return c;
}
float glowPower(float K){ float x = max(K - 720.0, 0.0) / 930.0; return pow(x, 2.6); }
```

3. **Parche del material** (resumen de `heatMaterial`, a insertar tras `#include <map_fragment>` y `<emissivemap_fragment>`): `d = vBlade.x + ruido * 0.075`; `prof = 1 - smoothstep(uFront - 0.3, uFront + 0.035, d)` (el frente de calor); `heat01 = uPeak * prof * gradiente`; `K = 520 + heat01 * 1080`; y `totalEmissiveRadiance += blackbody(K) * glowPower(K) * uGlow`. El golpe suma un destello local (`uStrike`), el temple es un frente frío que sube desde la punta (`uCool`) y el damasco se revela con otro frente (`uDam`) que cambia albedo, rugosidad y metal. Las escamas negras de forja tienen grietas que brillan y "reventones" de partículas sueltas.
4. **Scroll a temperatura:** cada sección define `front` y `peak` (de 0,42/0,7 en el hero a 1,06/1,0 al final) y los uniformes se suavizan con `damp`. La cámara, la pose de la espada y el punto de foco salen del mismo diccionario de estaciones (`ST`).
5. **Martillo:** una máquina de estados (`rest`, `grab`, `raised`, `swing` 0,11 s con curva `ease.in`, `recoil`, `hover`, `return`) con poses interpoladas; el impacto llama a `impact(p)`.
6. **Impacto:** `sparks.burst(p, { count: 50 + h * 190, flakes: 14 + h * 46, power })` con `h` la temperatura del punto golpeado; sacudida (`shake = 1`), luz puntual que cae con `gsap.fromTo(flash, { intensity: 6 + h * 10 }, { intensity: 0, duration: 0.5, ease: 'expo.out' })`, destello CSS en la posición proyectada y `audio.clang(power, h)`.
7. **Chispas en GPU:** un `InstancedBufferGeometry` de cuadrados estirados (atributos `aO` origen, `aV` velocidad, `aT` tiempo/vida/semilla/tipo). La posición se calcula **analíticamente** en el vertex shader con arrastre `k`: `v = (v0 - vt) * exp(-k t) + vt`, `p = p0 + (v0 - vt) * (1 - exp(-k t)) / k + vt * t`, con `vt = (0, -9.8 / k, 0)`. Si cruza el piso, busca por bisección (12 pasos) el instante de contacto y relanza con rebote amortiguado. El color sale de `blackbody(K)` con `K` bajando con la edad. Hasta 2.400 chispas por pool, sin lógica en JS por partícula.
8. **Clang:** seis parciales inarmónicos sobre `f0 = 540 a 600 Hz` (relaciones 1, 2,76, 5,4, 8,93, 13,34 y 1,51), cada uno con su caída, más un golpe grave `140 a 48 Hz` en 0,18 s. El acero caliente amortigua el timbre (`damp = 1 - heat * 0.35`).
9. **Entrada:**

```ts
let press: { hold?: boolean } | null = null
let timer = 0
addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || (e.target as HTMLElement).closest('a,button,input')) return
  press = {}
  hammer.grab()                                   // en táctil espera un toque limpio
  timer = window.setTimeout(() => { if (press) { press.hold = true; hammer.cancel(); setBellows(true) } }, 280)
})
addEventListener('pointerup', () => {
  clearTimeout(timer)
  if (press?.hold) setBellows(false); else hammer.release()
  press = null
})
```

10. **Aire caliente:** efecto de postproceso (`HeatHaze`) que distorsiona UV en puntos proyectados a pantalla sobre la zona caliente y en el golpe (onda de choque).

Piezas del motor de Believable que ayudan: `fbmTexture` (`dioramas-textures.ts`) para el ruido de vapor y carbones; `VolumetricSpotPass` si quieres un haz de humo; `PlanarReflection` no se usa aquí.

## Modelos
| Archivo | URL R2 | Qué es | Tamaño aprox. |
|---|---|---|---|
| `sword.glb` | `https://files.believe-global.com/believable/dioramas/v1/ember/sword.glb` | Espada vikinga, un mesh, un material (la hoja se identifica con el marco `blade`) | 2,6 MB |
| `anvil.glb` | `https://files.believe-global.com/believable/dioramas/v1/ember/anvil.glb` | Yunque donde reposa la espada | 4,0 MB |
| `hammer.glb` | `https://files.believe-global.com/believable/dioramas/v1/ember/hammer.glb` | Martillo de forja que golpea | 3,0 MB |

## Cuándo recomendarlo
- **Sí:** oficios, forja, cuchillería, joyería, cocina de fuego, whisky y destilados, cerámica, cualquier marca donde el material y el calor son la historia; productos que se "fabrican" con la mano.
- **No:** marcas digitales abstractas, servicios, páginas de lectura larga. El golpe y el calor funcionan solo si hay un objeto con un eje largo que se pueda calentar de un extremo a otro.
- Mantén el sonido apagado hasta el primer clic y ofrece interruptor. Con `prefers-reduced-motion`, deja la hoja en un estado fijo (naranja, sin chispas).

## Créditos
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Código de referencia: `examples/ember` (MIT, Copyright (c) 2026 Blendi).
