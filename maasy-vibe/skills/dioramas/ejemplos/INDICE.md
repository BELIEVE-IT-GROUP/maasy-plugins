# Los 20 ejemplos de Dioramas en Believable

Referencias de los 20 sitios de ejemplo de [Dioramas](https://github.com/blendi-remade/dioramas) (código
MIT, modelos CC BY 4.0). Cada archivo cuenta qué es el ejemplo, su brief, la interacción única, cómo se
implementa en este stack, qué modelos usa (en R2) y cuándo recomendarlo. Léelo antes de proponer un
diorama: elige el ejemplo cuya interacción sirve al mensaje de la marca, no el más vistoso.

**Módulo** = la interacción está portada como archivo del pack `believe-dioramas` (se instala en
`src/components/3d/` y se monta sobre el hero con `onScene`). **Solo referencia** = la receta está en el
archivo, pero el código es demasiado específico de su escena para empaquetarlo.

| # | Ejemplo | Interacción | Estado | Referencia |
|---|---|---|---|---|
| 01 | Reliquary | Recorrer un museo a oscuras con una linterna; fotografiar reliquias | solo referencia | [reliquary.md](reliquary.md) |
| 02 | Abyssal | El scroll es una inmersión de 11 km; dirigir los focos del sumergible | solo referencia | [abyssal.md](abyssal.md) |
| 03 | Hammer & Ember | El scroll calienta una hoja de damasco; clic para sacar chispas | solo referencia | [ember.md](ember.md) |
| 04 | Bell & Moss | Limpiar la condensación de una campana de vidrio | módulo `glass-wipe` | [terrarium.md](terrarium.md) |
| 05 | Still Water | Estanque koi con ondas reales; dar de comer a los peces | módulo `koi-pond` | [koi.md](koi.md) |
| 06 | Florae | Partículas que forman flores, cambian de forma y se dispersan con tu brisa | módulo `particle-morph` | [florae.md](florae.md) |
| 07 | Velocity Lab | Lente de rayos X, térmica y CAD que ve dentro de un tenis | módulo `xray-lens` | [velocity.md](velocity.md) |
| 08 | Hangar Nine | Mantener presionado para encender un mecha | módulo `hold-power` | [hangar.md](hangar.md) |
| 09 | Maison Sucre | Física real con pasteles fotorrealistas | solo referencia (rapier, wasm ~4 MB) | [sucre.md](sucre.md) |
| 10 | Monolith | Arrastrar el sol sobre una casa en un acantilado | solo referencia | [monolith.md](monolith.md) |
| 11 | Low Frequency | Tocar y hacer scratch a un vinilo con audio sintetizado | módulo `vinyl-deck` | [lowfreq.md](lowfreq.md) |
| 12 | Gambit | La Partida Inmortal repetida con el scroll, después juego libre | módulo `chess-replay` | [gambit.md](gambit.md) |
| 13 | Atlas of Drifting Isles | Volar entre islas flotantes | solo referencia | [atlas.md](atlas.md) |
| 14 | Lithos | Mantener presionado para partir una geoda | solo referencia (gesto con `hold-power`) | [lithos.md](lithos.md) |
| 15 | Artemis | El scroll hace caminar a un astronauta con esqueleto en la Luna | módulo `rigged-walker` | [artemis.md](artemis.md) |
| 16 | The Keeper | Apuntar el haz de un faro en medio de una tormenta | solo referencia | [keeper.md](keeper.md) |
| 17 | Kōen | Un bonsái a través de las cuatro estaciones | solo referencia | [koen.md](koen.md) |
| 18 | Nocturne | Un frasco de perfume con líquido que se mueve | módulo `liquid-slosh` | [nocturne.md](nocturne.md) |
| 19 | Nightshift Motor Co. | Mantener para acelerar una café racer bajo la lluvia | solo referencia (entrada con `hold-power`) | [racer.md](racer.md) |
| 20 | Aurel Horologie | Desarmar un movimiento de reloj | módulo `exploded-view` | [horologie.md](horologie.md) |

