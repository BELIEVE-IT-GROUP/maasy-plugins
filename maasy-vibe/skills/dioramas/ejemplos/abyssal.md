# Abyssal: desciende once mil metros

**Slug:** `abyssal` · **Interacción:** el scroll es el descenso (el mar cambia con la profundidad) y desde los 750 m el cursor dirige los focos del submarino; moverlo rápido deja una estela de plancton bioluminiscente · **Estado en Believable:** solo referencia (escena larga con cinco zonas, vida procedural y mucha coreografía; no es un gesto aislable)

## Qué es
Una casa privada de expediciones al fondo del océano: tres huéspedes por inmersión, hasta el Abismo Challenger en el sumergible *Pelagia*. La página entera es una bajada. Un indicador de profundidad fijo cuenta de 0 a 10 935 m con números que ruedan como un instrumento. En la superficie hay turquesa brillante con cáusticas que bailan sobre todo y rayos de luz desde arriba; a 200 m el azul del crepúsculo; a 1 000 m, negro. Los rojos y naranjas se apagan primero. Desde los 800 m los focos del submarino son la única luz y tú los diriges con el cursor: buscas en la oscuridad.

## Brief original (resumen fiel)
- **Marca:** Abyssal, casa de expediciones oceánicas profundas; 3 huéspedes por inmersión en el submarino *Pelagia*.
- **Interacción:** el scroll ES el descenso. Medidor fijo 0 a 10 935 m. El océano cambia físicamente con la profundidad: superficie turquesa con cáusticas animadas y rayos de luz; 200 m azul de crepúsculo; 1 000 m negro; tinte de materiales y niebla por profundidad. Desde ~800 m los focos (2 a 3 haces volumétricos) son la única luz y **el cursor los dirige**. Mover el cursor rápido deja una estela de plancton bioluminiscente (partículas aditivas a lo largo del rayo del puntero que destellan cian y se apagan).
- **Escena:** el submarino (`sub.glb`) desciende con la cámara, encuadrado descentrado, girando lento, luces encendidas. Zonas, cada una una sección con texto: Luz solar 0 a 200 m (nautilo `nautilus.glb` a la deriva); Crepúsculo 200 a 1 000 m (medusas procedurales: campana translúcida con shader y tentáculos de líneas, pulsando); Medianoche 1 000 a 4 000 m (pez abisal `angler.glb` emerge de la oscuridad; el señuelo es un bulbo emisivo con una luz puntual; se gira hacia el haz); Abismo 4 000 a 6 000 m (chimenea hidrotermal `vent.glb` en el fondo con calima, partículas minerales ascendentes y brillo cálido); Hadal 6 000 a 10 935 m (suelo de fosa: sedimento y una baliza). Nieve marina: miles de partículas que suben relativas a la cámara (velocidad = velocidad de scroll). Color y densidad de niebla por profundidad; el fondo aparece al final.
- **Secciones:** Nav · Hero ("The last unexplored place on Earth is 11 km down") · las 5 zonas (rango, temperatura, presión en atm, qué verás) · el *Pelagia* con 3 o 4 hotspots proyectados desde el submarino 3D (esfera de titanio, 16 h de soporte vital...) · precios y fechas · tripulación y seguridad · Footer ("Surface").
- **Arte:** azul marino a negro absoluto, acentos bioluminiscentes cian `#3fd6c9` y naranja de seguridad del submarino. "Space Grotesk" y "IBM Plex Mono" para lecturas. Panel de instrumentos: reglas finas y números tabulares.
- **Debe ser verdad:** superficie con cáusticas y rayos; medianoche negra salvo haces, pez abisal y señuelo; el cuadro de la chimenea con brillo cálido y calima; medidor legible en todos los cuadros.

## La interacción única
**El scroll no mueve la página, mueve el mundo en vertical.** Una "estación" `s` (0 a 5 más los cierres) viaja con el scroll amortiguado (`damp(sNow, sTarget, 5, dt)`) y de ella salen cámara, submarino, profundidad real, color del agua y qué vida existe. Los focos aparecen a 740 m con un parpadeo de encendido y siguen al puntero con imán: cerca del pez o de la chimenea, el haz se pega al objeto (hace sentir hábil al usuario, no torpe).

## Cómo se implementa
**1. De scroll a profundidad.** La coordenada vertical del mundo es lineal en la estación (`Y = -4 - 14 * s`), pero la profundidad mostrada es por tramos, con más metros entre estaciones al final:

```ts
const DKEYS = [[0,0],[0.5,30],[1,110],[1.5,200],[2,600],[2.5,1000],[3,2400],[3.5,4000],[4,4970],[4.5,6000],[5,10935]]
function depthAt(s: number) { /* interpolación lineal entre claves; s>5 = 10935 */ }
```

