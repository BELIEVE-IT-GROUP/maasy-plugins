---
name: becommerce-storefront
description: >-
  Cómo se construye una tienda en este proyecto: el storefront habla con una tienda
  becommerce (Medusa 2.17 self-hosted de Believe) por su Store API. Úsalo SIEMPRE que
  toques catálogo, página de producto, carrito, checkout, precios o stock, y también
  cuando el usuario pida "vender", "una tienda", "un carrito", "cobrar por productos" o
  pregunte por qué un precio sale mal, por qué el carrito se vacía o por qué el checkout
  no termina.
version: 1.0.0
---

<!-- Versión del plugin de Claude Code: igual a template/.claude/skills/becommerce-storefront/SKILL.md salvo el
punto 2 del Paso 0 (la app empuja el branding con una tool propia; el plugin no la tiene). Un cambio de receta va en las dos. -->

# Storefront de becommerce en un proyecto Believable

Este proyecto **no tiene base de datos de productos**. La tienda ya existe: es un tenant de
**becommerce** (Medusa 2.17 self-hosted de Believe) con su propio Store API, su panel y su
catálogo. Tu trabajo es el frente: leer ese catálogo y construir la experiencia de compra.

Tres cosas que definen todo lo demás:

1. **El storefront es de SOLO LECTURA sobre el catálogo.** Productos, precios, stock,
   órdenes y envíos viven en becommerce. No los repliques en Supabase, no los hardcodees
   en un array, no inventes un `productos.json`. El dueño los administra en su panel.
2. **El catálogo se hornea en el build** (loaders + prerender): la página de producto
   viaja como HTML con su precio y su JSON-LD adentro, legible por Google y por un agente
   comparador sin ejecutar JavaScript. Ese es el argumento de producto de esta plataforma.
3. **El carrito y el checkout son 100% del cliente**, contra el mismo Store API. El
   **checkout es un componente canónico de la plataforma**: se compone, nunca se reescribe
   (ver más abajo — es la regla más importante de este documento).

> Trabaja con el skill **`ecommerce-design`** al lado. Este documento es el contrato
> técnico; ese otro es el criterio visual, y sin él la tienda sale con cara de plantilla
> barata de Shopify. Los dos, siempre.

## Paso 0: la marca, antes que la tienda

Antes de escribir una sola pantalla, asegúrate de que la marca esté definida. **No es una
entrevista nueva:** el arquitecto de arranque (en "modo tienda") ya te dejó color y logo, y
**`design.md` de la raíz es la fuente de verdad de la marca** (esencia, voz y tono, sistema
visual con paleta y tipografía, anti-referencias, principios). Tu trabajo acá es
**confirmar que ese bloque esté completo**, no volver a preguntar lo que ya está.

1. **Abre `design.md` y complétalo si falta algo.** El bloque de marca necesita: nombre,
   logo, colores (dominante + acentos, como hex), tipografía, referencias y tono. Si algún
   dato falta, complétalo con **una pregunta breve** al usuario (o dedúcelo del logo y de lo
   que ya dijo) — no lo dejes en `<placeholder>`. Esto es exactamente lo que ya pide la
   regla de marca de Be: `design.md` incompleto se llena antes de construir.
2. **Cuando el bloque de marca esté completo, cuéntale al dueño cómo brandear el panel de
   administración de la tienda.** En Claude Code no hay una tool que empuje el branding al
   backend: el **nombre, el logo y el color primario** del panel admin los ajusta el dueño
   en su panel de becommerce, para verla con SU marca y no con la de Medusa genérico.
   Díselo una vez, con los tres valores que quedaron en `design.md`, y no lo repitas.

**El alcance honesto, dilo tal cual si el usuario pregunta:** al backend de la tienda solo
viajan tres campos —nombre, logo y color— y sirven para brandear el **panel admin**. Todo
lo demás que el usuario llama "diseño de la tienda" (la paleta completa, la tipografía, el
layout, el tono del storefront) **es la app que construyes tú**, y sale de `design.md` y del
build; el backend de becommerce no tiene dónde recibirlo. Prometer "todo el sistema de
diseño al backend" es prometer lo que no existe.

## Lo primero: el cliente y las dos variables

El proyecto trae `_commerce/becommerce.ts`. **Cópialo a `src/lib/becommerce.ts`** (mismo
patrón que `_backend/supabase.ts`) y **ábrelo antes de escribir la primera llamada**: ese
archivo es la fuente de verdad de qué funciones existen y cómo se llaman.

