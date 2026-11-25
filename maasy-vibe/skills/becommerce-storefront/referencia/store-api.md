# Store API de becommerce (Medusa 2.17) — referencia

Todo cuelga de `VITE_BECOMMERCE_URL` bajo `/store/*`, y **toda** request lleva el header
`x-publishable-api-key: VITE_BECOMMERCE_PUBLISHABLE_KEY`. Las llamadas se hacen a través de
`src/lib/becommerce.ts` (copia de `_commerce/becommerce.ts`), que ya pone la base y el
header — acá está el contrato de lo que hay del otro lado.

Convenciones de esta referencia: los listados devuelven `{ <recurso>, count, offset, limit }`
y aceptan `limit` (default 50) y `offset` para paginar. Todos los importes vienen en la
unidad de la moneda: **nunca se dividen entre 100**.

---

## 1. Región — siempre primero

```
GET /store/regions
→ { regions: [ { id, name, currency_code, countries: [ { iso_2, display_name } ] } ] }
```

Sin `region_id` no hay precios. Resuelve la región una vez (en el loader del layout o en un
módulo compartido) y pásala en todas las llamadas de catálogo y al crear el carrito. Si la
tienda tiene varias regiones, elige por la moneda que vende la marca; si hay una sola,
`regions[0]`.

```
GET /store/regions/{id}   → { region }
```

---

## 2. Catálogo (loader — se hornea en el build)

### Listar productos

```
GET /store/products
    ?region_id={region_id}
    &fields=*variants.calculated_price
    &limit=100&offset=0
→ { products: [ … ], count, offset, limit }
```

- `fields` **empieza** por `*variants.calculated_price`. Si necesitas stock:
  `fields=*variants.calculated_price,+variants.inventory_quantity` (en ese orden).
- Filtros útiles: `q` (búsqueda), `handle`, `collection_id[]`, `category_id[]`, `id[]`,
  `order` (ej. `created_at`, `-created_at`).
- Para hornear el catálogo completo en el build, pagina con `limit`/`offset` hasta llegar a
  `count`. No asumas que caben todos en una página.

### Producto por handle (el PDP)

```
GET /store/products?handle={handle}&region_id={region_id}&fields=*variants.calculated_price
→ { products: [producto] }   // 0 o 1 elemento; vacío = 404 de la ruta
```

También existe `GET /store/products/{id}` con los mismos parámetros, pero la URL pública se
arma con `handle`, así que el PDP se resuelve por handle.

### Forma del producto (lo que se usa de verdad)

```
{ id, title, handle, subtitle, description, thumbnail,
  images: [ { id, url } ],
  options: [ { id, title, values: [ { id, value } ] } ],
  collection, categories: [ … ],
  variants: [ {
    id, title, sku,
    manage_inventory, allow_backorder, inventory_quantity,   // inventory_quantity solo si lo pediste
    options: [ { option_id, value } ],
    calculated_price: {
      calculated_amount,            // el precio, en la unidad de la moneda
      original_amount,              // el "antes", útil solo si price_list_type === 'sale'
      currency_code,
      calculated_price: { price_list_type }   // 'sale' = está en oferta
    }
  } ] }
```

`variant.id` es lo que va al carrito. `product.id` no sirve para comprar.

Si pasas `region_id` **y** `country_code`, aparecen además `calculated_amount_with_tax` y
`calculated_amount_without_tax`; muestra el que corresponda al mercado, pero elige uno y
sé consistente en toda la tienda (listado, PDP, carrito).

### Colecciones y categorías

```
GET /store/collections                 → { collections: [ { id, title, handle } ], count }
GET /store/collections/{id}            → { collection }
GET /store/product-categories          → { product_categories: [ { id, name, handle, parent_category_id } ], count }
GET /store/product-categories/{id}     → { product_category }
```

El endpoint de categorías es **`/store/product-categories`**. `/store/categories` no existe
y devuelve 404.

---

## 3. Carrito (cliente)

El `cart.id` se guarda en `localStorage` con una clave propia del proyecto (por ejemplo
`<slug>_cart_id`). Leerlo o escribirlo **nunca** durante el render: el prerender no tiene
`localStorage`. Va en un `useEffect` o dentro de `<ClientOnly>`.

```
POST /store/carts
     { region_id, email? }
→ { cart }

GET  /store/carts/{id}                          → { cart }     // 404 = carrito muerto: crear otro y limpiar localStorage
POST /store/carts/{id}
     { email?, shipping_address?, billing_address? }
→ { cart }

POST   /store/carts/{id}/line-items             { variant_id, quantity }   → { cart }
POST   /store/carts/{id}/line-items/{line_id}   { quantity }               → { cart }
DELETE /store/carts/{id}/line-items/{line_id}                              → { parent: cart } | { deleted }
```

Cada operación devuelve el carrito recalculado: **rehidrata tu estado con esa respuesta**
en vez de recalcular en el cliente.

### Totales — los da el servidor

```
cart.items[]  → { id, title, variant_id, quantity, unit_price, total, thumbnail }
cart.item_total, cart.shipping_total, cart.tax_total, cart.discount_total, cart.total
```

