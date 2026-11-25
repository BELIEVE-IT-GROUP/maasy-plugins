// Cliente del Store API de becommerce (Medusa 2.17 self-hosted de Believe).
//
// La tienda YA existe: es un tenant de becommerce con su propio catálogo, panel y Store
// API. Este archivo es el frente de solo lectura sobre ese catálogo + las operaciones de
// carrito y checkout. No hay base de datos de productos en este proyecto.
//
// Copia este archivo a `src/lib/becommerce.ts` (mismo patrón que `_backend/supabase.ts`)
// y úsalo desde tus loaders y componentes. Es la fuente de verdad de qué funciones
// existen: nunca escribas un `fetch` crudo a la URL a mano ni pegues la publishable key
// en un componente.
//
// Lee el skill `becommerce-storefront` (contrato técnico, endpoint por endpoint) y
// `ecommerce-design` (criterio visual) antes de construir. Los dos, siempre.
//
// --- Las dos variables ---
// Believable las inyecta al publicar; en el preview vienen del `.env` del proyecto:
//   VITE_BECOMMERCE_URL             base del Store API de la tienda
//   VITE_BECOMMERCE_PUBLISHABLE_KEY key del sales channel (pública por diseño, como la
//                                   anon key de Supabase). Va en el header, nunca hardcodeada.
//
// --- La regla de oro del precio ---
// Los precios de Medusa 2 YA vienen en la unidad de la moneda. NUNCA los dividas entre
// 100 (hábito de Medusa v1). `formatPrice` los muestra tal cual. Ver más abajo.

// ---------------------------------------------------------------------------------------
// Tipos: solo lo que se usa de verdad de cada recurso del Store API.
// ---------------------------------------------------------------------------------------

export interface Region {
  id: string
  name: string
  currency_code: string
  countries?: Array<{ iso_2: string; display_name?: string }>
}

/** Precio resuelto de una variante. Solo aparece si la request pasó `region_id`. */
export interface CalculatedPrice {
  /** El precio, EN LA UNIDAD DE LA MONEDA. No se divide entre 100. */
  calculated_amount: number
  /** El "antes", útil solo cuando price_list_type === 'sale'. */
  original_amount?: number
  currency_code: string
  calculated_price?: { price_list_type?: string | null }
}

export interface ProductVariant {
  id: string
  title?: string
  sku?: string | null
  manage_inventory?: boolean
  allow_backorder?: boolean
  /** Solo viene si pediste `+variants.inventory_quantity` en `fields`. */
  inventory_quantity?: number
  options?: Array<{ option_id?: string; value?: string }>
  /** null si la request no pasó región. */
  calculated_price?: CalculatedPrice | null
}

export interface ProductImage {
  id?: string
  url: string
}

export interface ProductOption {
  id: string
  title: string
  values?: Array<{ id?: string; value: string }>
}

export interface ProductCategoryRef {
  id: string
  name?: string
  handle?: string
}

export interface Product {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: ProductImage[]
  options?: ProductOption[]
  collection?: { id: string; title?: string; handle?: string } | null
  categories?: ProductCategoryRef[]
  variants?: ProductVariant[]
}

export interface Collection {
  id: string
  title: string
  handle: string
}

export interface ProductCategory {
  id: string
  name: string
  handle: string
  parent_category_id?: string | null
}

export interface Address {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  /** ISO-2 en minúscula: 'co', 'mx', 'es'. */
  country_code?: string
  province?: string
  phone?: string
}

export interface CartItem {
  id: string
  title?: string
  variant_id?: string
  product_handle?: string
  quantity: number
  unit_price?: number
  total?: number | null
  thumbnail?: string | null
}

export interface Cart {
  id: string
  email?: string | null
  region_id?: string
  currency_code?: string
  items?: CartItem[]
  shipping_address?: Address | null
  billing_address?: Address | null
  /** Totales AUTORITATIVOS: los calcula el servidor. Nunca sumes líneas a mano. */
  item_total?: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  total?: number
}

export interface ShippingOption {
  id: string
  name: string
  /** Puede venir null (opción de precio calculado sin monto fijo). */
  amount?: number | null
  price_type?: string
}