**2. Agua por profundidad.** Una rampa de colores por profundidad rellena el fondo y la niebla; la luz se extingue por canal, así que lo rojo muere primero:

```ts
const WATER = [[0,0x2aa5b4],[50,0x178aa3],[140,0x0e6190],[240,0x0a3f73],[450,0x06214b],[700,0x030d24],[1000,0x01040b],[1800,0x000103],[11000,0x000000]]
sun.intensity = 3.4 * Math.exp(-d / 110)
sun.color.setRGB(Math.exp(-d * 0.012), Math.exp(-d * 0.0035), Math.exp(-d * 0.0017))   // R cae más rápido que G y B
hemi.intensity = 1.25 * Math.exp(-d / 330)
scene.fog.density = lerp(0.03, 0.05, smooth(0, 1200, d))
causticsAmount = 2.8 * Math.exp(-d / 42)
```

El entorno cambia por tramos (`envShallow`, `envDeep`, `envFlood`) con su intensidad. Un domo en degradé sigue a la cámara hasta ~2 400 m; la superficie vista desde abajo existe solo bajo ~260 m.

**3. Cáusticas en todo.** Los materiales del submarino y los modelos se parchean con `onBeforeCompile` para recibir un patrón de cáusticas proyectado desde arriba que se desvanece con la profundidad. Rayos de luz: efecto volumétrico (`VolumetricSpotPass` en Believable, ver `dioramas-volumetric.ts`).

**4. Focos dirigidos por el puntero.** Cada frame: rayo cámara-cursor; el punto de mira se suaviza (`aimPoint.lerp(target, 1 - exp(-9 dt))`) y cada foco apunta a ese punto con una separación lateral, con un límite para que el haz no gire por detrás del casco. Sin mover el cursor 4 s el piloto toma el control y barre solo (con ruido senoidal). Sobre el fondo, el haz cae donde apuntas en el sedimento (corte con el plano del suelo); en la última sección los focos miran hacia arriba.

**5. Plancton.** Un `spawner` de 5 000 puntos aditivos con tiempo de nacimiento por punto en un buffer circular. Al mover rápido el cursor (> 1.1 NDC/s) se emiten hasta 40 por frame, interpolados entre la posición anterior y la actual, a 2.2 a 7.5 unidades de distancia sobre el rayo:

```ts
const n = Math.min(40, Math.ceil(speed * 5))
for (let k = 0; k < n; k++) {
  ndc.set(lerp(prev.x, p.x, k / n) + rnd(-0.012, 0.012), lerp(prev.y, p.y, k / n) + rnd(-0.012, 0.012))
  ray.setFromCamera(ndc, camera)
  const q = ray.ray.origin.clone().addScaledVector(ray.ray.direction, rnd(2.2, 7.5))
  plankton.emit(q.x + rnd(-0.16, 0.16), q.y + rnd(-0.16, 0.16), q.z + rnd(-0.16, 0.16), t - rnd(0, dt), bubbles ? 1 : 0)
}
```

Bajo 300 m las partículas son burbujas; más abajo, destellos cian. Además, bajar rápido en la oscuridad enciende plancton sobre el casco.

**6. Vida por zona.** Nieve marina (7 500 puntos que se estiran con la velocidad vertical de la cámara, `uStretch = |camVy| * 0.09`), medusas (campana con shader translúcido, tentáculos de líneas, luz puntual pulsante; visibles entre 80 y 2 600 m), pez abisal (entre 700 y 5 200 m viaja "con" la cámara y se acerca al hundirse; su guiado hacia el haz sube un factor `lit`: gira hacia el submarino cuando lo iluminas), chimenea con luces naranjas y columna de partículas minerales, sedimento y baliza al fondo.

**7. Hotspots.** Puntos del submarino 3D se proyectan a pantalla cada frame para colocar botones DOM; el panel se abre con clic.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/abyssal/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `sub.glb` | Submarino *Pelagia* (esfera de titanio y focos) | 5.8 MB |
| `nautilus.glb` | Nautilo | 3.8 MB |
| `angler.glb` | Pez abisal con señuelo | 4.5 MB |
| `vent.glb` | Chimenea hidrotermal | 6.4 MB |

Son 20.5 MB: carga solo el submarino de entrada y el resto al acercarte a su zona.

## Cuándo recomendarlo
- **Encaja:** expediciones, turismo de aventura, ciencia, marcas con un viaje de exploración, productos que "bajan" por capas de detalle (una oferta de seguridad, una cadena de suministro, un producto de pesca). El scroll como profundidad es una metáfora que cualquiera entiende.
- **No encaja:** páginas con mucho contenido que debe leerse rápido, marcas que necesiten un tono claro y alegre, y móviles de gama baja (partículas, volumétrico y cuatro modelos). Mantén legible el indicador de profundidad en todos los cuadros y ofrece una versión estática con `prefers-reduced-motion`.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
