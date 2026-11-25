// EL CHECKOUT CANÓNICO. Componente de plataforma: escrito y probado una vez, se COMPONE
// (tipografía, colores, textos, orden visual) pero NO se reescribe el flujo. Un checkout
// roto no falla como una landing rota: falla cobrando de más o perdiendo la orden.
//
// El flujo, en este orden, contra el Store API (ver skill becommerce-storefront):
//   bolsa → datos + dirección → envío → pago → revalidar precio → completar
// Solo `type === 'order'` es una venta. Con `type === 'cart'` el carrito sigue vivo: se
// muestra el error y el usuario reintenta, nunca se pierde lo que cargó.
//
// ⓘ SCAFFOLD: vístelo con la marca. No cambies el orden de los pasos, no saltes la
//   revalidación de precio, no reimplementes el manejo de `complete`.

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  becommerce,
  formatPrice,
  type Address,
  type Cart,
  type Order,
  type PaymentProvider,
  type Region,
  type ShippingOption
} from '@/lib/becommerce'
import { LOCALE } from './config'
import { revalidar, useCarrito, vaciarTrasOrden } from './carrito-store'
import { BolsaVacia, Carrito } from './Carrito'

type Paso = 'bolsa' | 'datos' | 'envio' | 'pago' | 'confirmar'

const DIRECCION_VACIA: Address = {
  first_name: '',
  last_name: '',
  address_1: '',
  city: '',
  postal_code: '',
  country_code: ''
}

