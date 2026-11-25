# `_commerce/` — el starter de tienda (becommerce)

Este directorio **duerme** hasta que el proyecto es una tienda, igual que `_backend/` para
Supabase. No entra en el build ni en el typecheck del template: son archivos que **Be copia
a `src/`** cuando construye una tienda contra una tienda [becommerce](https://becommerce.believe-global.com)
(Medusa 2.17 self-hosted de Believe).

Lee los skills **`becommerce-storefront`** (contrato técnico del Store API) y
**`ecommerce-design`** (criterio visual anti-plantilla) antes de tocar nada. Los dos, siempre.

## Qué hay acá

```
_commerce/
├── becommerce.ts              el cliente del Store API (fetch crudo, precios sin /100)
└── ejemplos/                  andamio de una tienda — se COPIA y se adapta, no se publica tal cual
    ├── tienda.tsx             listado de catálogo (loader SSG + JSON-LD ItemList + ritmo editorial)
    ├── productos.$handle.tsx  PDP por handle (loader SSG + JSON-LD Product + narrativa)
    ├── carrito.tsx            carrito + checkout (ClientOnly)
    └── comercio/              la maquinaria del carrito y el checkout CANÓNICO
        ├── config.ts          moneda, locale, clave de localStorage, resolución de región
        ├── carrito-store.ts   store del carrito (cart_id en localStorage, totales del servidor)
        ├── SelectorCompra.tsx elegir variante + cantidad + agregar (client-only)
        ├── Carrito.tsx        la bolsa (líneas + totales del servidor + estado vacío)
        └── Checkout.tsx       EL CHECKOUT CANÓNICO — se compone, no se reescribe
```

## Cómo se instala en un proyecto

1. **El cliente** → `src/lib/becommerce.ts`
   ```
   _commerce/becommerce.ts        →  src/lib/becommerce.ts
   ```
2. **La maquinaria** (carpeta entera, se mueve como bloque) → `src/comercio/`
   ```
   _commerce/ejemplos/comercio/   →  src/comercio/
   ```
3. **Las rutas** → `src/routes/`
   ```
   _commerce/ejemplos/tienda.tsx              →  src/routes/tienda.tsx
   _commerce/ejemplos/productos.$handle.tsx   →  src/routes/productos.$handle.tsx
   _commerce/ejemplos/carrito.tsx             →  src/routes/carrito.tsx
   ```

Los imports usan el alias `@` → `src`, así que resuelven una vez copiados: las rutas piden
`@/comercio/...` y `@/lib/becommerce`; la maquinaria pide `@/lib/becommerce` y entre sí con
rutas relativas (por eso `comercio/` se copia como una sola carpeta).

Las dos variables (`VITE_BECOMMERCE_URL`, `VITE_BECOMMERCE_PUBLISHABLE_KEY`) las inyecta
Believable al publicar; en el preview vienen del `.env` local del proyecto.

## Por qué son ANDAMIO y no rutas del template por defecto

El template lo reciben TODOS los proyectos, la mayoría no son tiendas. Meter `/tienda` y un
checkout en cada uno sería imponer comercio donde no va. Por eso viven acá dormidos: Be los
copia solo cuando construyes una tienda, y al copiarlos **los adapta a la marca** — copy,
moneda, dirección de arte, el verbo del botón. El andamio demuestra la ESTRUCTURA correcta
(SSG con precio horneado, JSON-LD, checkout canónico, ritmo editorial); no es una tienda
terminada. Publicarlo tal cual sería entregar la plantilla que `ecommerce-design` prohíbe.

## Lo que no se toca al adaptar

- **El flujo del checkout canónico** (`comercio/Checkout.tsx`): se viste entero (tipografía,
  color, textos, orden visual), pero no se cambia el orden de los pasos, no se salta la
  revalidación de precio antes de cobrar, no se reimplementa el manejo de `complete`. Un
  checkout roto cobra de más o pierde la orden; la plataforma se come ese riesgo una vez.
- **La regla del precio**: los importes de Medusa 2 ya vienen en la unidad de la moneda.
  `formatPrice` NUNCA divide entre 100.
- **Que el precio autoritativo es el del carrito del servidor**, no el horneado en el HTML.