`cart.total` es el importe autoritativo. No sumes líneas a mano: los impuestos, envíos y
descuentos no se reproducen en el cliente.

Direcciones (`shipping_address` / `billing_address`):

```
{ first_name, last_name, address_1, address_2?, city, postal_code,
  country_code,        // minúscula, ISO-2: 'co', 'mx', 'es'
  province?, phone? }
```

---

## 4. Checkout (cliente, en este orden)

### 4.1 Datos del cliente

```
POST /store/carts/{id}   { email, shipping_address, billing_address }
```

### 4.2 Envío

```
GET  /store/shipping-options?cart_id={id}
→ { shipping_options: [ { id, name, amount, price_type } ] }

POST /store/carts/{id}/shipping-methods   { option_id }   → { cart }
```

Si `shipping_options` viene **vacío**, esa región no tiene envíos configurados: el checkout
no puede terminar. No es un bug del frontend — muéstralo como un mensaje claro y dile al
usuario que lo configure en el panel de becommerce.

### 4.3 Pago

```
GET  /store/payment-providers?region_id={region_id}
→ { payment_providers: [ { id, is_enabled } ] }        // sandbox: solo 'pp_system_default'

POST /store/payment-collections            { cart_id }              → { payment_collection }
POST /store/payment-collections/{pc_id}/payment-sessions
     { provider_id }                                                 → { payment_collection }
```

`provider_id` sale de la lista real. **Nunca hardcodeado.** En sandbox es
`pp_system_default`, que registra la orden sin cobrar.

### 4.4 Completar

```
POST /store/carts/{id}/complete
→ { type: 'order', order }            // ✅ venta
→ { type: 'cart',  cart, error }      // ❌ falló; el detalle está en error
```

Solo con `type === 'order'`:

1. borra el `cart_id` de `localStorage` (el carrito ya no sirve),
2. muestra la confirmación con `order.display_id`, el detalle de líneas y el total,
3. si el usuario dejó email, avísale que le llega el correo de la tienda.

Con `type === 'cart'`: **el carrito sigue vivo**. Muestra el error, deja al usuario
corregir (dirección, envío, stock) y reintentar. No crees un carrito nuevo ni pierdas lo
que ya cargó.

---

## 5. Reviews y wishlist (opcionales — el backend ya los tiene, ningún storefront los usa)

Dos módulos vienen horneados en la imagen del backend desde el release v6 (2026-09-01),
**activos en TODA tienda becommerce sin excepción** — no hay que activarlos ni pedirle nada
al dueño. Pero ningún storefront los consume hoy: si el usuario pide "reseñas de
productos" o "favoritos", esto es lo que hay del otro lado. La UI (botón de corazón,
página de wishlist, cards de reviews con su rating) la construyes tú, igual que cualquier
pantalla nueva — el backend no te la regala.

### Reviews

```
GET /store/product-reviews?product_id={id}
→ { product_reviews: [ { id, name, email, rating, content, status, product_id, order_id,
                          order_line_item_id, images: [{ url }], response } ],
    count, offset, limit }

GET /store/product-review-stats?product_id[]={id}
→ { product_review_stats: [ { product_id, average_rating, review_count,
                               rating_count_1, rating_count_2, rating_count_3,
                               rating_count_4, rating_count_5 } ], count, offset, limit }

POST /store/product-reviews   (requiere sesión de cliente)
     { reviews: [ { order_id, order_line_item_id, rating, content,
                     images: [{ url }] } ] }
```

- El `POST` es **batch** (`reviews: [...]`, aunque sea una sola) y **exige `order_id` +
  `order_line_item_id` reales**: solo quien compró ese producto puede reseñarlo. No hay
  reseña anónima ni de un producto nunca comprado — para el formulario, necesitas el
  `order_id`/`order_line_item_id` de una orden real del cliente (`GET /store/customers/me/orders`
  con sesión, o el `order` que ya tienes tras un `complete` de checkout).
- `status` nace en **`'pending'`** (moderación manual desde el admin, no auto-aprobado): un
  review recién creado NO aparece en `product-review-stats` ni en el `GET` público hasta
  que alguien lo apruebe en el panel de becommerce. Dile esto al usuario si construye un
  formulario de reseñas: "queda pendiente de aprobación, no se ve al instante".
- `GET /store/product-reviews` y `/store/product-review-stats` son públicos (no piden
  sesión): sirven para renderizar reviews en el PDP dentro del `loader` (se hornean en el
  build, igual que el catálogo) — pero recuerda que el conteo/promedio puede quedar
  desactualizado hasta el próximo publish, mismo trade-off que los precios.

### Wishlist

```
GET  /store/wishlists                              (requiere sesión de cliente)
→ { data: [ { id, customer_id, sales_channel_id, name, items: [ { id, product_variant_id,
              wishlist_id, product_variant: { ...variant, product: { id, thumbnail },
              prices } } ], items_count } ], take, skip, count }

POST /store/wishlists              { sales_channel_id, name? }         → { data: <wishlist> }
POST /store/wishlists/{id}/add-item   { product_variant_id }           → { data: <wishlist> }
DELETE /store/wishlists/{id}/items/{item_id}                           → { data: <wishlist> }
```

