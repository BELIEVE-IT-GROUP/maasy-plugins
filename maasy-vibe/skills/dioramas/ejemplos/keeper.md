# The Keeper: sostén la luz contra la tormenta

**Slug:** `keeper` · **Interacción:** el cursor toma el haz giratorio de un faro en plena tormenta; si lo mantienes 2 segundos sobre un barco perdido, lo guías a puerto · **Estado en Believable:** solo referencia (océano, lluvia, haces y barco son sistemas propios del ejemplo, y el haz depende del pase volumétrico del motor)

## Qué es
Un hotel de cuatro habitaciones dentro de un faro, sobre una roca en el Atlántico Norte. Es de noche y hay tormenta: mar violento con espuma, lluvia empujada por el viento, rayos que iluminan la escena unos cuadros, nubes bajas. El haz doble del faro gira y se ve en la lluvia. Al mover el puntero, el haz deja de girar solo y apunta adonde miras. Un barco pesquero se pierde en el oleaje: si lo iluminas dos segundos, "ve la luz" y navega a puerto, y sube el contador "Boats guided home". El scroll lleva la noche al amanecer: para la lluvia, se calman las olas, se abren las nubes y todo se tiñe de rosa.

## Brief original (resumen fiel)
- **Marca:** The Keeper, hotel de cuatro habitaciones en un faro sobre una roca del Atlántico Norte.
- **Escena:** `lighthouse.glb` sobre su roca en un mar violento. Océano de olas Gerstner (varias, espuma en crestas y alrededor de la roca, subsuperficie verde en el dorso de las olas, reflejos), lluvia en rayas movida por el viento, rayos que blanquean la escena unos cuadros, nubes bajas veloces. El haz de la lámpara gira (gemelo, muy visible en la lluvia).
- **Interacción:** el cursor toma el haz y lo apunta. `boat.glb` está perdido en el oleaje; mantener el haz sobre él 2 s lo "guía a casa" y navega hacia el puerto (recompensa y contador). El scroll mueve la noche hacia el amanecer.
- **Secciones:** Nav · Hero ("Four rooms. One light. No one else for nine miles.") · La tormenta (la interacción) · Las habitaciones (Lamp Room, Keeper's Quarters, Fog Signal, Watch) · La travesía (transfer en bote según el clima) · Amanecer (tarifas desde £420) · Footer.
- **Arte:** azul negro de tormenta, haz amarillo sodio `#ffd27a`, espuma blanca; rosas de amanecer al final. "Libre Caslon Display" y "Karla".
- **Debe ser verdad:** cuadro de tormenta con el haz cortando la lluvia sobre olas con espuma alrededor de la roca; cuadro de amanecer con mar en calma y luz rosa.

## La interacción única
Dos ideas se apilan. **Control del haz:** el haz tiene un giro automático (periodo 14 s); mientras el puntero se mueve, un factor `control` sube a 1 y el haz persigue la dirección hacia el cursor (sale del rayo cámara-puntero cortado contra el mar; la mitad del par más cercana al cursor lo toma). Si dejas de mover 2.6 s (3.6 en táctil), `control` vuelve a 0 y el haz retoma su giro con inercia. **Juego del barco:** el barco deriva con el viento; si el producto punto entre la dirección lámpara-barco y alguno de los dos haces supera `cos(1.25 * cono exterior)`, un contador `hold` sube; fuera del haz baja a 0.8 de velocidad. Con `hold >= 2` el barco pasa a `guided` y navega hacia el puerto.

## Cómo se implementa
**1. Océano Gerstner, GPU y CPU con la misma función.** Seis olas (dirección, longitud de onda, empinamiento en tormenta y en amanecer). Una malla polar centrada en la roca: densa cerca, estirada hasta el horizonte. El vertex shader desplaza cada punto con las olas; el barco necesita la misma altura en CPU, así que `Waves` evalúa lo mismo:

```ts
// onda i: f = k * dot(dir, p) - omega * t ; a = steep/k * atenuación
dx += dir.x * a * Math.cos(f)
dz += dir.y * a * Math.cos(f)
dy += a * Math.sin(f)           // altura. Para height(x,z) se invierte el desplazamiento horizontal con 3 pasos de punto fijo.
```

La atenuación `rockAtt` (0.28 cerca de la roca, 1 lejos) calma las olas pegadas al faro. Las olas cortas se desvanecen con la distancia para que el horizonte no haga aliasing. La normal y el jacobiano son analíticos; **la espuma sale del jacobiano** (donde la superficie se pliega). `setStorm(s)` interpola el empinamiento entre tormenta y amanecer.

**2. Atmósfera por dos escalares.** `storm` (1 a 0) y `dawn` (0 a 1) se interpolan por scroll entre planos de cámara y alimentan todo: colores del cielo y de la niebla por rampas, cobertura de nubes, intensidad de la luna que se vuelve sol, luces hemisféricas, cantidad de lluvia (`smooth(0.32, 0.8, storm)`), densidad del haz. Un solo valor de historia (`story`, 0 a 8) mapea el scroll a los planos con una lista de paradas.

**3. Lluvia.** 42 000 instancias de quads orientados a la cámara dentro de una caja que sigue a la cámara; cada gota tiene semilla propia, cae con velocidad `(11, -30, 4)` y **solo brilla donde la luz la toca** (función `beamLight` en el shader: cono de cada haz con atenuación, más un halo cercano a la lámpara). Por eso la lluvia "dibuja" el haz.

**4. Haces.** El original los hace como efecto de postproceso (`BeamEffect`): cada rayo de vista se intersecta analíticamente con los dos conos y se muestrea solo dentro; fase de Henyey-Greenstein para que el haz arda al girar hacia ti; la densidad la modulan la lluvia y la niebla. En Believable el equivalente es `VolumetricSpotPass` de `dioramas-volumetric.ts` con un `SpotLight` por haz. Además se usan dos `SpotLight` reales que iluminan el barco, la espuma y la roca al pasar.

**5. Apuntar el haz:**

```ts
ray.setFromCamera(ndc, camera)
const t = -ray.ray.origin.y / ray.ray.direction.y                  // corta con el mar
target.copy(ray.ray.origin).addScaledVector(ray.ray.direction, t)  // y lo aleja 9 u del faro
beam.tYaw = Math.atan2(target.x - LAMP.x, target.z - LAMP.z)
beam.tPitch = clamp(Math.atan2(target.y - LAMP.y, hypot(dx, dz)), -0.85, 0.14)
beam.control = damp(beam.control, moviendo ? 1 : 0, moviendo ? 7 : 1.6, dt)
// cerca del barco hay un imán: el objetivo se desplaza hacia él
```

**6. Barco.** Estados `hidden → lost → guided` (más `ferry` en la sección de la travesía, movido por scroll). Flota muestreando la altura de las olas en proa, popa y ambas bandas (promedio para la altura, diferencias para cabeceo y balanceo). Perdido, parpadea con una luz de mástil y lanza bengalas rojas cada ~9 s; guiado, enciende luces, deja estela y acelera hacia el puerto.

**7. Rayos.** Un `DirectionalLight` azulado cuya intensidad se dispara unos cuadros (los rayos se espacian al azar), una malla de rayo fractal, y un destello de pantalla.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/keeper/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `lighthouse.glb` | Faro sobre su roca (se escala a 14 unidades de alto; el eje de la torre y la altura de la lámpara están medidos a mano) | 7.1 MB |
| `boat.glb` | Barco pesquero | 4.6 MB |

## Cuándo recomendarlo
- **Encaja:** hoteles remotos, experiencias de aventura, marcas de seguridad, navegación o rescate, narrativas de "una luz en la oscuridad", lanzamientos con un arco emocional de principio a fin (la noche que amanece resume el scroll).
- **No encaja:** marcas luminosas y amables, páginas informativas densas, gama baja (océano, lluvia de 42 000 instancias y un pase volumétrico a la vez). Si lo portas, baja la lluvia a 20 000 en móvil y deja el mar con menos segmentos.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
