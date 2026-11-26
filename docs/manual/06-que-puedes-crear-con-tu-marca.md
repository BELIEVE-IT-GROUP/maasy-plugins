# Qué puedes crear con tu marca

Con tu marca creada, Claude puede producir casi cualquier pieza de marketing que le pidas, y salir con tu voz, tus colores y tus argumentos. No hace falta un plugin distinto para cada tipo de pieza. Lo que cambia es el contexto: Claude no empieza de cero, empieza con tu marca entera.

## Cómo se crea una pieza

```figura
<figure class="vx-fig" data-alt="Tres pasos. Pides algo en lenguaje normal. Tu Claude lo crea con el contexto completo de tu marca: el contexto de marca, el design.md y el cerebro. La pieza llega al canvas de Maasy como tarjeta y tú la apruebas o la descartas.">
  <div class="vx-head">De un pedido a una pieza aprobada</div>
  <div class="vx-body">
    <div class="vx-flow">
      <div class="vx-node">Tú pides<small>En lenguaje normal</small></div>
      <div class="vx-node vx-key">Tu Claude crea<small>Con el contexto de marca, el design.md y el cerebro</small></div>
      <div class="vx-node">Llega al canvas<small>Como una tarjeta</small></div>
      <div class="vx-node">Tú decides<small>Apruebas o descartas</small></div>
    </div>
  </div>
  <figcaption>Quien crea es tu Claude, con tu cuenta. Maasy le da el contexto y guarda el resultado para que tú lo juzgues.</figcaption>
</figure>
```

1. **Tú pides.** En el chat de Claude, con tus palabras.
2. **Claude reúne el contexto.** Lee el contexto completo de tu marca (`maasy_get_brand_context`), el design.md (`maasy_get_design_md`) y consulta el cerebro: qué funcionó, qué descartaste, cómo hablas. Si la pieza lo necesita, mira también las piezas ganadoras.
3. **Claude crea.** Con ese contexto escribe, diseña o planea.
4. **Llega al canvas.** Claude deja la pieza como una tarjeta en el canvas de tu marca (`maasy_canvas_submit`), con su tipo (texto, imagen, video o landing) y el canal al que va (Instagram, anuncios de Meta, web, correo, TikTok, YouTube u otros).
5. **Tú juzgas.** En la web de Maasy apruebas o descartas. Lo que decidas alimenta el cerebro (capítulo 5).

Hace falta el plan Pro, porque el contexto completo y el canvas son parte de él (capítulo 8).

## Qué puedes pedirle

### Textos y estrategia

- **Copies:** títulos, descripciones, llamados a la acción, textos de producto.
- **Conceptos creativos:** ideas de campaña con su gancho y su ángulo.
- **Estrategias:** un plan de contenido, una estrategia de lanzamiento, una propuesta de posicionamiento. Claude usa tus ángulos de venta y tus pilares.
- **Anuncios:** textos y conceptos para pauta, con el ángulo adecuado a cada etapa del embudo.
- **Posts:** publicaciones y calendarios. Para Instagram orgánico está además Maasy Feed (capítulo 12).
- **Artículos:** notas para tu blog, con tu voz y tus temas.
- **Emails:** correos sueltos y secuencias.

```pedido
Escribe cinco títulos para un anuncio de nuestra oferta de diciembre. Que ataquen el miedo al precio.
Arma un plan de contenido de cuatro semanas con nuestros pilares.
Escríbeme un correo para clientes que no han comprado en 60 días, con nuestro tono.
Propón tres conceptos de campaña para el Día de la Madre y dime cuál de nuestros ángulos usa cada uno.
```

### Páginas y apps

Una landing, un sitio o una app salen de Maasy Vibe, con tu paleta, tu tipografía y tu voz tomadas de tu ADN (capítulo 9). Quedan publicadas y también llegan al canvas.

```pedido
Hazme una landing para la lista de espera de la nueva cohorte.
Crea una página de precios con tres planes.
```

### Videos

Un reel, un video de lanzamiento o una pieza animada salen de Maasy Motion, con tu kit de marca (capítulo 10).

```pedido
Un reel de 15 segundos para lanzar el termo nuevo, con gancho en forma de pregunta.
```

### A partir de lo que ya funciona en el mercado

Con Maasy Lens (capítulo 11) desarmas un video de otra marca y Claude propone cómo adaptar su fórmula a la tuya, sin copiar nada.

```pedido
Mira este reel y dime qué fórmula usa. Después proponme una versión para nuestra marca.
```

## Cómo pedir mejor

- **Di el objetivo y el canal.** "Un anuncio para vender el curso de diciembre en Instagram" rinde más que "un anuncio".
- **Pide opciones.** Tres versiones con ángulos distintos te dejan comparar y enseñan más al cerebro.
- **Nombra el ángulo o el pilar** si ya sabes cuál quieres: "usa el ángulo por dolor".
- **Descarta con un motivo.** Cuando rechazas una pieza en el canvas, tu motivo queda guardado. Es la forma más rápida de que Claude deje de repetir lo que no te gusta.
- **Corrige el ADN, no la pieza.** Si algo se repite (una palabra que no usarías), agrégala a tus palabras prohibidas y desaparece de todas las piezas futuras.

## Qué no hace

- Claude no publica ni envía nada por su cuenta. Una pieza en el canvas es una propuesta.
- Las piezas se crean con tu cuenta de Claude. Maasy no genera con IA propia en este canal, por eso el plan no incluye créditos.
- Una pieza no sustituye tu revisión. Si afirma algo sobre tus precios, resultados o garantías, confírmalo antes de aprobar.

## Preguntas frecuentes

**¿Tengo que instalar algo distinto para cada tipo de pieza?** Para textos, conceptos, estrategias, anuncios, artículos y emails no: basta el plugin `maasy` y una marca en plan Pro. Para páginas, videos, Instagram y respuestas, cada uno tiene su plugin.

**¿Por qué mis textos suenan a mí?** Porque Claude lee tu voz, tus palabras prohibidas y tus ejemplos antes de escribir, y porque tus aprobaciones anteriores le muestran qué funcionó.

**¿Qué pasa con las piezas que descarto?** Quedan registradas con tu motivo. Claude las consulta al empezar para no repetirlas.