Y trae un **andamio de tienda completo** en `_commerce/ejemplos/` (listado, PDP y el
checkout canónico) con su mapa de copia en `_commerce/README.md`: no arranques la tienda de
cero, **copia esos ejemplos a `src/` y adáptalos a la marca**. Demuestran exactamente el
patrón de este documento (loader con precio horneado, JSON-LD, checkout que se compone y no
se reescribe). Son andamio, no una tienda terminada: publicarlos tal cual es entregar la
plantilla que `ecommerce-design` prohíbe.

Lo que el archivo garantiza por contrato:

- Lee `VITE_BECOMMERCE_URL` (la base del Store API de la tienda) y
  `VITE_BECOMMERCE_PUBLISHABLE_KEY`. Believable las inyecta al publicar; en el preview
  vienen del `.env` local del proyecto.
- Pone el header **`x-publishable-api-key`** en **todas** las requests. Sin ese header el
  Store API responde 400 y no explica nada.
- Devuelve el JSON ya parseado y **lanza** cuando la respuesta no es 2xx.
- **No toca los importes.** Los precios llegan como los manda Medusa (ver la regla de
  precios más abajo).

Reglas de uso:

- Si te falta un endpoint, úsalo a través del fetch base del mismo archivo. **Nunca**
  escribas un `fetch` crudo con la URL a mano ni pegues la publishable key en un
  componente.
- La publishable key es **pública por diseño** (equivale a la anon key de Supabase): gatea
  la tienda y su canal de venta, no da acceso de administración. Aun así, va en la env var,
  nunca hardcodeada.
- Si `VITE_BECOMMERCE_URL` no está definida, el proyecto todavía no tiene tienda vinculada:
  dile al usuario que la conecte desde Believable en vez de inventar datos de ejemplo.

## Qué va en el loader y qué va en el cliente

| Va en `loader` (se hornea en el build) | Va en el cliente (`useEffect` / al hacer clic) |
|---|---|
| Listado de catálogo, colecciones, categorías | Carrito completo (crear, agregar, cambiar, quitar) |
| Página de producto: título, descripción, fotos, variantes | Selección de variante y su disponibilidad al momento |
| Precio mostrado + JSON-LD `Product` con `offers` | Checkout entero (dirección, envío, pago, confirmación) |
| Contenido editorial de la marca | Revalidación del precio **antes** de cobrar |

**El trade-off, dicho de frente:** los precios del HTML son los del último publish. Si el
dueño cambia un precio en su panel, la página sigue mostrando el viejo hasta que el
proyecto se vuelva a publicar. Díselo al usuario cuando construyas la tienda, con estas
palabras: *"cuando cambies precios o agregues productos, republica la app"*. Y nunca cobres
por el precio horneado: el importe autoritativo es el que devuelve el carrito del servidor.

**`createServerFn` está PROHIBIDO** (regla dura del proyecto, ver `CLAUDE.md` y el skill
`tanstack-start`). Un loader que pega directo al Store API con `fetch` sí funciona: corre
en el build y también en el navegador al navegar, y el Store API es público con CORS
habilitado para los dominios de Believable.

**Para que una página de producto se genere, tiene que estar enlazada con `<Link>` desde el
listado.** El prerender descubre rutas siguiendo los `<Link>`; un PDP al que solo se llega
por `<a href>` o por un `navigate()` programático nunca se genera y se publica vacío.

## Las reglas de precio (el error #1)

**Los precios de Medusa 2 ya vienen en la unidad de la moneda. NUNCA los dividas entre
100.** Ese es el error que más veces se comete acá: es un hábito de Medusa v1 (que
guardaba centavos) y en v2 convierte un producto de $25 en uno de $0,25 sin que nada falle.

```ts
// MAL — el hábito de Medusa v1
const precio = variant.calculated_price.calculated_amount / 100

// BIEN — el número se muestra tal cual, formateado por Intl
const { calculated_amount, currency_code } = variant.calculated_price
const precio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: currency_code.toUpperCase()
}).format(calculated_amount)
```

Otras dos que van con la misma:

- **Sin `region_id` no hay precio.** Una request de productos sin región devuelve
  `calculated_price: null`. Resuelve la región primero (abajo) y pásala en todas las
  llamadas de catálogo.
- **El tachado solo existe si Medusa lo dice.** Hay precio anterior únicamente cuando
  `calculated_price.price_list_type === 'sale'`; ahí muestras `original_amount` tachado. No
  inventes un "antes" para simular descuento: es copy deshonesto (regla de la
  constitución) y además ilegal en varios países.

## El contrato del Store API

