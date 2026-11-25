---
name: ecommerce-design
description: >-
  Cómo se ve una tienda que NO parece plantilla barata de Shopify. Criterio visual y
  editorial para catálogo, página de producto, carrito, checkout y estados vacíos: qué
  está prohibido, qué hacer en cambio y qué no se toca por estética. Úsalo SIEMPRE que
  diseñes o revises cualquier pantalla de comercio, y cuando el usuario diga "se ve
  genérica", "parece una plantilla", "quiero que se vea premium" o "no me gusta cómo
  quedó la tienda".
version: 1.0.0
---

# Diseñar una tienda que no parezca una plantilla

Una tienda genérica se reconoce en dos segundos, antes de leer una palabra: carrusel
arriba, grilla pareja de cards abajo, badge rojo de oferta, footer con logos de tarjetas.
El visitante no piensa "qué feo", piensa **"esto es cualquiera"** — y una marca que se lee
como cualquiera no vende a precio de marca.

Este documento es el criterio visual del comercio. Extiende las reglas anti-"se nota que lo
hizo una IA" del `CLAUDE.md` del proyecto (no las repite: siguen vigentes todas, en
especial *un solo foco por pantalla*, *color = significado*, *sin emoji como ícono* y
*tokens semánticos*) y las aplica al terreno donde más se nota: vender.

> El contrato técnico está en el skill **`becommerce-storefront`**. Los dos, siempre: una
> tienda hermosa que cobra mal es un desastre, y una tienda correcta que parece plantilla
> es media entrega.

## 0. La tienda no es un theme: es la marca

**`design.md` manda.** La identidad visual de la tienda es la de la marca — su paleta, su
tipografía, su densidad, su voz. No existe "el look de ecommerce" como categoría aparte: no
hay un modo tienda al que se cambia y que trae su propio azul, sus propias cards y sus
propios íconos de carrito.

Antes de dibujar una sola pantalla:

1. Lee `design.md` completo. Si está vacío o flojo en lo que el comercio necesita
   (**tratamiento fotográfico**, comportamiento del precio, densidad del listado),
   entrevista corto al usuario y **complétalo primero**. Construir la tienda antes de eso
   es garantizar el retrabajo.
2. Decide y anota en `design.md` **cómo se ve una foto de producto en esta marca**: fondo,
   luz, encuadre, proporción, si el producto aparece solo o en uso, si hay sombra. Esa
   decisión sola separa una tienda con dirección de arte de un catálogo de proveedor.
3. Define el **comportamiento del precio** como parte del sistema: qué peso tipográfico
   tiene, si va cerca del título o separado, cómo se ve un precio en oferta. El precio es
   el segundo dato más leído de toda la tienda; no puede quedar como una decisión de última
   hora.

Un caso frecuente: el usuario trae fotos de producto heterogéneas (distintos fondos,
distintas luces, unas verticales y otras cuadradas). Esa mezcla, sin tratamiento, es la que
hace que la tienda se vea barata aunque el producto sea bueno. Resuélvelo con una decisión
de diseño — recorte a una proporción única, fondo de marca detrás de todas, un mismo
padding interno — y **dile al usuario qué decidiste y por qué**.

## 1. Prohibido: las marcas de la plantilla barata

Cada una de estas es reconocible al instante y ninguna es necesaria.

### El hero-carrusel de banners

Tres slides que rotan con flechas y puntitos. Nadie ve el slide 2. Empuja el producto
debajo del pliegue, mueve el layout mientras el visitante lee y es la pieza más clonada de
la web.

**En cambio:** una entrada **fija** con una sola idea — la mejor foto de la marca, un
titular que dice qué es esto y para quién, un camino claro al catálogo. Si de verdad hay
dos mensajes que compiten, elige uno y baja el otro a su propia sección.

### La grilla infinita de cards idénticas

Foto cuadrada, título centrado, precio centrado, botón "Añadir al carrito", repetido
veinticuatro veces con el mismo peso visual. Es la marca #1 de tienda hecha por máquina y
además vende peor: sin jerarquía, nada llama.

**En cambio:** ver *"Listado con ritmo"* más abajo.

### El badge "SALE" rojo y los contadores de urgencia

El rectángulo rojo en la esquina de la foto, el "¡Solo quedan 3!", la cuenta regresiva que
se reinicia al recargar. El primero rompe la paleta de la marca con un color que nadie
eligió; los otros dos son mentira salvo que el dato sea real.

**En cambio:** la oferta se comunica **en el precio** — el importe anterior tachado en un
tono secundario junto al vigente, y ya. Si la marca quiere marcar una tanda, que sea una
etiqueta con la tipografía y el color de la marca, discreta, en un solo lugar. Y ningún
dato de escasez que no venga del stock real del catálogo.

### El mega-menú de departamentos

El panel que se despliega con seis columnas de categorías porque "así lo hace la
competencia grande". Una tienda de 40 productos con la navegación de un hipermercado se
siente vacía, no completa.