Modelos: `https://files.believe-global.com/believable/dioramas/v1/<slug>/<archivo>.glb` (los mismos de
`public/models/<slug>/` del repo, meshopt + WebP). Crédito obligatorio en el pie de la app: "Modelo 3D:
Dioramas (github.com/blendi-remade/dioramas), CC BY 4.0".

## El motor completo, por props de `DioramaHero`

Todo apagado por defecto (el hero se ve igual que antes si no pasas nada):

| Prop | Qué hace | Costo |
|---|---|---|
| `ao` | Oclusión ambiental GTAO (three/addons; el original usa N8AO) | un render extra de la escena |
| `volumetric` | Foco cenital con haz raymarched y polvo (`{ color, intensity, density }`) | 32 pasos por píxel |
| `reflections` | Piso mojado: reflejo plano desenfocado por rugosidad procedural | un render espejado a media resolución |
| `chromaticAberration` | Aberración cromática radial (0.004 a 0.012) | casi nada |
| `cursor` | Cursor propio; `data-cursor="drag"` y `data-cursor-label` en un elemento cambian su estado | DOM |
| `preloader` | Pantalla de carga con el porcentaje real (`{ label }`) | DOM |
| `nav` | Navegador fijo entre sitios de una colección (`{ worlds, current }`) | DOM |
| `floor={false}` | Sin piso, para módulos que traen su propio suelo (agua, terreno) | |
| `staticCamera` | Cámara fija en el primer plano, con paralaje leve: para escenas que se tocan | |
| `model={null}` | Sin modelo: la escena la llena un módulo | |

Fuera del hero, los mismos módulos sirven sueltos: `dioramas-reflector.ts` (`PlanarReflection`),
`dioramas-volumetric.ts` (`SceneDepthPass`, `VolumetricSpotPass`), `dioramas-textures.ts` (`fbmTexture`,
`fbmNormal`, `bakeTexture`) y `dioramas-ui.ts` (`createCursor`, `magnetic`, `worldNav`, `preloader`).

## Montar un módulo de interacción sobre el hero

```tsx
<DioramaHero
  model={null}
  staticCamera
  onScene={async ({ scene, camera, renderer, canvas, engine }) => {
    const { createVinylDeck } = await import('../components/3d/vinyl-deck')
    const deck = await createVinylDeck({ scene, camera, renderer, canvas }, { size: 1.7 })
    const off = engine.onTick((dt, t) => deck.update(dt, t))
    return () => { off(); deck.dispose() }
  }}
/>
```

El módulo se importa con `import()` dentro de `onScene` (nunca arriba del archivo: el prerender corre en
el servidor). `onScene` puede devolver su limpieza, y el hero la llama al desmontar.

## Incompatibilidades conocidas (medidas)

- `xray-lens` con `ao` o `reflections`: los dos re-renderizan la escena y dibujan el triángulo con que la
  lente se compone (sale un triángulo negro enorme). En una demo con lente, déjalos apagados.
- `koi-pond` necesita `floor={false}`: el agua queda a la altura del piso del hero y se ven franjas.

## Demos publicadas (5 ejemplos con marcas Believe)

| Ejemplo | Marca | Demo | Video |
|---|---|---|---|
| Low Frequency | BeCall | files.believe-global.com/believable/dioramas/ejemplos/lowfreq/ | files.believe-global.com/h/ee76c3d3e578-dioramas-lowfreq-v2.mp4 |
| Hangar Nine | BeAgents | files.believe-global.com/believable/dioramas/ejemplos/hangar/ | files.believe-global.com/h/18f7079121e3-dioramas-hangar.mp4 |
| Aurel Horologie | Believe | files.believe-global.com/believable/dioramas/ejemplos/horologie/ | files.believe-global.com/h/4c30c43c5cf8-dioramas-horologie.mp4 |
| Velocity Lab | Knowhgraphia | files.believe-global.com/believable/dioramas/ejemplos/velocity/ | files.believe-global.com/h/63db0552ad22-dioramas-velocity.mp4 |
| Still Water | BeChat | files.believe-global.com/believable/dioramas/ejemplos/koi/ | files.believe-global.com/h/7c5a780b9187-dioramas-koi.mp4 |