export function Checkout() {
  const { cart, estado } = useCarrito()
  const [paso, setPaso] = useState<Paso>('bolsa')
  const [orden, setOrden] = useState<Order | null>(null)

  // Orden confirmada: la pantalla de gracias, con la voz de la marca.
  if (orden) return <Confirmacion orden={orden} />

  if (estado === 'cargando' && !cart) return <Cargando />
  if (!cart || (cart.items?.length ?? 0) === 0) {
    return (
      <div>
        <BolsaVacia />
        <div className="text-center">
          <Link
            to="/tienda"
            className="inline-flex min-h-11 items-center rounded-xl bg-foreground px-6 text-sm font-semibold text-background"
          >
            Ver el catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0">
        <Pasos actual={paso} />
        {paso === 'bolsa' && (
          <Seccion titulo="Tu bolsa">
            <Carrito cart={cart} />
            <BotonPrincipal onClick={() => setPaso('datos')}>Continuar</BotonPrincipal>
          </Seccion>
        )}
        {paso === 'datos' && (
          <PasoDatos cart={cart} onListo={() => setPaso('envio')} onVolver={() => setPaso('bolsa')} />
        )}
        {paso === 'envio' && (
          <PasoEnvio cart={cart} onListo={() => setPaso('pago')} onVolver={() => setPaso('datos')} />
        )}
        {paso === 'pago' && (
          <PasoPago cart={cart} onListo={() => setPaso('confirmar')} onVolver={() => setPaso('envio')} />
        )}
        {paso === 'confirmar' && (
          <PasoConfirmar cart={cart} onOrden={setOrden} onVolver={() => setPaso('pago')} />
        )}
      </div>

      {/* Resumen siempre visible: los cargos aparecen ANTES de pedir la tarjeta. */}
      <aside className="lg:sticky lg:top-8 lg:h-fit">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen
          </h2>
          <Carrito cart={cart} soloLectura />
        </div>
      </aside>
    </div>
  )
}

// --- Pasos ---------------------------------------------------------------------------

function PasoDatos({
  cart,
  onListo,
  onVolver
}: {
  cart: Cart
  onListo: () => void
  onVolver: () => void
}) {
  const [email, setEmail] = useState(cart.email ?? '')
  const [dir, setDir] = useState<Address>(cart.shipping_address ?? DIRECCION_VACIA)
  const [region, setRegion] = useState<Region | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cart.region_id) becommerce.getRegion(cart.region_id).then(setRegion).catch(() => {})
  }, [cart.region_id])

  const paises = region?.countries ?? []

  async function continuar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await becommerce.updateCart(cart.id, {
        email,
        shipping_address: dir,
        billing_address: dir
      })
      await revalidar()
      onListo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tus datos.')
    } finally {
      setGuardando(false)
    }
  }

  const set = (campo: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDir((d) => ({ ...d, [campo]: e.target.value }))

  return (
    <Seccion titulo="¿A dónde te lo enviamos?">
      <form onSubmit={continuar} className="space-y-4">
        <Campo label="Correo" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre" htmlFor="nombre">
            <input id="nombre" required value={dir.first_name} onChange={set('first_name')} className={inputCls} />
          </Campo>
          <Campo label="Apellido" htmlFor="apellido">
            <input id="apellido" required value={dir.last_name} onChange={set('last_name')} className={inputCls} />
          </Campo>
        </div>
        <Campo label="Dirección" htmlFor="dir1">
          <input id="dir1" required value={dir.address_1} onChange={set('address_1')} className={inputCls} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Ciudad" htmlFor="ciudad">
            <input id="ciudad" required value={dir.city} onChange={set('city')} className={inputCls} />
          </Campo>
          <Campo label="Código postal" htmlFor="cp">
            <input id="cp" required value={dir.postal_code} onChange={set('postal_code')} className={inputCls} />
          </Campo>
          <Campo label="País" htmlFor="pais">
            {paises.length > 0 ? (
              <select
                id="pais"
                required
                value={dir.country_code}
                onChange={(e) => setDir((d) => ({ ...d, country_code: e.target.value }))}
                className={inputCls}
              >
                <option value="" disabled>
                  Elige
                </option>
                {paises.map((p) => (
                  <option key={p.iso_2} value={p.iso_2}>
                    {p.display_name ?? p.iso_2.toUpperCase()}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="pais"
                required
                placeholder="co"
                value={dir.country_code}
                onChange={(e) => setDir((d) => ({ ...d, country_code: e.target.value.toLowerCase() }))}
                className={inputCls}
              />
            )}
          </Campo>
        </div>
        {error && <ErrorLinea>{error}</ErrorLinea>}
        <NavPasos onVolver={onVolver} textoVolver="Volver a la bolsa">
          <BotonPrincipal type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Continuar al envío'}
          </BotonPrincipal>
        </NavPasos>
      </form>
    </Seccion>
  )
}

function PasoEnvio({
  cart,
  onListo,
  onVolver
}: {
  cart: Cart
  onListo: () => void
  onVolver: () => void
}) {
  const [opciones, setOpciones] = useState<ShippingOption[] | null>(null)
  const [elegida, setElegida] = useState<string>('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const moneda = cart.currency_code ?? 'usd'

  useEffect(() => {
    becommerce
      .getShippingOptions(cart.id)
      .then((o) => {
        setOpciones(o)
        setElegida(o[0]?.id ?? '')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar los envíos.'))
  }, [cart.id])

  async function continuar() {
    if (!elegida) return
    setGuardando(true)
    setError(null)
    try {
      await becommerce.addShippingMethod(cart.id, elegida)
      await revalidar()
      onListo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos aplicar el envío.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Seccion titulo="¿Cómo te lo llevamos?">
      {opciones === null && !error && <Cargando />}
      {opciones !== null && opciones.length === 0 && (
        // Región sin envíos: NO es un bug del frontend. Se dice claro.
        <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm">
          <p className="font-medium">Esta zona todavía no tiene envíos configurados.</p>
          <p className="mt-1 text-muted-foreground">
            Es algo que se ajusta en el panel de la tienda. Escríbenos y lo resolvemos.
          </p>
        </div>
      )}
      {opciones && opciones.length > 0 && (
        <div className="space-y-3">
          {opciones.map((o) => (
            <label
              key={o.id}
              className={[
                'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors',
                elegida === o.id ? 'border-foreground' : 'border-border hover:border-ring'
              ].join(' ')}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="envio"
                  value={o.id}
                  checked={elegida === o.id}
                  onChange={() => setElegida(o.id)}
                  className="accent-foreground"
                />
                <span className="text-sm font-medium">{o.name}</span>
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {o.amount == null ? 'Se calcula' : formatPrice(o.amount, moneda, LOCALE)}
              </span>
            </label>
          ))}
        </div>
      )}
      {error && <ErrorLinea>{error}</ErrorLinea>}
      <NavPasos onVolver={onVolver} textoVolver="Volver a tus datos">
        <BotonPrincipal
          onClick={continuar}
          disabled={guardando || !elegida || (opciones?.length ?? 0) === 0}
        >
          {guardando ? 'Aplicando…' : 'Continuar al pago'}
        </BotonPrincipal>
      </NavPasos>
    </Seccion>
  )
}

function PasoPago({
  cart,
  onListo,
  onVolver
}: {
  cart: Cart
  onListo: () => void
  onVolver: () => void
}) {
  const [proveedores, setProveedores] = useState<PaymentProvider[] | null>(null)
  const [elegido, setElegido] = useState<string>('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cart.region_id) return
    becommerce
      .getPaymentProviders(cart.region_id)
      .then((ps) => {
        const activos = ps.filter((p) => p.is_enabled !== false)
        setProveedores(activos)
        // NUNCA se hardcodea pp_stripe_stripe: se usa el que la tienda tenga de verdad.
        setElegido(activos[0]?.id ?? '')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar los pagos.'))
  }, [cart.region_id])

  const esSandbox = elegido === 'pp_system_default'

  async function continuar() {
    if (!elegido) return
    setGuardando(true)
    setError(null)
    try {
      const pc = await becommerce.createPaymentCollection(cart.id)
      await becommerce.initPaymentSession(pc.id, elegido)
      onListo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos preparar el pago.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Seccion titulo="El pago">
      {proveedores === null && !error && <Cargando />}
      {proveedores && proveedores.length === 0 && (
        <ErrorLinea>Esta tienda todavía no tiene un medio de pago activo.</ErrorLinea>
      )}
      {proveedores && proveedores.length > 0 && (
        <div className="space-y-3">
          {proveedores.map((p) => (
            <label
              key={p.id}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                elegido === p.id ? 'border-foreground' : 'border-border hover:border-ring'
              ].join(' ')}
            >
              <input
                type="radio"
                name="pago"
                value={p.id}
                checked={elegido === p.id}
                onChange={() => setElegido(p.id)}
                className="accent-foreground"
              />
              <span className="text-sm font-medium">
                {p.id === 'pp_system_default' ? 'Pedido de prueba (sandbox)' : p.id}
              </span>
            </label>
          ))}
          {esSandbox && (
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              Esta tienda está en modo sandbox: el pedido se registra <strong>sin cobrar</strong>.
              Para vender de verdad, activa la tienda y conecta tu Stripe desde becommerce.
            </p>
          )}
        </div>
      )}
      {error && <ErrorLinea>{error}</ErrorLinea>}
      <NavPasos onVolver={onVolver} textoVolver="Volver al envío">
        <BotonPrincipal onClick={continuar} disabled={guardando || !elegido}>
          {guardando ? 'Preparando…' : 'Revisar y confirmar'}
        </BotonPrincipal>
      </NavPasos>
    </Seccion>
  )
}

function PasoConfirmar({
  cart,
  onOrden,
  onVolver
}: {
  cart: Cart
  onOrden: (o: Order) => void
  onVolver: () => void
}) {
  const [totalMostrado] = useState<number | undefined>(cart.total)
  const [cambio, setCambio] = useState<{ antes?: number; ahora?: number } | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const moneda = cart.currency_code ?? 'usd'

  async function confirmar() {
    setConfirmando(true)
    setError(null)
    try {
      // REVALIDACIÓN: el total autoritativo es el del carrito del servidor. Si cambió
      // respecto a lo que el usuario venía viendo, se lo mostramos ANTES de cobrar.
      const fresco = await revalidar()
      if (fresco && fresco.total !== totalMostrado && !cambio) {
        setCambio({ antes: totalMostrado, ahora: fresco.total })
        setConfirmando(false)
        return
      }
      const res = await becommerce.completeCart(cart.id)
      if (res.type === 'order') {
        vaciarTrasOrden()
        onOrden(res.order)
      } else {
        // type === 'cart': falló, el carrito sigue vivo. Mostramos el detalle y dejamos reintentar.
        setError(mensajeError(res.error) ?? 'No pudimos completar el pedido. Revisa tus datos y reintenta.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos completar el pedido.')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <Seccion titulo="Confirmar el pedido">
      <p className="text-sm text-muted-foreground">
        Revisa el resumen a la derecha. Al confirmar, registramos tu pedido.
      </p>

      {cambio && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <p className="font-medium">El total se actualizó.</p>
          <p className="mt-1 text-muted-foreground">
            Pasó de {formatPrice(cambio.antes, moneda, LOCALE)} a{' '}
            <strong>{formatPrice(cambio.ahora, moneda, LOCALE)}</strong>. Si estás de acuerdo,
            confirma de nuevo.
          </p>
        </div>
      )}

      {error && <ErrorLinea>{error}</ErrorLinea>}

      <NavPasos onVolver={onVolver} textoVolver="Volver al pago">
        <BotonPrincipal onClick={confirmar} disabled={confirmando}>
          {confirmando ? 'Confirmando…' : 'Confirmar pedido'}
        </BotonPrincipal>
      </NavPasos>
    </Seccion>
  )
}

function Confirmacion({ orden }: { orden: Order }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Listo</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Recibimos tu pedido</h1>
      {orden.display_id != null && (
        <p className="mt-3 text-muted-foreground">
          Es el pedido <span className="font-medium text-foreground">#{orden.display_id}</span>.
        </p>
      )}
      <p className="mt-2 text-muted-foreground">
        {orden.email
          ? `Te escribimos a ${orden.email} con los detalles y el seguimiento.`
          : 'Guarda el número del pedido para cualquier consulta.'}
      </p>
      <div className="mt-8">
        <Link
          to="/tienda"
          className="inline-flex min-h-11 items-center rounded-xl bg-foreground px-6 text-sm font-semibold text-background"
        >
          Seguir mirando
        </Link>
      </div>
    </div>
  )
}

// --- Piezas de UI compartidas --------------------------------------------------------

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40'

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

function Campo({
  label,
  htmlFor,
  children
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function BotonPrincipal({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="min-h-12 rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function NavPasos({
  children,
  onVolver,
  textoVolver
}: {
  children: React.ReactNode
  onVolver: () => void
  textoVolver: string
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={onVolver}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {textoVolver}
      </button>
      {children}
    </div>
  )
}

function Pasos({ actual }: { actual: Paso }) {
  const orden: Paso[] = ['bolsa', 'datos', 'envio', 'pago', 'confirmar']
  const nombres: Record<Paso, string> = {
    bolsa: 'Bolsa',
    datos: 'Datos',
    envio: 'Envío',
    pago: 'Pago',
    confirmar: 'Confirmar'
  }
  const i = orden.indexOf(actual)
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {orden.map((p, idx) => (
        <li key={p} className="flex items-center gap-2">
          <span className={idx <= i ? 'font-medium text-foreground' : ''}>{nombres[p]}</span>
          {idx < orden.length - 1 && <span aria-hidden>·</span>}
        </li>
      ))}
    </ol>
  )
}

function Cargando() {
  return <p className="py-8 text-sm text-muted-foreground">Un momento…</p>
}

function ErrorLinea({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>
}

function mensajeError(error: unknown): string | null {
  if (!error) return null
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error && 'message' in error) {
    const m = (error as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return null
}