**En cambio:** navegación proporcional al catálogo. Con pocas categorías, van visibles en
la barra. Con muchas, una entrada al catálogo y **filtros dentro** de él, donde se usan de
verdad.

### "Destacados / Nuevos / Más vendidos" como únicas secciones del home

Tres filas de lo mismo con títulos distintos. Es lo que sale cuando nadie decidió qué
cuenta la marca.

**En cambio:** el home tiene **un argumento**. Secciones que digan algo: de qué está hecho,
quién lo hace, cómo se usa, por qué esto y no lo otro, qué dicen quienes ya compraron (si
hay testimonios reales — inventarlos está prohibido por la constitución). Los productos se
muestran **dentro** de ese argumento, no como tres estantes seguidos.

### La foto sobre fondo blanco puro, por defecto

`#FFFFFF` detrás de todo, sin sombra, sin contexto. Es correcto para un marketplace, que
necesita que 500 vendedores se vean iguales. Una marca no necesita eso: necesita lo
contrario.

**En cambio:** el fondo de la ficha sale de la paleta — un neutro cálido, un tono de marca
al 8%, una superficie con textura. Y al menos una foto del producto **en uso o en
contexto**. Fondo blanco solo si `design.md` lo pide a propósito (un blanco elegido es una
decisión; un blanco por defecto es una omisión).

### El cinturón de sellos genéricos

"Envío gratis / Pago seguro / Devolución 30 días" en tres columnas, cada uno con su ícono
dentro de un círculo de color, más los logos de Visa y Mastercard en el footer. Decoración
que finge ser información: nadie compra por ver un ícono de candado.

**En cambio:** si el envío gratis es real y es un argumento, dilo **donde importa** — junto
al precio y en el carrito, con palabras concretas ("Envío gratis desde $150.000"). Las
condiciones de devolución van en su página, enlazadas desde el PDP y el checkout, no como
tres pastillas en el home.

### Y las que ya prohíbe el proyecto, que en comercio duelen doble

Emoji como ícono (🛒⭐🔥), el ícono dentro de un chip arriba de cada bloque, el índigo por
defecto, la elevación mezclada. En una tienda esto no es solo feo: es la diferencia entre
un lugar donde uno deja el número de su tarjeta y uno donde no.

## 2. Qué hacer en cambio

### Una decisión visual memorable por vista

Cada pantalla tiene **una** cosa que alguien podría describir después: una tipografía
enorme para el nombre del producto, una foto que sangra a pantalla completa contra una
columna de texto angosta, un color de marca ocupando la mitad del listado, un detalle de
composición que se repite y se vuelve firma.

Una por vista. Dos compiten, tres son ruido. Y si no puedes nombrar cuál es la de la
pantalla que acabas de construir, todavía no hay ninguna.

### Jerarquía editorial: la tienda cuenta la marca

Piensa cada vista como una **página de revista**, no como una tabla de resultados. Hay un
titular, hay un cuerpo, hay una pausa. El catálogo no es la salida de una consulta: es una
selección con criterio.

En concreto:
- El home empieza por **qué es esto**, no por "Productos destacados".
- Una categoría merece su propia entrada — una línea que diga qué reúne y por qué —, no
  solo el nombre y la grilla.
- El texto de la marca y los productos **se alternan**; no van los productos primero y el
  relato al final.

### Tratamiento fotográfico consistente

La foto es el 70% de lo que se percibe. La regla es una sola: **una misma decisión
aplicada a todas**, declarada en `design.md`.

- Una proporción de recorte para todas las cards del listado (ninguna grilla con fotos de
  altura distinta).
- Un mismo fondo y un mismo aire alrededor del producto.
- Placeholder de la marca cuando falta foto — nunca un cuadro gris con un ícono de imagen
  rota, y nunca una foto de stock que no es el producto.
- El PDP puede romper la proporción del listado a propósito (una foto grande, una
  secuencia): eso es dirección, no inconsistencia. Lo que no puede haber es azar.

### PDP con narrativa, no una ficha técnica

La página de producto es donde se decide la compra y es la que más se copia mal: foto a la
izquierda, título-precio-botón a la derecha, acordeón de specs abajo, fin.

Lo que sí tiene que estar, ordenado como una historia:

1. **Qué es y por qué importa** — una línea antes de cualquier especificación.
2. **El producto en contexto** — en uso, en escala, en la mano de alguien.
3. **La decisión de compra sin fricción** — variante, cantidad, precio y botón, siempre
   visibles o siempre alcanzables (en móvil, una barra fija abajo con precio y acción).
4. **El detalle para quien lo busca** — materiales, medidas, cuidados, envío. Abajo, para
   quien baja.
5. **La marca alrededor** — cómo se hace, quién lo hace, qué más va con esto. Los
   relacionados son una recomendación, no un relleno de la página.

Y el precio **nunca** se esconde tras un despliegue ni se muestra "desde $X" cuando el dato
exacto existe.

