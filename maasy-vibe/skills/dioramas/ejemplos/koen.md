# Kōen: un árbol, cuatro estaciones

**Slug:** `koen` · **Interacción:** el scroll y un dial arrastrable giran el año sobre un bonsái de arce: brotes, verano, hojas rojas que caen, nieve · **Estado en Believable:** solo referencia (el efecto vive en un shader de follaje y en un análisis de la malla que son propios de este árbol)

## Qué es
Una landing para un vivero de bonsáis en Saitama. Un arce japonés sobre una losa, luz de papel washi. El scroll avanza el año: primavera con hojas lima y pétalos, verano profundo y con bruma, otoño con la copa carmesí y hojas cayendo sobre el musgo, invierno con ramas desnudas y nieve. Un dial de tinta con 24 marcas (los 24 términos solares japoneses) permite girar el año a mano. Pasar el cursor sobre el árbol despierta la brisa; tocarlo lo sacude.

## Brief original (resumen fiel)
- **Marca:** Kōen, vivero de bonsáis de Saitama con árboles más viejos que los ferrocarriles del país.
- **Interacción:** un arce japonés (`maple.glb`). El scroll y un dial arrastrable giran el año: primavera (hojas lima y algunos pétalos), verano (verde profundo, bruma), otoño (un remapeo de tono en shader que afecta solo los texels del color del follaje; las hojas caen como partículas instanciadas con giro y se apilan sobre el musgo), invierno (las hojas se disuelven con un umbral de ruido y queda la estructura de ramas; si la malla trae poco bajo el follaje, se finge con follaje escaso y ramitas procedurales; la nieve se acumula en superficies que miran arriba con `normal · up`; nieve cayendo). El color de fondo, la temperatura de la luz, la suavidad de las sombras y las partículas ambientales cambian por estación. Al pasar el cursor, una brisa suave mueve el follaje según la altura.
- **Secciones:** Nav · Hero ("This tree has seen 180 autumns.") · Cuatro estaciones (fija, con rótulos verticales 春 夏 秋 冬) · El vivero (árboles en adopción con edad y precio, desde 380.000 yenes) · El oficio (poda, alambrado, trasplante) · Visita · Footer.
- **Arte:** papel washi `#f1ece2`, tinta sumi, acentos estacionales (otoño `#d2553b`). "Noto Serif JP" + "Cormorant Garamond". Divisores de pincel en SVG. Muy contenido, meditativo.
- **Debe ser verdad:** cuadro de otoño con copa carmesí y hojas cayendo sobre el musgo con luz lateral suave; cuadro de invierno con ramas desnudas y nieve.

## La interacción única
El año es **un solo número**, `season`, que sigue creciendo (no se envuelve) mientras la página da vueltas, con `f = season mod 4`: 0 es mitad de primavera, 1 mitad de verano, 2 el pico del otoño (anclado al término solar "Sōkō", cuando el arce de Saitama está más rojo), 3 el invierno profundo. Todo lo demás es función de `f`:
- `treeState(season)` devuelve cuánto follaje queda (`cover`), cuánto ha virado (`autumn`), el lima fresco (`fresh`), la nieve (`snow`) y el oscurecimiento de pleno verano (`deep`), todos con `smoothstep` entre valores de `f`.
- `worldState(season)` interpola cíclicamente cuatro keyframes de mundo (color de pared y piso, niebla, color y altura de la luz principal, suavidad de sombra, hemisférica, acento y tinta) y calcula las partículas (`petals`, `motes`, `snowfall`, `leafRate`).
- El dial convierte el ángulo del puntero en `f` (0 arriba, en sentido horario) y toma el camino corto entre estaciones; mientras lo arrastras manda sobre el scroll hasta que el scroll se mueve más de 40 % de la pantalla.

## Cómo se implementa
**1. Analizar la malla una vez.** `analyze(mesh)` (siembra `Math.random` para que sea idéntico en cada carga) lee los píxeles de la textura y puntúa cada vértice como "verde" (`greenScore`), saca un atributo por vértice `aFol` (cuánto es hoja, para el vaivén), toma 42.000 muestras de la superficie con `MeshSurfaceSampler`, calcula perfil radial para encontrar el borde de la maceta y el tronco, y la altura de la copa (`folY0`, `folY1`). Sin esto el shader no sabe qué es hoja y qué es corteza.

**2. Shader de follaje (`onBeforeCompile` en `map_fragment`).** El corazón. Se detecta follaje por tono, saturación y valor del color de la textura (`kFoliage`: tono entre 0.13 y 0.5, saturación mínima, por encima de `uFolY0`) y se excluye el tronco con una distancia a su línea central (`kTrunkGuard`). Dentro del follaje la textura aporta solo luz y sombra; el color sale de paletas dirigidas:

