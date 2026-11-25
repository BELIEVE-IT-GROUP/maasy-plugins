# Nightshift Motor Co.: acelera una café racer bajo la lluvia
**Slug:** `racer` · **Interacción:** mantener presionado acelera (RPM, sonido de motor, vibración, faro y neón reaccionan) · **Estado en Believable:** solo referencia (el acelerador encaja parcialmente con `hold-power`, ver abajo)

## Qué es
Landing de un taller ficticio de motos a medida (doce café racers al año). Medianoche, lluvia, la moto bajo un letrero de neón sobre asfalto mojado. La página entera es atmósfera: reflejos, lluvia, haz del faro, y un motor que responde.

## Brief original (resumen fiel)
- **Marca:** Nightshift Motor Co. Titular: "Twelve bikes a year. This is number seven."
- **Escena:** moto (`bike.glb`) bajo un letrero de neón parpadeante sobre asfalto mojado con reflejo plano (PlanarReflection con distorsión de normales por ondas de lluvia, charcos). El casco (`helmet.glb`) reposa sobre una caja o el asiento. Un tubo fluorescente frío en la pared hace de contraluz del neón.
- **Hold to rev:** el RPM sube en un tacómetro grande, suena un motor bicilíndrico sintetizado (opcional, con botón de silencio), la moto vibra, hay calor distorsionando el aire en el escape, el faro se enciende con haz volumétrico a través de la lluvia, el neón zumba más fuerte. Al soltar hay petardeos de desaceleración.
- **Scroll:** la cámara orbita la moto y luego va a detalles macro (tanque, aletas del motor, asiento de cuero) con profundidad de campo.
- **Secciones:** Nav, Hero, Rev (interacción), La construcción (tanque, motor, asiento, ruedas con cifras), Lista de espera (cupos 2027, depósito de 5.000 EUR), El garaje, Footer.
- **Arte:** negro mojado, neón rojo magenta `#ff3b5c`, latón. Tipografías Anton, Inter y una script de neón. Referencia: Blade Runner con contención.
- **Debe cumplirse:** hero con la moto brillando con reflejos de neón sobre asfalto mojado, rayas de lluvia y haz del faro, como un still de comercial de autos.

## La interacción única
Mantener presionado (puntero en cualquier parte que no sea un elemento interactivo, el botón `.rev-btn`, o la barra espaciadora) pone el acelerador en 1. El original ignora el toque en pantallas táctiles fuera del botón, para no pelear con el scroll. Constantes: `IDLE = 1100`, `RED = 8500` RPM.
- Acelerador con inercia: `rev.throttle = damp(rev.throttle, held ? 1 : 0, held ? 16 : 11, dt)`.
- El RPM se integra con aceleración que depende del propio RPM (más fuerte a media banda) y un arrastre que crece al soltar (`acc -= (rpm - IDLE) * (held ? 0.28 : 2.2)`). Al tocar `RED` rebota con un limitador de 0,12 s.
- `rev.rn = clamp((rpm - IDLE) / (RED - IDLE))` alimenta todo lo demás: vibración de la moto (`amp = 0.0005 * (1 - rn) + rn * 0.0024`), temblor de cámara, voltaje del faro (`0.72 + rn * 0.38`), brillo y zumbido del neón, calor del escape y la distorsión del aire.
- Al soltar con más de 3.200 RPM, durante 1,6 s hay petardeos aleatorios (`popFlash`: llama en el escape, luz puntual y ruido).

## Cómo se implementa (lo que se reaprovecha)
**¿Encaja `hold-power`?** Solo en parte. Sirve para la entrada (mantener puntero o espacio) y para obtener un acelerador suavizado 0..1 que reparte a luces y vibración. No sirve tal cual para el RPM: el original no "queda encendido", integra un RPM con inercia propia, y su sonido es un motor, no un zumbido de carga. Receta:

```ts
const { createHoldPower } = await import('./hold-power')
const rev = createHoldPower(ctx, {
  target: bike,
  latch: false,            // no queda encendido: sube y baja como un acelerador
  holdSeconds: 0.7,        // tiempo a fondo
  decaySeconds: 1.6,       // tiempo al soltar
  glow: 'all', intensity: 0.8, glowColor: 0xff3b5c, // opcional: tinte del neón sobre la moto
  lights: [headlight],     // el faro sube con el acelerador
  shake: 1.5,              // px de temblor de vista
  trigger: revButton,      // un botón dedicado; en táctil no uses el lienzo
  sound: false             // el sonido del motor es propio (abajo)
})
engine.onTick((dt, t) => {
  rev.update(dt, t)
  const rn = rev.state.charge
  const rpm = 1100 + rn * (8500 - 1100)      // aproximación; el original integra el RPM
  engine2.update(rpm, rev.state.holding)      // tu motor de audio
})
```

