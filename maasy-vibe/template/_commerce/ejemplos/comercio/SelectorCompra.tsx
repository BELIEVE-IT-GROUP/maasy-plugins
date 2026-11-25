// La decisión de compra del PDP: elegir variante + cantidad + agregar al carrito.
// Client-only (lee y escribe el store del carrito). Se monta dentro de <ClientOnly> en el
// PDP; el precio y las fotos ya viajan horneados en el HTML por fuera de este componente.
//
// ⓘ SCAFFOLD: vístelo con la marca (el verbo del botón sale de design.md, no "Añadir al
//   carrito"). No cambies que el precio autoritativo es el del carrito del servidor.

import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  formatPrice,
  variantAvailability,
  type Product,
  type ProductVariant
} from '@/lib/becommerce'
import { LOCALE } from './config'
import { agregar, useCarrito } from './carrito-store'

interface Props {
  product: Product
  /** El verbo de la marca. Default honesto; cámbialo por el de design.md. */
  verbo?: string
}

export function SelectorCompra({ product, verbo = 'Agregar a la bolsa' }: Props) {
  const variantes = product.variants ?? []
  const [variantId, setVariantId] = useState<string>(
    () => variantes.find((v) => variantAvailability(v) !== false)?.id ?? variantes[0]?.id ?? ''
  )
  const [cantidad, setCantidad] = useState(1)
  const [agregando, setAgregando] = useState(false)
  const [agregado, setAgregado] = useState(false)
  const { estado, error } = useCarrito()

  const variante: ProductVariant | undefined = useMemo(
    () => variantes.find((v) => v.id === variantId),
    [variantes, variantId]
  )
  const disponible = variantAvailability(variante)
  const precio = variante?.calculated_price
  const sinStock = disponible === false

  async function onAgregar() {
    if (!variantId || sinStock) return
    setAgregando(true)
    setAgregado(false)
    await agregar(variantId, cantidad)
    setAgregando(false)
    setAgregado(true)
  }

  return (
    <div className="space-y-6">
      {variantes.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium">Presentación</p>
          <div className="flex flex-wrap gap-2">
            {variantes.map((v) => {
              const activa = v.id === variantId
              const agotada = variantAvailability(v) === false
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={activa}
                  className={[
                    'min-h-11 rounded-lg border px-4 text-sm transition-colors',
                    activa
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-foreground hover:border-ring',
                    // Agotado no se comunica SOLO por color: lleva el texto tachado.
                    agotada ? 'line-through opacity-50' : ''
                  ].join(' ')}
                >
                  {v.title ?? 'Única'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            aria-label="Quitar uno"
            className="grid h-11 w-11 place-items-center text-lg text-muted-foreground hover:text-foreground"
            onClick={() => setCantidad((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm tabular-nums">{cantidad}</span>
          <button
            type="button"
            aria-label="Sumar uno"
            className="grid h-11 w-11 place-items-center text-lg text-muted-foreground hover:text-foreground"
            onClick={() => setCantidad((n) => n + 1)}
          >
            +
          </button>
        </div>
        {precio && (
          <span className="text-sm text-muted-foreground">
            {formatPrice(precio.calculated_amount, precio.currency_code, LOCALE)} c/u
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onAgregar}
        disabled={agregando || sinStock || !variantId}
        className="min-h-12 w-full rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {sinStock ? 'Sin stock por ahora' : agregando ? 'Agregando…' : verbo}
      </button>

      {sinStock && (
        <p className="text-sm text-muted-foreground">
          Esta presentación está agotada. Escríbenos y te avisamos apenas vuelva.
        </p>
      )}

      {agregado && estado !== 'error' && (
        <p className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Sumado a tu bolsa.</span>
          <Link to="/carrito" className="font-medium underline underline-offset-4">
            Ver la bolsa
          </Link>
        </p>
      )}

      {estado === 'error' && error && (
        <p className="text-sm text-destructive">
          No pudimos agregarlo: {error}. Intenta de nuevo en un momento.
        </p>
      )}
    </div>
  )
}