Todas las rutas cuelgan de `/store/*` sobre `VITE_BECOMMERCE_URL`, todas con el header
`x-publishable-api-key`. **El detalle endpoint por endpoint, con parámetros y forma de la
respuesta, está en `referencia/store-api.md`** — ábrelo antes de escribir la llamada, no
la reconstruyas de memoria.

El orden que no se salta:

1. **Región** — `GET /store/regions`. Guarda `regions[0].id` (o la que corresponda a la
   moneda de la marca) en un módulo compartido: de ahí en más viaja en todas las llamadas.
2. **Catálogo** — `GET /store/products?region_id=…&fields=*variants.calculated_price`. El
   `fields` va **empezando** por `*variants.calculated_price`; si agregas más campos, ese
   va primero.
3. **Producto** — el PDP se resuelve por `handle` (la URL bonita), no por id.
4. **Carrito** — crear, agregar líneas, actualizar cantidades. El `cart.id` vive en
   `localStorage`; los **totales los calcula el servidor** (`cart.total`), nunca los sumes
   tú en el cliente.
5. **Checkout** — dirección → opciones de envío → sesión de pago → completar.

## El checkout canónico: se compone, no se reescribe

El proyecto trae un **checkout de plataforma**: un componente ya escrito y probado que hace
los cinco pasos contra el Store API, maneja los errores reales y no cobra dos veces.

- **Compón sobre él.** Puedes cambiar tipografía, colores, espaciado, textos, el orden
  visual de los bloques y qué imagen acompaña el resumen. Es la marca del proyecto y tiene
  que verse de la marca.
- **No reescribas el flujo.** No cambies el orden de los pasos, no saltes la revalidación,
  no reimplementes el manejo de la respuesta de `complete`, no inventes tu propia máquina
  de estados "más simple".
- **Por qué:** un checkout roto no falla como una landing rota. Falla cobrando de más,
  perdiendo la orden después de cobrar, o dejando el carrito en un limbo del que el cliente
  no sale. La plataforma se come ese riesgo una vez, no una vez por proyecto.

Si el usuario pide algo que el checkout canónico no hace (un paso extra, un campo
adicional, un descuento especial), **dilo en vez de improvisar** una copia paralela: es una
mejora del componente de plataforma, no un fork dentro de su proyecto.

### Las dos cosas del checkout que se verifican siempre

- **`complete` no es sinónimo de "vendido".** La respuesta trae `type`: solo
  `type === 'order'` es una venta. Con `type === 'cart'` falló y el detalle está en `error`.
  Recién con `type === 'order'` se limpia el `cart_id` de `localStorage` y se muestra la
  confirmación con `order.display_id`.
- **Revalida el precio antes del último paso.** El total que manda es el del carrito que
  responde el servidor. Si difiere del que el usuario venía viendo (porque el HTML es del
  último publish), muéstraselo antes de completar. Cobrar callado un importe distinto al
  mostrado es la peor falla posible de una tienda.

## Cuando no hay pagos reales (sandbox)

Una tienda recién creada está en **sandbox**: el único proveedor de pago es
`pp_system_default`, que registra la orden **sin cobrar un peso**. Sirve para construir y
probar el flujo completo.

- Consulta los proveedores reales con `GET /store/payment-providers?region_id=…` y usa el
  que venga. **Nunca hardcodees `pp_stripe_stripe`**: si la tienda no lo tiene configurado,
  el checkout revienta con un 500 opaco (pasó de verdad en una tienda con una fila fantasma
  de un provider que ya no existía).
- Dile al usuario, sin adornos, que en sandbox **no se cobra**: para vender de verdad hay
  que activar la tienda y conectar su Stripe desde becommerce. No simules un cobro exitoso
  ni pongas un botón "Pagar con tarjeta" que no cobra.

## Tocar el catálogo: por lote y con permiso