Lo que NO viene en `hold-power` y hay que escribir (todo en `examples/racer/`):
1. **Motor de audio** (`audio.js`, ~250 líneas, WebAudio, solo tras un gesto): una `PeriodicWave` de un ciclo de 720 grados con dos pulsos de escape a 0 y 270 grados (la separación desigual es lo que hace "galopar" al bicilíndrico), modulada en amplitud sobre ruido pasabanda, pasada por un `WaveShaper` con `tanh`, un pasabajos que se abre con el RPM, picos de resonancia a 110 y 460 Hz, y una ráfaga de ruido para la admisión con acelerador. La frecuencia del oscilador es `rpm / 120`. Más un bucle de lluvia pregenerado en estéreo (ruido rosa + gotas) y un zumbido de 100 Hz del transformador del neón.
2. **Tacómetro** (`tacho.js`): SVG con arco de 260 grados (de -130 a +130), marcas cada 0,25 mil RPM, zona roja desde 8.500 y una aguja con masa y rebote. Se actualiza con `tacho.update(rpm, dt, limiterActive)`.
3. **Reflejo mojado:** `PlanarReflection` (`dioramas-reflector.ts`) con una normal de ondas animada; charcos como zonas con rugosidad baja.
4. **Haz del faro y neón:** `SpotLight` colocado en el faro de la moto más `VolumetricSpotPass` (`dioramas-volumetric.ts`); el neón son `MeshBasicMaterial` con color por encima de 1 para que el bloom los coja, con un letrero que "falla" (`neon.letter`) y se cae un 45 % al exigir al motor (`sag`).
5. **Aire caliente:** efecto de postproceso que distorsiona UV alrededor de dos puntos proyectados a pantalla (punta del escape y bajos de la moto), con intensidad `0.18 + heat * 1.1 + throttle * 0.4`.
6. **Cámara en estaciones** que orbitan un punto de interés (`poi`, `az`, `el`, `dist`, `fov`) con profundidad de campo (`bokeh`, `range`) distinta por sección; las estaciones macro usan `local: true` para seguir la moto.

Vibración mínima de la moto (adaptada a TS):

```ts
const lope = Math.sin(t * 2 * Math.PI * 4.6) * (Math.sin(t * 2 * Math.PI * 9.2 + 0.7) > 0 ? 1 : 0.4)
const amp = 0.0005 * (1 - rn) + rn * 0.0024
bike.position.set((Math.random() - 0.5) * amp * 0.6, lope * amp * 0.5 + (Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp * 0.5)
bike.rotation.z = throttle * 0.006 + (Math.random() - 0.5) * amp * 0.8
```

## Modelos
| Archivo | URL R2 | Qué es | Tamaño aprox. |
|---|---|---|---|
| `bike.glb` | `https://files.believe-global.com/believable/dioramas/v1/racer/bike.glb` | Café racer completa (2,05 unidades de largo en el original). Un mesh, un material | 7,9 MB |
| `helmet.glb` | `https://files.believe-global.com/believable/dioramas/v1/racer/helmet.glb` | Casco que reposa sobre la caja o el asiento | 3,3 MB |

## Cuándo recomendarlo
- **Sí:** vehículos, motos, autos, audio de alta gama, equipos con motor; marcas nocturnas y de culto, talleres de lujo; cualquier objeto cuyo "sonido" o "pulso" sea parte del producto.
- **No:** marcas luminosas o de servicios, y páginas donde el sonido sea un problema (ofrece siempre el interruptor). Es de las más pesadas: reflejo plano, volumétrico, profundidad de campo y lluvia juntos exigen GPU media-alta; en móvil baja el DPR a 1,25 y apaga el volumétrico.
- Si solo necesitas el "mantén presionado para encender", usa `hangar` (`hold-power` directo).

## Créditos
Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0. Código de referencia: `examples/racer` (MIT, Copyright (c) 2026 Blendi).