export interface PaymentProvider {
  id: string
  is_enabled?: boolean
}

export interface PaymentCollection {
  id: string
  payment_sessions?: Array<{ id: string; provider_id: string; status?: string }>
}

/** Resultado de completar el carrito. Solo `type === 'order'` es una venta. */
export type CompleteResult =
  | { type: 'order'; order: Order }
  | { type: 'cart'; cart: Cart; error?: unknown }

export interface Order {
  id: string
  display_id?: number
  email?: string | null
  currency_code?: string
  total?: number
  items?: CartItem[]
}

// ---------------------------------------------------------------------------------------
// Configuración y cliente.
// ---------------------------------------------------------------------------------------

export interface BecommerceConfig {
  /** Base del Store API, ej. https://demo-api.becommerce.believe-global.com */
  url: string
  /** Publishable key del sales channel. Pública por diseño. */
  publishableKey: string
}

interface ListResponse<T> {
  count?: number
  offset?: number
  limit?: number
  [key: string]: unknown
  // el recurso viaja bajo su nombre (products, regions, ...) — se lee por clave
  __resource?: T[]
}

export interface ProductQuery {
  regionId: string
  /** Empieza SIEMPRE por `*variants.calculated_price`. Default lo cumple. */
  fields?: string
  limit?: number
  offset?: number
  q?: string
  handle?: string
  collectionId?: string[]
  categoryId?: string[]
  ids?: string[]
  order?: string
  /** country_code habilita calculated_amount_with_tax/without_tax en la respuesta. */
  countryCode?: string
}

/** El `fields` por defecto: precio resuelto de cada variante. Si necesitas stock para el
 *  JSON-LD de disponibilidad, pasa `withInventory: true` a `getProducts`. */
const DEFAULT_FIELDS = '*variants.calculated_price'
const FIELDS_WITH_INVENTORY = '*variants.calculated_price,+variants.inventory_quantity'

/** Lee una VITE_* del entorno de build/preview. Guardado para contextos sin `import.meta.env`
 *  (tests en Node, harness E2E): ahí devuelve undefined y el cliente queda "sin configurar",
 *  en vez de tirar un ReferenceError. */
function readEnv(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    return env?.[key]
  } catch {
    return undefined
  }
}

export function configFromEnv(): BecommerceConfig {
  return {
    url: (readEnv('VITE_BECOMMERCE_URL') ?? '').replace(/\/+$/, ''),
    publishableKey: readEnv('VITE_BECOMMERCE_PUBLISHABLE_KEY') ?? ''
  }
}

export interface BecommerceClient {
  /** ¿Hay tienda vinculada? Si es false, el proyecto todavía no tiene tienda: dile al
   *  usuario que la conecte desde Believable en vez de inventar datos. En un loader,
   *  devuelve estado vacío para que el prerender no se rompa. */
  isConfigured(): boolean

  /** Fetch base sobre `/store/*` con el header y el parseo ya puestos. Úsalo si te falta
   *  un endpoint; nunca escribas un fetch crudo a la URL a mano. Lanza si la respuesta no
   *  es 2xx (404 lo dejas pasar con `allow404`). */
  request<T>(path: string, init?: RequestInit & { allow404?: boolean }): Promise<T | null>

  getRegions(): Promise<Region[]>
  getRegion(id: string): Promise<Region | null>

  getProducts(
    query: ProductQuery & { withInventory?: boolean }
  ): Promise<{ products: Product[]; count: number }>
  /** Todo el catálogo, paginado hasta `count`. Para hornear el listado completo en el build. */
  getAllProducts(
    query: Omit<ProductQuery, 'offset'> & { withInventory?: boolean; pageSize?: number }
  ): Promise<Product[]>
  /** PDP por handle (la URL bonita). null = no existe (404 de la ruta). */
  getProductByHandle(
    handle: string,
    query: Omit<ProductQuery, 'handle'> & { withInventory?: boolean }
  ): Promise<Product | null>

  getCollections(): Promise<Collection[]>
  getCategories(): Promise<ProductCategory[]>

