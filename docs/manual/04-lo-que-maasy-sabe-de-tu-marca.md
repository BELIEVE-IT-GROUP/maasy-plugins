# Lo que Maasy sabe de tu marca

Cuando terminas la entrevista, Maasy no se queda con un resumen. Guarda un ADN de marca completo, con más de 40 campos agrupados en siete partes, y deriva a partir de ellos ocho piezas que ningún dueño de negocio tiene que escribir. Este capítulo dice qué es cada una y para qué sirve. El siguiente explica cómo se vuelve memoria que Claude consulta.

## El ADN, parte por parte

El ADN son tus respuestas, ordenadas. Cada campo tiene un uso concreto: Claude los lee antes de escribir, diseñar o planear algo.

| Parte | Campos | Para qué sirven |
|---|---|---|
| Identidad | Nombre de la marca, web o perfil principal, industria, país objetivo, qué hace el negocio, modelo de negocio, precio principal, precio del upsell, prueba gratis | Que Claude sepa quién eres y qué vendes antes de escribir una línea. El precio solo se guarda si lo dices o aparece en tu web |
| Propuesta de valor | Resultado principal que promete, diferenciador, competidores, miedo principal del cliente, objeción secundaria | La base de todo mensaje: qué ofreces, contra quién y qué frena a quien te compra |
| Cliente ideal | Rol del decisor, rango de edad, región, situación actual, situación deseada, canales | Escribir para una persona concreta, en los canales donde está |
| Voz y tono | Tono, trato, uso de emojis, una frase que suena a la marca, una frase que nunca diría, palabras prohibidas, claims prohibidos | Que los textos suenen a ti. Las palabras y los claims prohibidos se rechazan en código, no solo se piden |
| Identidad visual | Colores de marca, fuente de títulos, fuente de texto, logo, estilo de imagen, cómo aparecen las personas, lo prohibido en lo visual | Piezas, landings y videos con tu aspecto, sin tener que describirlo cada vez |
| Prueba social | Cantidad de clientes o ventas, resultados, testimonios, premios o menciones | Argumentos con respaldo real |
| Preferencias | Idioma de salida, largo del copy, urgencia del llamado a la acción, llamados a la acción aprobados | Cómo quieres que se escriba, y en qué idioma |

Además del ADN, Maasy calcula por su cuenta un sistema de color a partir de tus colores y tus logos, con contraste revisado para que los textos se lean. Eso lo hace el sistema sin intervención de nadie, cada vez que cambias tus colores.

### Ver y editar tu ADN

- `maasy_get_brand_dna` muestra tu ADN agrupado en secciones editables (negocio, oferta, posicionamiento, cliente ideal, voz y prueba social), con cada campo lleno o vacío. Sirve para ver qué falta enriquecer.
- `maasy_update_brand_dna` cambia solo los campos que le pidas. Lo demás queda intacto.
- Los campos que el sistema deriva (como el design system o los ángulos de venta) están protegidos: no se editan a mano, se rehacen.

Dilo en lenguaje normal y Claude usa la herramienta correcta.

```pedido
Muéstrame qué le falta a mi ADN.
Cambia mi diferenciador: ahora vendemos con entrega en 24 horas.
Agrega "gratis" a mis palabras prohibidas.
```

## Las ocho derivaciones

Con tus respuestas obligatorias completas, Claude hace ocho derivaciones, en este orden. Cada una se apoya en las anteriores. Cada una se valida contra una forma fija antes de guardarse, y se guarda con un ticket que la ata a tus respuestas de ese momento.

| # | Derivación | Qué produce |
|---|---|---|
| 1 | Perfiles de cliente ideal | De 3 a 5 perfiles de a quién le vendes, con nombre propio |
| 2 | Ángulos de venta | Entre 5 y 8 ángulos en seis familias: por disparador, por dolor, por objetivo, por etapa del embudo (arriba, medio y abajo), por emoción y universales. Cada uno con su gancho de ejemplo, y los que apuntan a un cliente lo nombran |
| 3 | Pilares de contenido | De 4 a 6 pilares. Cada uno con su categoría (educativo, inspiracional, entretenimiento o promocional), su descripción, entre 3 y 5 temas, notas de tono y ganchos de ejemplo |
| 4 | Perfil de referencias | Lo que tus referencias visuales tienen en común, resumido en un perfil de estilo |
| 5 | Design system | La gramática visual de tu marca: geometría, densidad decorativa, formas de acento, tratamiento de imágenes, uso del color, textura, personalidad tipográfica, bordes e inspiraciones |
| 6 | Biblioteca de ambientes | Cinco ambientes de imagen propios de tu marca: oscuro dramático, cálido de estilo de vida, limpio minimalista, editorial premium y vibrante. Cada uno describe luz, color, lente, composición y textura |
| 7 | Biblioteca de escenas | Cinco escenas de anuncio, una por ambiente, pensadas para tu línea de producto y tu cliente |
| 8 | design.md | Un solo documento con las reglas visuales y de estilo de tu marca (ver más abajo) |