### Listado con ritmo

La grilla pareja mata el listado. Rómpela **con intención**, no al azar:

- Un producto ancla más grande al principio de cada tanda (el destacado de la marca, no el
  primero por fecha).
- Cada cierto número de productos, un bloque editorial: una foto de contexto, una cita, el
  nombre de la categoría en grande.
- Densidad según la marca: pocos productos por fila y mucho aire para lo caro; más denso y
  eficiente para lo cotidiano. La densidad **es** posicionamiento.
- La card muestra lo que decide: foto, nombre, precio. El botón de añadir aparece al hover
  o vive en el PDP; una grilla llena de botones se ve como un panel de administración.

Sin ritmo el listado es un inventario. Con ritmo es una selección.

### Microcopy con la voz de la marca, hasta en el último rincón

Los textos que nadie diseña son los que delatan la plantilla. Todos estos se escriben con
la voz de `design.md`:

| Dónde | El default de plantilla | Lo que corresponde |
|---|---|---|
| Carrito vacío | "Tu carrito está vacío" | Una línea de la marca + un camino de vuelta al catálogo |
| Botón principal del PDP | "Añadir al carrito" | El verbo de la marca, si tiene uno |
| Sin resultados | "No se encontraron productos" | Qué probar ahora, con la voz de la marca |
| Producto agotado | "Agotado" | Qué pasa después: si vuelve, si hay algo parecido |
| Confirmación de orden | "Gracias por tu compra" | Qué sigue, cuándo llega, dónde preguntar |
| Error del checkout | El JSON del servidor | Qué falló y qué hacer, en una línea, sin culpar al cliente |

Los estados vacíos, de carga y de error son obligatorios en toda superficie con datos
(regla del proyecto). En una tienda son además el momento de mayor riesgo: el estado vacío
del carrito es la pantalla que más gente ve.

## 3. Lo que NO se toca por estética

La personalidad nunca se paga con la usabilidad comercial. Estas cuatro no se negocian:

1. **El flujo del checkout canónico.** Puedes vestirlo entero — tipografía, color,
   espaciado, textos, imágenes, orden visual de los bloques. **No** cambias el orden de los
   pasos, ni saltas la revalidación de precio, ni reescribes su manejo de errores. Ver
   `becommerce-storefront`.
2. **La claridad de precio, stock y envío.** El precio se lee sin esfuerzo, en el mismo
   lugar de cada card, con contraste suficiente. Los cargos aparecen **antes** de pedir la
   tarjeta, nunca como sorpresa en el último paso. Nada de precio en gris claro sobre foto
   por elegancia, ni tipografía decorativa en el importe, ni "consultar precio" cuando el
   precio existe.
3. **Accesibilidad.** Contraste AA en precio, botones y estados; foco visible en todo lo
   interactivo (un checkout sin foco visible es imposible por teclado); toda foto de
   producto con `alt` real; área táctil de al menos 44px en las acciones de compra; el
   estado de una variante agotada nunca comunicado **solo** por color.
4. **El peso de la página.** El listado es una parrilla de fotos: dimensiones explícitas
   para que nada salte al cargar, lazy loading fuera del primer pliegue, y la primera foto
   del PDP cargada con prioridad. Una tienda lenta se percibe como poco seria antes de que
   nadie juzgue su diseño.

## 4. Checklist: ¿parece una plantilla?

Antes de mostrar cualquier pantalla de la tienda, respóndete estas. Un "no" es trabajo
pendiente, no una observación.

1. ¿Puedo nombrar **la** decisión visual memorable de esta vista?
2. Si tapo el logo, ¿se sigue reconociendo la marca por la tipografía, el color y el
   tratamiento de las fotos?
3. ¿El home dice **qué es esto y para quién** antes de mostrar la primera grilla?
4. ¿El listado tiene ritmo, o es una grilla pareja de cards del mismo peso?
5. ¿Las fotos comparten una decisión de arte, o es lo que mandó el cliente pegado tal cual?
6. ¿El PDP cuenta algo antes de la ficha técnica?
7. ¿Cada texto de estado (vacío, agotado, error, confirmación) está escrito con la voz de
   la marca, o quedó el default?
8. ¿Hay algún color, ícono o badge que **no** salga de `design.md`?
9. ¿El precio se lee de un vistazo en el listado, en el PDP, en el carrito y en el
   checkout — con el mismo formato en los cuatro?
10. ¿Sobrevive en móvil? (grilla legible, precio y acción visibles sin buscar, checkout
    cómodo con una mano)
11. ¿Todo lo que digo — envío gratis, stock, "hecho a mano", testimonios — es **verdad
    comprobable** del catálogo o del usuario?
12. Y la que resume todas: si le muestro esta pantalla a alguien junto a tres tiendas
    genéricas, ¿la distingue?

Arregla lo que falle **antes** de mostrarle el resultado al usuario. Que la tienda funcione
es el piso, no el logro.