  createCart(regionId: string, email?: string): Promise<Cart>
  getCart(id: string): Promise<Cart | null>
  updateCart(
    id: string,
    body: { email?: string; shipping_address?: Address; billing_address?: Address }
  ): Promise<Cart>
  addLineItem(cartId: string, variantId: string, quantity: number): Promise<Cart>
  updateLineItem(cartId: string, lineId: string, quantity: number): Promise<Cart>
  removeLineItem(cartId: string, lineId: string): Promise<Cart>

  getShippingOptions(cartId: string): Promise<ShippingOption[]>
  addShippingMethod(cartId: string, optionId: string): Promise<Cart>

  getPaymentProviders(regionId: string): Promise<PaymentProvider[]>
  createPaymentCollection(cartId: string): Promise<PaymentCollection>
  initPaymentSession(paymentCollectionId: string, providerId: string): Promise<PaymentCollection>

  completeCart(cartId: string): Promise<CompleteResult>
}

/** Crea un cliente. Sin argumento lee la config del entorno (`VITE_BECOMMERCE_*`); con
 *  config explícita sirve para tests y para el harness E2E contra la tienda demo. */
export function createBecommerce(config: BecommerceConfig = configFromEnv()): BecommerceClient {
  const base = config.url.replace(/\/+$/, '')
  const key = config.publishableKey

  async function request<T>(
    path: string,
    init: RequestInit & { allow404?: boolean } = {}
  ): Promise<T | null> {
    if (!base || !key) {
      throw new Error(
        'La tienda no está configurada: faltan VITE_BECOMMERCE_URL / VITE_BECOMMERCE_PUBLISHABLE_KEY. ' +
          'Conéctala desde Believable antes de leer el catálogo.'
      )
    }
    const { allow404, headers, ...rest } = init
    const res = await fetch(`${base}${path}`, {
      ...rest,
      headers: {
        // El header en TODAS las requests. Sin él, el Store API responde 400 sin explicar.
        'x-publishable-api-key': key,
        ...(rest.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      }
    })
    if (res.status === 404 && allow404) return null
    if (!res.ok) {
      let detail = ''
      try {
        detail = (await res.text()).slice(0, 300)
      } catch {
        /* sin cuerpo */
      }
      throw new Error(`Store API respondió ${res.status} en ${path}${detail ? `: ${detail}` : ''}`)
    }
    return (await res.json()) as T
  }

  function qs(params: Record<string, string | number | string[] | undefined>): string {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue
      if (Array.isArray(v)) {
        for (const item of v) sp.append(`${k}[]`, item)
      } else {
        sp.set(k, String(v))
      }
    }
    const s = sp.toString()
    return s ? `?${s}` : ''
  }

  function productParams(query: ProductQuery & { withInventory?: boolean }) {
    return {
      region_id: query.regionId,
      fields: query.fields ?? (query.withInventory ? FIELDS_WITH_INVENTORY : DEFAULT_FIELDS),
      limit: query.limit,
      offset: query.offset,
      q: query.q,
      handle: query.handle,
      order: query.order,
      country_code: query.countryCode,
      'collection_id': query.collectionId,
      'category_id': query.categoryId,
      id: query.ids
    }
  }

  const client: BecommerceClient = {
    isConfigured: () => Boolean(base && key),

    request,

    async getRegions() {
      const data = await request<{ regions: Region[] }>('/store/regions')
      return data?.regions ?? []
    },

    async getRegion(id) {
      const data = await request<{ region: Region }>(
        `/store/regions/${encodeURIComponent(id)}`,
        { allow404: true }
      )
      return data?.region ?? null
    },

    async getProducts(query) {
      const data = await request<{ products: Product[]; count: number }>(
        `/store/products${qs(productParams(query))}`
      )
      return { products: data?.products ?? [], count: data?.count ?? 0 }
    },

    async getAllProducts(query) {
      const pageSize = query.pageSize ?? 100
      const out: Product[] = []
      let offset = 0
      // Pagina hasta llegar a count: no asumas que caben todos en una página.
      for (;;) {
        const { products, count } = await this.getProducts({ ...query, limit: pageSize, offset })
        out.push(...products)
        offset += products.length
        if (products.length === 0 || out.length >= count) break
      }
      return out
    },

    async getProductByHandle(handle, query) {
      const { products } = await this.getProducts({ ...query, handle, limit: 1 })
      return products[0] ?? null
    },

    async getCollections() {
      const data = await request<{ collections: Collection[] }>('/store/collections?limit=100')
      return data?.collections ?? []
    },

    async getCategories() {
      // OJO: el endpoint es /store/product-categories. /store/categories NO existe (404).
      const data = await request<{ product_categories: ProductCategory[] }>(
        '/store/product-categories?limit=100'
      )
      return data?.product_categories ?? []
    },

    async createCart(regionId, email) {
      const data = await request<{ cart: Cart }>('/store/carts', {
        method: 'POST',
        body: JSON.stringify({ region_id: regionId, ...(email ? { email } : {}) })
      })
      return data!.cart
    },

    async getCart(id) {
      const data = await request<{ cart: Cart }>(
        `/store/carts/${encodeURIComponent(id)}`,
        { allow404: true }
      )
      return data?.cart ?? null
    },

    async updateCart(id, body) {
      const data = await request<{ cart: Cart }>(`/store/carts/${encodeURIComponent(id)}`, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      return data!.cart
    },

    async addLineItem(cartId, variantId, quantity) {
      const data = await request<{ cart: Cart }>(
        `/store/carts/${encodeURIComponent(cartId)}/line-items`,
        { method: 'POST', body: JSON.stringify({ variant_id: variantId, quantity }) }
      )
      return data!.cart
    },

    async updateLineItem(cartId, lineId, quantity) {
      const data = await request<{ cart: Cart }>(
        `/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(lineId)}`,
        { method: 'POST', body: JSON.stringify({ quantity }) }
      )
      return data!.cart
    },

    async removeLineItem(cartId, lineId) {
      // DELETE devuelve { parent: cart } (Medusa 2). Rehidrata con eso.
      const data = await request<{ parent?: Cart; cart?: Cart }>(
        `/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(lineId)}`,
        { method: 'DELETE' }
      )
      const cart = data?.parent ?? data?.cart
      if (!cart) throw new Error('El servidor no devolvió el carrito tras quitar la línea.')
      return cart
    },

    async getShippingOptions(cartId) {
      const data = await request<{ shipping_options: ShippingOption[] }>(
        `/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`
      )
      return data?.shipping_options ?? []
    },

    async addShippingMethod(cartId, optionId) {
      const data = await request<{ cart: Cart }>(
        `/store/carts/${encodeURIComponent(cartId)}/shipping-methods`,
        { method: 'POST', body: JSON.stringify({ option_id: optionId }) }
      )
      return data!.cart
    },

    async getPaymentProviders(regionId) {
      const data = await request<{ payment_providers: PaymentProvider[] }>(
        `/store/payment-providers?region_id=${encodeURIComponent(regionId)}`
      )
      return data?.payment_providers ?? []
    },

    async createPaymentCollection(cartId) {
      const data = await request<{ payment_collection: PaymentCollection }>(
        '/store/payment-collections',
        { method: 'POST', body: JSON.stringify({ cart_id: cartId }) }
      )
      return data!.payment_collection
    },

    async initPaymentSession(paymentCollectionId, providerId) {
      const data = await request<{ payment_collection: PaymentCollection }>(
        `/store/payment-collections/${encodeURIComponent(paymentCollectionId)}/payment-sessions`,
        { method: 'POST', body: JSON.stringify({ provider_id: providerId }) }
      )
      return data!.payment_collection
    },

    async completeCart(cartId) {
      const data = await request<CompleteResult>(
        `/store/carts/${encodeURIComponent(cartId)}/complete`,
        { method: 'POST' }
      )
      return data!
    }
  }

  return client
}

/** Cliente por defecto, configurado desde el entorno (`VITE_BECOMMERCE_*`). Es el que
 *  usan tus loaders y componentes. */
export const becommerce: BecommerceClient = createBecommerce()

// ---------------------------------------------------------------------------------------
// Helpers puros (sin red): precio, precio de una variante, región, disponibilidad, JSON-LD.
// ---------------------------------------------------------------------------------------

/** Formatea un importe de Medusa. NO divide entre 100: el número ya viene en la unidad de
 *  la moneda. Un producto de $25 se guarda como 25, no como 2500. */
export function formatPrice(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
  locale = 'es-CO'
): string {
  if (amount == null || !currencyCode) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode.toUpperCase()
  }).format(amount)
}

