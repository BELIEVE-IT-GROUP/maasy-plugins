// PÁGINA DE PRODUCTO (PDP) — ruta de ejemplo (SSG). Copia a `src/routes/productos.$handle.tsx`.
//
// El patrón (skill becommerce-storefront):
//  · el producto se resuelve por HANDLE en el `loader` → precio y datos HORNEADOS en el HTML;
//  · JSON-LD `Product` en el `head()`, con `offers` (price + availability real), y su precio
//    es EL MISMO que el visible (si no, Google lo marca como spam);
//  · la compra (elegir variante, agregar) es 100% del cliente → dentro de <ClientOnly>;
//  · un handle inexistente cae en el 404 del sitio (notFound), no en un error del build.
//
// El criterio de ecommerce-design: NARRATIVA, no ficha técnica. Qué es y por qué → el
// producto en contexto → la decisión de compra sin fricción → el detalle abajo. La decisión
// memorable acá es el nombre del producto a escala grande sobre una foto que respira.
//
// ⓘ SCAFFOLD: copy, moneda y dirección de arte son de la marca (design.md).

import { ClientOnly, createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  becommerce,
  displayPrice,
  formatPrice,
  productJsonLd,
  type Product
} from '@/lib/becommerce'
import { LOCALE, resolverRegion } from '@/comercio/config'
import { SelectorCompra } from '@/comercio/SelectorCompra'

export const Route = createFileRoute('/productos/$handle')({
  loader: async ({ params }) => {
    // Sin tienda o handle inexistente: 404 del sitio, no un error que tumbe el prerender.
    if (!becommerce.isConfigured()) throw notFound()
    const region = await resolverRegion()
    if (!region) throw notFound()
    const product = await becommerce.getProductByHandle(params.handle, {
      regionId: region.id,
      withInventory: true
    })
    if (!product) throw notFound()
    return { product }
  },
  head: ({ loaderData, params }) => {
    const product = loaderData?.product
    if (!product) return {}
    return {
      meta: [
        { title: product.title },
        ...(product.description
          ? [{ name: 'description', content: product.description.slice(0, 160) }]
          : [])
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            productJsonLd(product, { url: `/productos/${params.handle}` })
          )
        }
      ]
    }
  },
  component: ProductoPagina
})

function GaleriaFotos({ product }: { product: Product }) {
  const fotos = product.images?.length
    ? product.images.map((i) => i.url)
    : product.thumbnail
      ? [product.thumbnail]
      : []

  if (fotos.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-muted">
        <span className="text-sm uppercase tracking-widest text-muted-foreground">
          {product.title}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Primera foto con prioridad: es lo primero que pesa en la página. */}
      <div className="overflow-hidden rounded-2xl bg-card">
        <img
          src={fotos[0]}
          alt={product.title}
          className="aspect-[4/5] w-full object-cover"
          fetchPriority="high"
        />
      </div>
      {fotos.length > 1 && (
        <div className="grid grid-cols-3 gap-4">
          {fotos.slice(1, 4).map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-card">
              <img
                src={src}
                alt={`${product.title} — vista ${i + 2}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductoPagina() {
  const { product } = Route.useLoaderData()
  const precio = displayPrice(product)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Link
        to="/tienda"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="lg:order-1">
          <GaleriaFotos product={product} />
        </div>

        <div className="lg:order-2">
          {/* 1. Qué es y por qué importa — antes de cualquier especificación. */}
          {product.collection?.title && (
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              {product.collection.title}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {product.subtitle}
            </p>
          )}

          {/* Precio HORNEADO en el HTML (legible sin JS). El autoritativo, igual, es el del carrito. */}
          {precio && (
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(precio.amount, precio.currency, LOCALE)}
              </span>
              {precio.onSale && precio.original != null && (
                <span className="text-base tabular-nums text-muted-foreground line-through">
                  {formatPrice(precio.original, precio.currency, LOCALE)}
                </span>
              )}
            </div>
          )}

          {/* 3. La decisión de compra sin fricción — cliente (carrito en localStorage). */}
          <div className="mt-8">
            <ClientOnly fallback={<div className="h-40 rounded-xl bg-muted/40" />}>
              <SelectorCompra product={product} />
            </ClientOnly>
          </div>

          {/* 4. El detalle, para quien baja. */}
          {product.description && (
            <div className="mt-12 border-t border-border pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Los detalles
              </h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. La marca alrededor: cierre editorial, no un carrusel de "también te puede gustar". */}
      <section className="mx-auto mt-24 max-w-2xl border-t border-border pt-16 text-center">
        <p className="text-2xl font-medium leading-snug text-balance">
          Lo hacemos en tandas cortas y lo revisamos pieza por pieza. Por eso no hay mil, y por
          eso dura.
        </p>
      </section>
    </main>
  )
}