Reglas que conviene conocer:

- **Tú no escribes ángulos ni pilares.** Si quitas algunos, quedan los demás. Los perfiles de cliente, los ángulos y los pilares son las tres derivaciones donde puedes quitar elementos.
- **Palabras y claims prohibidos.** Un ángulo o un pilar que use una palabra o un claim que prohibiste se rechaza.
- **Rederivar.** Si cambias tus respuestas o quieres otra vuelta de una pieza, pídele a Claude que la rehaga. Lo que depende de ella se actualiza y la versión anterior queda guardada: cada pieza conserva hasta 5 para poder deshacer (`maasy_undo_derivation`).
- Las bibliotecas de ambientes y escenas se escriben en inglés, porque las lee un generador de imágenes, aunque tu marca hable otro idioma.

## Referencias de marca y Anti-Look Maasy

Las referencias son marcas, piezas o imágenes que te gustan. Las subes en la parte visual de la entrevista.

1. Claude mira cada imagen y describe su estilo.
2. Maasy junta esas lecturas en un perfil de referencias de tu marca.
3. De ese perfil se derivan el design system, la biblioteca de ambientes y la de escenas.

Esa cadena se llama **Anti-Look Maasy**. En la web de Maasy tiene su propio panel. Su función es que tus piezas hereden un criterio visual propio, construido con lo que tú elegiste, y no el de una plantilla.

## El design.md

El design.md es un documento único y autocontenido que describe el sistema de diseño de tu marca. Lo leen las herramientas que crean cosas: Claude, Maasy Vibe, Maasy Motion y cualquier plugin. Empieza con los datos estructurados (colores con su nombre y su valor, tipografías, espaciado, radios) y sigue con nueve secciones, en este orden:

| Sección | Qué contiene |
|---|---|
| Overview | La idea general de la marca |
| Colors | Cada color con su rol |
| Typography | Escala tipográfica |
| Layout | Estructura y espaciado |
| Elevation & Depth | Cómo se manejan las capas y las sombras |
| Shapes | Formas y esquinas |
| Components | Cómo se ven los componentes |
| Do's and Don'ts | Lo que sí y lo que no, propio de tu marca |
| Known Gaps | Lo que todavía no está definido |

Los colores y las fuentes del design.md son los tuyos: no inventa ni un color ni una fuente. Si Claude necesita leerlo, usa `maasy_get_design_md`. Esa herramienta solo lee lo que ya está guardado: nunca genera uno nuevo.

## Qué pasa cuando cambias algo

- Cambias un color: se rehace el design system y lo visual que depende de él, no los ángulos.
- Cambias una respuesta de negocio: se rehacen los perfiles, los ángulos y los pilares.
- Cada derivación guarda de qué respuestas depende. Si esas respuestas cambian, Claude te lo dice y te ofrece rehacerla.

## Límites

- Hay una cantidad máxima de ítems y de caracteres por derivación. Si Claude se pasa, el servidor la rechaza y la rehace.
- El design.md tiene un tamaño máximo.
- El ADN se completa con la entrevista. Una marca recién creada tiene ADN completo, pero todavía no tiene piezas aprobadas ni descartadas: esa parte del cerebro crece con el uso (capítulo 5).

## Preguntas frecuentes

**¿Puedo editar el design system a mano?** No directamente. Cambia tus colores, tus fuentes o tus referencias y pide rehacerlo. Así queda siempre coherente con lo demás.

**¿Dónde veo todo esto?** En la web de Maasy, sección **ADN y cerebro** (capítulo 7), y desde Claude con `maasy_get_brand_dna` y `maasy_get_design_md`.

**¿Cuántas marcas pueden tener su ADN completo?** Todas las que crees, con el límite de tu plan (capítulo 8).
