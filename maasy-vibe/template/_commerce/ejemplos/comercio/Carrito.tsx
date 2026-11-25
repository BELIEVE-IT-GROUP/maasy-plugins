// La bolsa: líneas del carrito con sus controles + totales del servidor. Client-only.
// Reutilizable en modo `soloLectura` como resumen dentro del checkout.
//
// ⓘ SCAFFOLD: vístela con la marca. Los totales SIEMPRE salen del servidor (cart.total),
//   nunca se suman a mano.

import { formatPrice, type Cart } from '@/lib/becommerce'
import { LOCALE } from './config'
import { cambiarCantidad, quitar } from './carrito-store'

function Linea({
  item,
  moneda,
  soloLectura
}: {
  item: NonNullable<Cart['items']>[number]
  moneda: string
  soloLectura: boolean
}) {
  return (
    <li className="flex gap-4 py-5">
      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt={item.title ?? ''}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium leading-snug">{item.title}</p>
          <p className="shrink-0 text-sm tabular-nums">
            {formatPrice(item.total ?? (item.unit_price ?? 0) * item.quantity, moneda, LOCALE)}
          </p>
        </div>
        {soloLectura ? (
          <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center rounded-lg border border-border">
              <button
                type="button"
                aria-label="Quitar uno"
                className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => cambiarCantidad(item.id, item.quantity - 1)}
              >
                −
              </button>
              <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
              <button
                type="button"
                aria-label="Sumar uno"
                className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => cambiarCantidad(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() => quitar(item.id)}
            >
              Quitar
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export function Carrito({ cart, soloLectura = false }: { cart: Cart; soloLectura?: boolean }) {
  const moneda = cart.currency_code ?? 'usd'
  const items = cart.items ?? []
  return (
    <div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <Linea key={item.id} item={item} moneda={moneda} soloLectura={soloLectura} />
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border pt-5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Productos</dt>
          <dd className="tabular-nums">{formatPrice(cart.item_total, moneda, LOCALE)}</dd>
        </div>
        {typeof cart.shipping_total === 'number' && cart.shipping_total > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <dt>Envío</dt>
            <dd className="tabular-nums">{formatPrice(cart.shipping_total, moneda, LOCALE)}</dd>
          </div>
        )}
        {typeof cart.tax_total === 'number' && cart.tax_total > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <dt>Impuestos</dt>
            <dd className="tabular-nums">{formatPrice(cart.tax_total, moneda, LOCALE)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(cart.total, moneda, LOCALE)}</dd>
        </div>
      </dl>
    </div>
  )
}

/** Estado vacío de la bolsa: la pantalla que más gente ve. Con la voz de la marca, no
 *  "Tu carrito está vacío". */
export function BolsaVacia() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-medium">Tu bolsa está esperando.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Todavía no elegiste nada. Date una vuelta por el catálogo: hay cosas que valen la pena.
      </p>
    </div>
  )
}