/** La variante que decide el precio a mostrar (la primera con precio resuelto). */
export function primaryVariant(product: Product): ProductVariant | undefined {
  return product.variants?.find((v) => v.calculated_price != null) ?? product.variants?.[0]
}

/** Precio "desde" del producto: el menor de sus variantes. Para la card del listado. */
export function displayPrice(
  product: Product
): { amount: number; currency: string; onSale: boolean; original?: number } | null {
  const priced = (product.variants ?? [])
    .map((v) => v.calculated_price)
    .filter((p): p is CalculatedPrice => p != null)
  if (priced.length === 0) return null
  const cheapest = priced.reduce((a, b) => (a.calculated_amount <= b.calculated_amount ? a : b))
  // El tachado SOLO existe si Medusa lo dice: price_list_type === 'sale'. No inventes un "antes".
  const onSale = cheapest.calculated_price?.price_list_type === 'sale'
  return {
    amount: cheapest.calculated_amount,
    currency: cheapest.currency_code,
    onSale,
    original: onSale ? cheapest.original_amount : undefined
  }
}

/** Elige la región por moneda; si no la encuentra o no se pide, la primera. */
export function pickRegion(regions: Region[], currencyCode?: string): Region | undefined {
  if (currencyCode) {
    const match = regions.find((r) => r.currency_code?.toLowerCase() === currencyCode.toLowerCase())
    if (match) return match
  }
  return regions[0]
}

