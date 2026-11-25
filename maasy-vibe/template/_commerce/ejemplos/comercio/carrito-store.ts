// Store del carrito, 100% del cliente. El `cart.id` vive en localStorage; los TOTALES los
// calcula siempre el servidor (nunca se suman líneas a mano). Cada operación rehidrata el
// estado con el carrito que devuelve el Store API.
//
// Es un singleton con useSyncExternalStore en vez de Context: así el carrito se comparte
// entre rutas sin envolver el árbol, y el snapshot del servidor es estable (carrito vacío),
// lo que evita mismatches de hidratación. Todo lo que muestre el contenido del carrito se
// monta dentro de <ClientOnly> — este módulo NUNCA toca localStorage durante el render.
//
// ⓘ SCAFFOLD: la lógica del carrito es del starter (probada, no se reescribe). Vístela con
//   la marca; no cambies el flujo.

import { useSyncExternalStore } from 'react'
import { becommerce, type Cart } from '@/lib/becommerce'
import { CARRITO_KEY, resolverRegion } from './config'

export type EstadoCarrito = 'inicial' | 'cargando' | 'listo' | 'error'

export interface SnapshotCarrito {
  cart: Cart | null
  estado: EstadoCarrito
  error: string | null
  /** Suma de cantidades: para el badge del ícono del carrito. */
  unidades: number
}

const VACIO: SnapshotCarrito = { cart: null, estado: 'inicial', error: null, unidades: 0 }

let snapshot: SnapshotCarrito = VACIO
const suscriptores = new Set<() => void>()

function emitir(next: Partial<SnapshotCarrito>) {
  const cart = next.cart !== undefined ? next.cart : snapshot.cart
  const unidades = (cart?.items ?? []).reduce((n, it) => n + (it.quantity ?? 0), 0)
  snapshot = { ...snapshot, ...next, cart, unidades }
  for (const fn of suscriptores) fn()
}

function leerId(): string | null {
  try {
    return localStorage.getItem(CARRITO_KEY)
  } catch {
    return null
  }
}

function guardarId(id: string | null) {
  try {
    if (id) localStorage.setItem(CARRITO_KEY, id)
    else localStorage.removeItem(CARRITO_KEY)
  } catch {
    /* modo incógnito o storage bloqueado: el carrito vive solo en memoria esta sesión */
  }
}

let hidratado = false

/** Rehidrata el carrito desde localStorage al arrancar en el cliente. Idempotente. Un
 *  carrito muerto (404) se descarta y se limpia la clave. */
export async function hidratarCarrito(): Promise<void> {
  if (hidratado) return
  hidratado = true
  const id = leerId()
  if (!id) return
  emitir({ estado: 'cargando' })
  try {
    const cart = await becommerce.getCart(id)
    if (cart) emitir({ cart, estado: 'listo', error: null })
    else {
      guardarId(null)
      emitir({ cart: null, estado: 'inicial' })
    }
  } catch (e) {
    emitir({ estado: 'error', error: mensaje(e) })
  }
}

/** Garantiza un carrito para agregar líneas: reusa el de localStorage o crea uno nuevo. */
async function asegurarCarrito(): Promise<Cart> {
  const id = leerId()
  if (id) {
    const existente = await becommerce.getCart(id)
    if (existente) return existente
    guardarId(null)
  }
  const region = await resolverRegion()
  if (!region) throw new Error('La tienda no tiene una región configurada.')
  const cart = await becommerce.createCart(region.id)
  guardarId(cart.id)
  return cart
}

async function conCarrito(fn: (cart: Cart) => Promise<Cart>): Promise<void> {
  emitir({ estado: 'cargando', error: null })
  try {
    const base = await asegurarCarrito()
    const cart = await fn(base)
    emitir({ cart, estado: 'listo', error: null })
  } catch (e) {
    emitir({ estado: 'error', error: mensaje(e) })
  }
}

export function agregar(variantId: string, quantity = 1): Promise<void> {
  return conCarrito((cart) => becommerce.addLineItem(cart.id, variantId, quantity))
}

export function cambiarCantidad(lineId: string, quantity: number): Promise<void> {
  if (quantity <= 0) return quitar(lineId)
  return conCarrito((cart) => becommerce.updateLineItem(cart.id, lineId, quantity))
}

export function quitar(lineId: string): Promise<void> {
  return conCarrito((cart) => becommerce.removeLineItem(cart.id, lineId))
}

/** Relee el carrito del servidor: la revalidación de precio ANTES de cobrar sale de acá. */
export async function revalidar(): Promise<Cart | null> {
  const id = leerId()
  if (!id) return null
  const cart = await becommerce.getCart(id)
  emitir({ cart, estado: cart ? 'listo' : 'inicial' })
  if (!cart) guardarId(null)
  return cart
}

/** Tras una orden confirmada (type === 'order') el carrito ya no sirve: se limpia. */
export function vaciarTrasOrden(): void {
  guardarId(null)
  hidratado = true
  emitir({ cart: null, estado: 'inicial', error: null })
}

function mensaje(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo salió mal con el carrito.'
}

function subscribe(fn: () => void): () => void {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

function getSnapshot(): SnapshotCarrito {
  return snapshot
}

// El servidor (prerender) siempre ve el carrito vacío: estable, sin localStorage.
function getServerSnapshot(): SnapshotCarrito {
  return VACIO
}

/** Hook para leer el carrito en cualquier componente client-only. */
export function useCarrito(): SnapshotCarrito {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
