// LISTADO DE CATÁLOGO — ruta de ejemplo (SSG). Copia este archivo a `src/routes/tienda.tsx`.
//
// El patrón que demuestra, y que el skill becommerce-storefront exige:
//  · el catálogo se resuelve en el `loader` → viaja HORNEADO en el HTML (precio incluido),
//    legible por Google y por un agente comparador sin ejecutar JS;
//  · JSON-LD `ItemList` en el `head()`;
//  · el loader DEGRADA con gracia: si no hay tienda vinculada o el API falla, devuelve
//    vacío y la página muestra su estado vacío — el prerender NUNCA se rompe;
//  · cada PDP se enlaza con <Link> (el prerender descubre rutas siguiendo los <Link>).
//
// Y el criterio de ecommerce-design: RITMO editorial, no una grilla pareja de cards. La
// decisión memorable acá es la masthead tipográfica grande + una pieza ancla que sangra a
// lo ancho antes de la grilla.
//
// ⓘ SCAFFOLD: la copia, la moneda y la dirección de arte son de la marca (design.md). El
//   andamio demuestra la estructura; no lo publiques tal cual.

import { Fragment } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  becommerce,
  displayPrice,
  formatPrice,
  itemListJsonLd,
  type Product
} from '@/lib/becommerce'
import { LOCALE, resolverRegion } from '@/comercio/config'

export const Route = createFileRoute('/tienda')({
  loader: async () => {
    // Sin tienda vinculada: vacío, y la página lo dice. No inventamos productos.
    if (!becommerce.isConfigured()) return { products: [] as Product[] }
    try {
      const region = await resolverRegion()
      if (!region) return { products: [] as Product[] }
      const products = await becommerce.getAllProducts({ regionId: region.id })
      return { products }
    } catch {
      // Un fallo de red en el build no puede tumbar el prerender: degrada a vacío.
      return { products: [] as Product[] }
    }
  },
  head: ({ loaderData }) => {
    const products = loaderData?.products ?? []
    return {
      meta: [{ title: 'Catálogo' }],
      scripts:
        products.length > 0
          ? [
              {
                type: 'application/ld+json',
                children: JSON.stringify(
                  itemListJsonLd(products, { urlFor: (h) => `/productos/${h}` })
                )
              }
            ]
          : []
    }
  },
  component: Tienda
})

function Precio({ product }: { product: Product }) {
  const precio = displayPrice(product)
  if (!precio) return <span className="text-sm text-muted-foreground">Consultar</span>
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-sm font-medium tabular-nums">
        {formatPrice(precio.amount, precio.currency, LOCALE)}
      </span>
      {precio.onSale && precio.original != null && (
        <span className="text-xs tabular-nums text-muted-foreground line-through">
          {formatPrice(precio.original, precio.currency, LOCALE)}
        </span>
      )}
    </span>
  )
}

function Foto({ product, className = '' }: { product: Product; className?: string }) {
  const src = product.thumbnail ?? product.images?.[0]?.url
  if (!src) {
    // Placeholder de la marca cuando falta foto: nunca un cuadro gris de imagen rota.
    return (
      <div className={`grid place-items-center bg-muted ${className}`}>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {product.title.slice(0, 2)}
        </span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={product.title}
      loading="lazy"
      className={`object-cover ${className}`}
    />
  )
}

function Card({ product }: { product: Product }) {
  return (
    <Link to="/productos/$handle" params={{ handle: product.handle }} className="group block">
      <div className="overflow-hidden rounded-xl bg-card">
        <Foto
          product={product}
          className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm leading-snug">{product.title}</h3>
        <Precio product={product} />
      </div>
    </Link>
  )
}

function Tienda() {
  const { products } = Route.useLoaderData()

  if (products.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">El catálogo está en camino</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Todavía no hay productos publicados. Si eres el dueño, cárgalos desde el panel de
          la tienda y vuelve a publicar la app.
        </p>
      </main>
    )
  }

  const [ancla, ...resto] = products

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      {/* Masthead: una sola idea, fija, sin carrusel. La decisión tipográfica es el foco. */}
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          La colección
        </p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-7xl">
          Piezas elegidas, no un estante lleno.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Cada cosa acá está por una razón. Tómate el tiempo: no hay tanto, y eso es a
          propósito.
        </p>
      </header>

      {/* Pieza ancla: sangra a lo ancho, foto grande + texto angosto. Rompe la grilla. */}
      {ancla && (
        <section className="mt-16 grid items-center gap-8 sm:mt-24 lg:grid-cols-[1.4fr_1fr]">
          <Link
            to="/productos/$handle"
            params={{ handle: ancla.handle }}
            className="group block overflow-hidden rounded-2xl bg-card"
          >
            <Foto
              product={ancla}
              className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              Destacado
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{ancla.title}</h2>
            {ancla.subtitle && (
              <p className="mt-3 text-muted-foreground">{ancla.subtitle}</p>
            )}
            <div className="mt-5">
              <Precio product={ancla} />
            </div>
            <Link
              to="/productos/$handle"
              params={{ handle: ancla.handle }}
              className="mt-8 inline-flex min-h-11 items-center rounded-xl border border-border px-6 text-sm font-medium transition-colors hover:border-ring"
            >
              Ver la pieza
            </Link>
          </div>
        </section>
      )}

      {/* El resto, con ritmo: cada 6 productos, una pausa editorial en vez de más cards. */}
      {resto.length > 0 && (
        <section className="mt-20 sm:mt-28">
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {resto.map((product, i) => (
              <Fragment key={product.id}>
                <div className={i % 6 === 2 ? 'col-span-2 lg:col-span-1' : ''}>
                  <Card product={product} />
                </div>
                {i % 6 === 5 && i < resto.length - 1 && (
                  <p className="col-span-2 border-t border-border pt-12 text-2xl font-medium leading-snug text-balance lg:col-span-3">
                    Hecho para durar, no para reemplazarse la próxima temporada.
                  </p>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