/** Disponibilidad de una variante, SOLO con dato real. `undefined` = no se sabe (no pediste
 *  inventory_quantity): en ese caso omite `availability` del JSON-LD, no inventes InStock. */
export function variantAvailability(variant: ProductVariant | undefined): boolean | undefined {
  if (!variant) return undefined
  if (variant.manage_inventory === false) return true
  if (variant.allow_backorder === true) return true
  if (typeof variant.inventory_quantity === 'number') return variant.inventory_quantity > 0
  return undefined
}

const SCHEMA_IN_STOCK = 'https://schema.org/InStock'
const SCHEMA_OUT_OF_STOCK = 'https://schema.org/OutOfStock'

/** JSON-LD `Product` para el head() del PDP. El precio ES el mismo que muestra la página
 *  (si no coinciden, Google lo marca como spam estructurado). */
export function productJsonLd(product: Product, opts: { url: string }): Record<string, unknown> {
  const price = displayPrice(product)
  const variant = primaryVariant(product)
  const available = variantAvailability(variant)
  const offers: Record<string, unknown> = price
    ? {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currency.toUpperCase(),
        url: opts.url,
        ...(available === undefined
          ? {}
          : { availability: available ? SCHEMA_IN_STOCK : SCHEMA_OUT_OF_STOCK })
      }
    : {}
  const sku = variant?.sku
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.description ? { description: product.description } : {}),
    ...(product.thumbnail || product.images?.[0]?.url
      ? { image: product.thumbnail ?? product.images?.[0]?.url }
      : {}),
    ...(sku ? { sku } : {}),
    ...(price ? { offers } : {})
  }
}

/** JSON-LD `ItemList` para el head() del listado, en el orden en que se muestran. */
export function itemListJsonLd(
  products: Product[],
  opts: { urlFor: (handle: string) => string }
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: opts.urlFor(p.handle),
      name: p.title
    }))
  }
}

// El linter no usa ListResponse directamente; lo dejamos exportado para tipar respuestas
// crudas si un componente pagina a mano un recurso que este cliente no envuelve.
export type { ListResponse }