- **Todo el módulo requiere sesión de cliente** (`req.auth_context`, no hay wishlist de
  invitado: la config del plugin trae `allow_guest_wishlist=false` por default en esta
  instalación). Sin login, el botón de corazón no tiene a dónde escribir — construye el
  flujo de auth de cliente primero (`POST /store/customers`, `POST /auth/customer/emailpass`)
  si el proyecto todavía no lo tiene.
- `sales_channel_id` es obligatorio al crear: sale de la tienda (mismo que usás para
  `region`/`cart`, pedilo una vez y guardalo en el mismo módulo compartido que la región).
- Es **una sola wishlist por cliente** en esta instalación (`allow_multiple_wishlists=false`
  por default): no armes un selector de "listas" — un `GET` que devuelve `data` vacío
  significa "creá la primera con `POST`", no "no tiene wishlists todavía" en plural.
- `product_variant_id`, no `product_id`: el corazón va por variante, igual que agregar al
  carrito. Si el producto tiene talla/color, pide la variante seleccionada, no el producto.

---

## 6. Errores que devuelve el Store API

| Código | Qué pasó |
|---|---|
| 400 sin cuerpo útil | Falta o está mal el `x-publishable-api-key` (o la key es de otra tienda) |
| 404 en `/store/carts/{id}` | El carrito expiró o se completó: limpia `localStorage` y crea uno nuevo |
| 404 en `/store/categories` | Ese endpoint no existe: es `/store/product-categories` |
| 422 al agregar línea | `variant_id` inválido o sin stock con `manage_inventory` activo |
| 500 al crear sesión de pago | `provider_id` que la tienda no tiene configurado |

Muestra los errores en la voz de la marca, nunca el JSON crudo del servidor. Y ningún
estado de error del checkout deja al usuario sin salida: siempre hay un camino de vuelta al
carrito.

## 7. ACP / comercio agentic — NO implementado todavía en storefronts Believable

Desde 2026-09-04, todo storefront nativo de **becommerce-storefront** (`brands/<slug>/`,
el repo compartido, NO este proyecto Believable) expone `/store/acp/*`: un contrato REST
simplificado (`search`, `create_cart`, `add_to_cart`, `checkout`) pensado para que un agente
externo (Claude, ChatGPT, cualquier cliente MCP) busque, arme un carrito y cotice una compra
sin tener que hablar el Store API completo. Un servidor MCP multitenant
(`mcp.becommerce.believe-global.com`) enruta a esas rutas por tienda. Ver
`~/.claude/skills/becommerce-deploy/reference/standard-capabilities.md` — es una capacidad
que se supone ESTÁNDAR y universal, no algo que cada storefront decide si construye.

**Un storefront Believable (este proyecto) hoy NO tiene equivalente.** Es el mismo gap que
tuvieron 7 de 8 tiendas nativas hasta que se corrigió — con un problema extra acá: las rutas
ACP son *server-side route handlers* (Next.js API routes en el storefront nativo), y este
proyecto usa TanStack Start con **`createServerFn` prohibido por regla dura** (ver el skill
`tanstack-start` y `CLAUDE.md`). Antes de portar esto:

1. **Confirmar si TanStack Start permite rutas de API de archivo** (`routes/api/*.ts` o
   equivalente) sin pasar por `createServerFn` — la prohibición documentada es sobre
   server functions RPC-style, no necesariamente sobre file-based API routes, pero esto NO
   está verificado para este setup concreto. No asumir, comprobar contra un route real antes
   de prometerle al usuario que "ya se puede".
2. **La referencia de contrato es el código real**, no esta descripción: `becommerce-storefront/src/app/store/acp/*.ts`
   y `src/lib/acp.ts` (repo `github.com/BELIEVE-IT-GROUP/becommerce-storefront`, clon local
   `/Users/mac/Developer/becommerce-storefront`). Portar el comportamiento exacto —
   incluida la sanitización de texto de catálogo y los topes de cantidad/carrito — no
   reinventarlo desde cero.
3. **El pago sigue bloqueado a propósito en la referencia** (`checkout` devuelve
   `409 payment_not_available`, nunca completa una orden con `pp_system_default`): portar
   ese mismo bloqueo, no "mejorarlo" completando el pago sin que exista todavía un mecanismo
   real de cobro agentic.

Si el usuario pide explícitamente "que un agente pueda comprar en mi tienda" o menciona ACP,
el Model Context Protocol, o "comercio agentic": **decir con claridad que hoy no existe en
storefronts Believable, que es trabajo de plataforma (no de una sesión de edición de esta
tienda puntual), y ofrecer escalarlo** — no fingir que ya funciona ni improvisar una versión
a medias sin los gates de seguridad de la referencia (provenance de `variant_id`, topes de
cantidad, sanitización de contenido de catálogo).