A veces el usuario te pide cargar o cambiar productos ("subí estos 30", "bajale 10% a la
categoría X"). Eso escribe en la tienda REAL del dueño, con datos comerciales reales.

- **Confirma antes de escribir.** Resume qué vas a hacer (cuántos productos, qué cambia) y
  espera el sí. Una mutación de catálogo no es una edición de código: no hay checkpoint que
  la revierta.
- **Límites por lote:** máximo **20** productos por operación de crear o actualizar, y
  **50** por operación de borrar. Si hay más, parte en tandas y reporta cada tanda.
- **Reporta ítem por ítem** qué se creó, qué se actualizó y qué falló. Un "listo, subí
  todo" sin detalle es inútil cuando 3 de 30 fallaron.
- **Borrar siempre pide confirmación explícita**, aunque sea un solo producto.

## Reviews y wishlist: existen en el backend, no en tu storefront (todavía)

Si el usuario pide "reseñas de clientes" o "favoritos/wishlist": **no está sin backend.**
Desde el release v6 de becommerce, toda tienda trae esos dos módulos horneados y activos
(Store API real, sin activar nada) — lo que falta es la UI de tu storefront, que es
trabajo tuyo como cualquier pantalla nueva. **No digas "eso no se puede"; dile al usuario
que se puede construir y hazlo.** El contrato completo (endpoints, forma de la respuesta,
gotchas reales como el `status: 'pending'` de las reviews o que wishlist exige sesión de
cliente) está en `referencia/store-api.md` sección 5 — ábrela antes de escribir la
primera llamada, igual que con el resto del Store API.

## ACP / comercio agentic: gap real, no lo prometas resuelto

Si el usuario pide que un agente (Claude, ChatGPT, un comprador-bot) pueda buscar y comprar
solo en la tienda: **hoy no existe en storefronts Believable**, a diferencia de las tiendas
nativas de becommerce-storefront (que sí lo tienen desde 2026-09-04). No es un "todavía no
construiste la UI" como reviews/wishlist — acá ni el backend de plataforma existe para este
proyecto: son rutas de servidor nuevas, y este framework prohíbe `createServerFn`. **Dilo
así de claro, no lo trates como una pantalla más.** El contrato completo, lo que hay que
verificar antes de portarlo, y por qué el pago queda bloqueado a propósito: sección 7 de
`referencia/store-api.md`.

## Agent-readable: la tienda tiene que ser citable

Una tienda que un agente no puede leer nace invisible. Además del `llms.txt` y el
`brand.json` que ya lleva toda app Believable:

- **JSON-LD `Product` en cada PDP**, horneado en el `head()` de la ruta, con `name`,
  `description`, `image`, `sku`/`gtin` si existen, y un `offers` con `price`,
  `priceCurrency`, `url` y `availability`.
- **`availability` solo con dato real.** Sale de la variante: pide
  `fields=*variants.calculated_price,+variants.inventory_quantity` y decide con
  `manage_inventory === false || inventory_quantity > 0 || allow_backorder`. Si el campo no
  viene, omite `availability` — declarar `InStock` sin saberlo es inventar datos.
- **JSON-LD `ItemList`** en el listado de catálogo, con los productos en el orden en que se
  muestran.
- El precio del JSON-LD tiene que ser **el mismo** que el visible en la página. Si no
  coinciden, Google lo marca como spam estructurado.

## Trampas medidas (no son teoría)

| Síntoma | Causa real |
|---|---|
| Todo responde 400 sin explicación | Falta el header `x-publishable-api-key` |
| `calculated_price` viene `null` | Falta `region_id` en la query |
| Los precios se ven 100 veces más baratos | Dividiste entre 100 (hábito de Medusa v1) |
| El precio no aparece aunque pasas `region_id` | `fields` no empieza por `*variants.calculated_price` |
| 404 al pedir categorías | El endpoint es `/store/product-categories`, no `/store/categories` |
| El carrito se vacía solo entre visitas | El `cart.id` no se guardó en `localStorage`, o se guardó durante el render (el prerender no tiene `localStorage`) |
| El build muere al compilar el carrito | Componente que lee `localStorage`/`window` al render: va dentro de `<ClientOnly>` |
| El checkout no ofrece envío | La región no tiene shipping options configuradas: no es un bug tuyo, hay que decirlo (pasa de verdad) |
| La orden "se perdió" después de pagar | Se asumió éxito sin chequear `type === 'order'` |
| Un producto existe pero su página no se publicó | El PDP no está enlazado con `<Link>` desde ninguna página generada |
| El total del carrito no cuadra | Se sumaron las líneas a mano en vez de usar los totales del servidor |

## Antes de dar la tienda por terminada

1. El listado y al menos un PDP salen **con precio en el HTML** (revisa el archivo generado
   con `grep -a`, no con `grep` a secas).
2. El JSON-LD `Product` está en el HTML y su precio coincide con el visible.
3. El flujo completo probado en el preview: agregar al carrito → recargar la página (el
   carrito sigue ahí) → checkout hasta la confirmación.
4. Estados vacíos reales: catálogo sin productos, carrito vacío, búsqueda sin resultados,
   producto agotado. Con la voz de la marca, no con "No data".
5. Le dijiste al usuario dos cosas: que **republique** cuando cambie el catálogo, y si la
   tienda está en **sandbox** (no cobra).
6. Pasaste el checklist de `ecommerce-design`. Una tienda que funciona pero parece
   plantilla es media entrega.
