// CARRITO + CHECKOUT — ruta de ejemplo. Copia a `src/routes/carrito.tsx`.
//
// Todo acá es del cliente (lee el cart_id de localStorage), así que va dentro de
// <ClientOnly>: el prerender genera la cáscara y el carrito real aparece al hidratar. Es la
// convención del template para cualquier cosa que toque window/localStorage.
//
// El checkout que se monta es el CANÓNICO (comercio/Checkout): se viste, no se reescribe.
//
// ⓘ SCAFFOLD: copy y estilo son de la marca.

import { useEffect } from 'react'
import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { Checkout } from '@/comercio/Checkout'
import { hidratarCarrito } from '@/comercio/carrito-store'

export const Route = createFileRoute('/carrito')({
  head: () => ({ meta: [{ title: 'Tu bolsa' }] }),
  component: PaginaCarrito
})

function CheckoutMontado() {
  // Rehidrata el carrito desde localStorage al entrar. Idempotente: no repite si ya corrió.
  useEffect(() => {
    void hidratarCarrito()
  }, [])
  return <Checkout />
}

function PaginaCarrito() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <ClientOnly fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted/30" />}>
        <CheckoutMontado />
      </ClientOnly>
    </main>
  )
}