```glsl
vec3 green  = mix(late, spring, uFresh);   green = mix(green, summer, uDeep);
float turnAt = clamp(n1 * 0.7 + n2 * 0.3 - (vWPos.y - uFolY1) * 0.18, 0., 1.);   // cada zona vira a su hora, copa y puntas primero
float turned = smoothstep(turnAt - 0.18, turnAt + 0.18, uAutumn * 1.4 - 0.2);
vec3 leaf = mix(green, aut, turned);        // aut = mezcla de naranja, escarlata, carmesí y vino según ruido y altura
```

La caída se hace con un umbral de ruido: `dn = kDrop(vWPos)` (ruido de dos octavas) contra `uCover`; las hojas con `dn > uCover` se descartan con `discard`, y las que están por caer se resecan a marrón. La misma regla va en un `customDepthMaterial` para que las sombras también pierdan las hojas.

**3. Nieve.** En el mismo fragmento: `sn = smoothstep(0.45, 0.85, up + ruido)` con `up = normal.y` (invertido si es cara trasera), mezclando hacia `uSnowCol` y bajando la rugosidad. Solo sobre superficies que miran arriba y por encima de la maceta.

**4. Ramas de invierno.** La malla no trae estructura bajo el follaje, así que `growBranches` hace crecer ramas con colonización del espacio (150 atractores dentro de cada "almohadilla" de follaje) y las convierte en tubos (`tube`, `tubeR`). Con `uCover < 0.35` se descarta el follaje de la copa para dejar ver esas ramas. Esta es la parte más específica del árbol: otro modelo necesita su propio análisis.

**5. Brisa y sacudida (vertex shader).** `kSway`: el desplazamiento crece con la altura al cuadrado (`bend = hh * hh`), usa dos senos desfasados por posición (`ph = dot(wp, vec3(2.1, 1.3, 1.7))`) y un aleteo rápido multiplicado por `aFol`, de modo que solo las hojas aletean. Pasar el cursor sube `uBreeze` (de 0.16 a 0.86) y la velocidad del puntero suma ráfagas; un click da `uShake` con decaimiento `exp(-3.4 t) * sin(19 t)` y suelta hojas.

**6. Hojas y pétalos que caen.** La clase `Fall` es un `InstancedBufferGeometry` de tarjetas con una cuadrícula 3x3 ligeramente curvada (para que parezcan hojas y no pegatinas) y un atlas 2x2 dibujado en canvas (arce de 7 lóbulos, de 5, pétalo de cerezo, sámara). Cada instancia lleva inicio, destino y tiempos; el vertex shader calcula posición y giro de vuelo, y al aterrizar la tarjeta se queda. `spawn()` resuelve dónde cae y apila: cada hoja sobre otra sube 0.0035 unidades de escena, hasta 6 niveles. `Drift` hace lo mismo con `Points` para la nieve y las motas de verano. Cuando llega la primavera, `clearLanded` hace desaparecer las hojas del suelo.

**Si el cliente pide solo "el árbol cambia con el scroll".** No hace falta todo lo anterior. Carga el GLB con `loadGltf`, normalízalo con `normalize`, y parchea su material con `onBeforeCompile` para remapear los texels verdes (`g - r` alto) hacia rojos con una variable `uAutumn` que sube con el progreso del scroll; mueve el color de fondo, la luz y la niebla con un arreglo de cuatro keyframes interpolados como `worldState`. Eso da primavera, verano y otoño. Invierno con ramas desnudas y nieve de verdad sí exige los pasos 1, 3 y 4: avísale a la persona que es trabajo grande y parte de `examples/koen/{tree,seasons,particles,dial}.js` del repo original.

**El dial (HTML).** Un SVG con anillo, 24 marcas, un hilo de tinta y una cuenta; usa `setPointerCapture` y emite el ángulo en estaciones (0 a 4). Las flechas del teclado avanzan 1/6 de estación (un término solar). La tinta tiene un `feTurbulence` + `feDisplacementMap` para que el anillo parezca pincelado. Es la parte más fácil de copiar: ~5 KB de HTML y JS sin three.

## Modelos
Todos con `https://files.believe-global.com/believable/dioramas/v1/koen/` por delante.

| Archivo | Qué es | Tamaño |
|---|---|---|
| `maple.glb` | Arce japonés bonsái con maceta | 3.6 MB |
| `maple2.glb` | Segunda versión, más detallada (la que carga el original por defecto) | 7.9 MB |

## Cuándo recomendarlo
- **Encaja:** viveros, jardinería, paisajismo, hoteles o restaurantes con relato estacional, marcas que cambian con el año (moda por temporada, menús, turismo por temporadas), cualquier producto cuya historia sea el paso del tiempo.
- **No encaja:** marcas sin ciclo temporal, o cuando no hay un árbol u objeto vegetal cuyos tonos se puedan aislar por color. El efecto depende de que el follaje tenga un tono claramente verde en la textura. Para móvil, la pila de partículas y el shader son pesados: baja el conteo de `Fall`.

## Créditos
Código: Dioramas (github.com/blendi-remade/dioramas), MIT, Copyright (c) 2026 Blendi. Modelo 3D: Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0 (crédito visible en la página).
