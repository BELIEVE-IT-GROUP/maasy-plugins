// Validador de panel.v1 (contrato-tabs-panel.md §2 y §3). Puro: sin motor, sin Node, sin URL (el mod no los tiene).
// Valida POR PARTES: la cabecera y después cada bloque; descarta solo el bloque que no pasa (regla 3).
// Los topes de §2 recortan con "…" (textos) o descartan (ítems de más); no rompen la tab.

export type Tono = 'ok' | 'info' | 'warn' | 'error' | 'neutro'
export type Pedido = { tipo: 'pedido'; etiqueta: string; texto: string }
export type Enlace = { tipo: 'enlace'; etiqueta: string; url: string }
export type Accion = Pedido | Enlace
export type Chip = { texto: string; tono?: Tono }
export type Bloque =
  | { tipo: 'estado'; titulo: string; valor: string; tono?: Tono; detalle?: string; accion?: Accion }
  | { tipo: 'pasos'; titulo?: string; actual?: number; items: { titulo: string; estado: 'hecho' | 'actual' | 'pendiente' }[] }
  | {
      tipo: 'checklist'
      titulo?: string
      items: { id: string; grupo?: string; titulo: string; estado: 'ok' | 'falta' | 'no-aplica'; detalle?: string; accion?: Pedido }[]
    }
  | { tipo: 'filas'; titulo?: string; items: { titulo: string; detalle?: string; chip?: Chip; accion?: Accion }[] }
  | { tipo: 'kv'; titulo?: string; items: { clave: string; valor: string }[] }
  | { tipo: 'metricas'; titulo?: string; items: { etiqueta: string; valor: string; delta?: string; tono?: Tono }[] }
  | { tipo: 'aviso'; texto: string; tono?: Tono; accion?: Accion }
  | { tipo: 'enlace'; titulo?: string; items: Enlace[] }
  | { tipo: 'vacio'; texto: string; accion?: Pedido }
export type Franja = { texto: string; paso?: Accion }
export type PanelV1 = { version: 1; tab: { id: string; titulo: string; orden: number }; updated_at: string; franja?: Franja; bloques: Bloque[] }

export type Resultado =
  | { ok: true; panel: PanelV1; descartados: number }
  | { ok: false; motivo: 'version' | 'formato'; texto: string }

export const TOPES = { bloques: 12, corto: 60, largo: 280, pedido: 500, pasos: 30, checklist: 30, filas: 20, kv: 12, metricas: 6, enlaces: 12, bytes: 32 * 1024 }
const TONOS = ['ok', 'info', 'warn', 'error', 'neutro']
const NO = Symbol('no')
type V<T> = T | typeof NO
const esObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Solo llaves conocidas (additionalProperties: false) y las requeridas presentes. */
const forma = (v: unknown, req: string[], opt: string[]): v is Record<string, unknown> =>
  esObj(v) && req.every((k) => k in v) && Object.keys(v).every((k) => req.includes(k) || opt.includes(k))

/** Caracteres de control: C0 (ANSI, OSC 8), DEL y C1. Un texto de tercero que los trae no se pinta: abre formato o hipervínculos en la terminal. */
const CONTROL = /[\x00-\x1f\x7f-\x9f]/
export const limpio = (s: string): boolean => !CONTROL.test(s)

/** Texto con tope: recorta con "…". Con caracteres de control, NO (el bloque se descarta). */
const txt = (v: unknown, max: number): V<string> => (typeof v === 'string' && limpio(v) ? (v.length > max ? v.slice(0, max - 1) + '…' : v) : NO)
const opc = <T>(o: Record<string, unknown>, k: string, f: (v: unknown) => V<T>): V<T | undefined> => {
  if (!(k in o)) return undefined
  return f(o[k])
}
const tono = (v: unknown): V<Tono> => (typeof v === 'string' && TONOS.includes(v) ? (v as Tono) : NO)
/** URL completa: https, sin espacios, sin control y sin barra invertida (el navegador la leería como "/"). */
export const URL_HTTPS = /^https:\/\/[^\s\\\x00-\x1f\x7f-\x9f]+$/

function pedido(v: unknown): V<Pedido> {
  if (!forma(v, ['tipo', 'etiqueta', 'texto'], []) || v.tipo !== 'pedido') return NO
  const etiqueta = txt(v.etiqueta, TOPES.corto)
  const texto = txt(v.texto, TOPES.pedido)
  return etiqueta === NO || texto === NO ? NO : { tipo: 'pedido', etiqueta, texto }
}
function enlace(v: unknown): V<Enlace> {
  if (!forma(v, ['tipo', 'etiqueta', 'url'], []) || v.tipo !== 'enlace') return NO
  const etiqueta = txt(v.etiqueta, TOPES.corto)
  return etiqueta === NO || typeof v.url !== 'string' || !URL_HTTPS.test(v.url) ? NO : { tipo: 'enlace', etiqueta, url: v.url }
}
const accion = (v: unknown): V<Accion> => (esObj(v) && v.tipo === 'enlace' ? enlace(v) : pedido(v))

function chip(v: unknown): V<Chip> {
  if (!forma(v, ['texto'], ['tono'])) return NO
  const texto = txt(v.texto, 24)
  const t = opc(v, 'tono', tono)
  return texto === NO || t === NO ? NO : { texto, ...(t ? { tono: t } : {}) }
}

/** Lista con tope: ítems de más se descartan; un ítem malo hace malo el bloque (como el schema). */
function lista<T>(v: unknown, max: number, item: (x: unknown) => V<T>): V<T[]> {
  if (!Array.isArray(v)) return NO
  const out: T[] = []
  for (const x of v.slice(0, max)) {
    const i = item(x)
    if (i === NO) return NO
    out.push(i)
  }
  return out
}

/** Los ids de un checklist son las keys de la UI: un id repetido se descarta (queda el primero). */
function unicos(v: V<unknown[]>): V<unknown[]> {
  if (v === NO) return NO
  const vistos = new Set<string>()
  return v.filter((x) => {
    const id = (x as { id: string }).id
    return !vistos.has(id) && !!vistos.add(id)
  })
}

/** Arma un objeto sin las llaves undefined; NO si algún campo salió NO. */
// deno-lint-ignore no-explicit-any
function armar<T = any>(campos: Record<string, unknown>): V<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(campos)) {
    if (v === NO) return NO
    if (v !== undefined) out[k] = v
  }
  return out as T
}

export function bloque(v: unknown): V<Bloque> {
  if (!esObj(v) || typeof v.tipo !== 'string') return NO
  const t = v.tipo
  const corto = (x: unknown) => txt(x, TOPES.corto)
  const largo = (x: unknown) => txt(x, TOPES.largo)
  switch (t) {
    case 'estado':
      if (!forma(v, ['tipo', 'titulo', 'valor'], ['tono', 'detalle', 'accion'])) return NO
      return armar({ tipo: t, titulo: corto(v.titulo), valor: corto(v.valor), tono: opc(v, 'tono', tono), detalle: opc(v, 'detalle', largo), accion: opc(v, 'accion', accion) })
    case 'pasos':
      if (!forma(v, ['tipo', 'items'], ['titulo', 'actual'])) return NO
      return armar({
        tipo: t,
        titulo: opc(v, 'titulo', corto),
        actual: opc(v, 'actual', (x) => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : NO)),
        items: lista(v.items, TOPES.pasos, (x) => {
          if (!forma(x, ['titulo', 'estado'], []) || !['hecho', 'actual', 'pendiente'].includes(x.estado as string)) return NO
          return armar({ titulo: corto(x.titulo), estado: x.estado })
        })
      })
    case 'checklist':
      if (!forma(v, ['tipo', 'items'], ['titulo'])) return NO
      return armar({
        tipo: t,
        titulo: opc(v, 'titulo', corto),
        items: unicos(lista(v.items, TOPES.checklist, (x) => {
          if (!forma(x, ['id', 'titulo', 'estado'], ['grupo', 'detalle', 'accion']) || !['ok', 'falta', 'no-aplica'].includes(x.estado as string)) return NO
          if (typeof x.id !== 'string' || x.id.length > 40 || !limpio(x.id)) return NO
          return armar({ id: x.id, grupo: opc(x, 'grupo', corto), titulo: corto(x.titulo), estado: x.estado, detalle: opc(x, 'detalle', largo), accion: opc(x, 'accion', pedido) })
        }))
      })
    case 'filas':
      if (!forma(v, ['tipo', 'items'], ['titulo'])) return NO
      return armar({
        tipo: t,
        titulo: opc(v, 'titulo', corto),
        items: lista(v.items, TOPES.filas, (x) => {
          if (!forma(x, ['titulo'], ['detalle', 'chip', 'accion'])) return NO
          return armar({ titulo: corto(x.titulo), detalle: opc(x, 'detalle', largo), chip: opc(x, 'chip', chip), accion: opc(x, 'accion', accion) })
        })
      })
    case 'kv':
      if (!forma(v, ['tipo', 'items'], ['titulo'])) return NO
      return armar({
        tipo: t,
        titulo: opc(v, 'titulo', corto),
        items: lista(v.items, TOPES.kv, (x) => (forma(x, ['clave', 'valor'], []) ? armar({ clave: corto(x.clave), valor: corto(x.valor) }) : NO))
      })
    case 'metricas':
      if (!forma(v, ['tipo', 'items'], ['titulo'])) return NO
      return armar({
        tipo: t,
        titulo: opc(v, 'titulo', corto),
        items: lista(v.items, TOPES.metricas, (x) => {
          if (!forma(x, ['etiqueta', 'valor'], ['delta', 'tono'])) return NO
          return armar({ etiqueta: corto(x.etiqueta), valor: corto(x.valor), delta: opc(x, 'delta', corto), tono: opc(x, 'tono', tono) })
        })
      })
    case 'aviso':
      if (!forma(v, ['tipo', 'texto'], ['tono', 'accion'])) return NO
      return armar({ tipo: t, texto: largo(v.texto), tono: opc(v, 'tono', tono), accion: opc(v, 'accion', accion) })
    case 'enlace':
      if (!forma(v, ['tipo', 'items'], ['titulo'])) return NO
      return armar({ tipo: t, titulo: opc(v, 'titulo', corto), items: lista(v.items, TOPES.enlaces, enlace) })
    case 'vacio':
      if (!forma(v, ['tipo', 'texto'], ['accion'])) return NO
      return armar({ tipo: t, texto: largo(v.texto), accion: opc(v, 'accion', pedido) })
    default:
      return NO // tipo desconocido (p. ej. "imagen", candidato de v2): se descarta sin romper la tab
  }
}

const FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const ID_TAB = /^[a-z][a-z0-9-]{1,23}$/

/** raw: el JSON ya parseado. Cabecera por partes, después cada bloque; un bloque malo se cuenta y se descarta. */
export function validarPanel(raw: unknown, idPlugin: string): Resultado {
  if (!esObj(raw)) return { ok: false, motivo: 'formato', texto: 'Sin datos por ahora' }
  if (raw.version !== 1) return { ok: false, motivo: 'version', texto: `Actualiza el plugin ${idPlugin}` }
  const tab = raw.tab
  const titulo = esObj(tab) ? txt(tab.titulo, 24) : NO
  if (!forma(tab, ['id', 'titulo', 'orden'], []) || typeof tab.id !== 'string' || !ID_TAB.test(tab.id) || titulo === NO || !Number.isInteger(tab.orden) || (tab.orden as number) < 1 || (tab.orden as number) > 999)
    return { ok: false, motivo: 'formato', texto: 'Sin datos por ahora' }
  if (typeof raw.updated_at !== 'string' || !FECHA.test(raw.updated_at) || !Array.isArray(raw.bloques)) return { ok: false, motivo: 'formato', texto: 'Sin datos por ahora' }
  let franja: Franja | undefined
  if (esObj(raw.franja) && forma(raw.franja, ['texto'], ['paso'])) {
    const f = armar<Franja>({ texto: txt(raw.franja.texto, TOPES.largo), paso: opc(raw.franja, 'paso', accion) })
    if (f !== NO) franja = f
  } // una franja mala no tira la tab: se queda sin franja
  const bloques: Bloque[] = []
  let descartados = Math.max(0, raw.bloques.length - TOPES.bloques)
  for (const b of raw.bloques.slice(0, TOPES.bloques)) {
    const ok = bloque(b)
    if (ok === NO) descartados++
    else bloques.push(ok)
  }
  return { ok: true, descartados, panel: { version: 1, tab: { id: tab.id, titulo, orden: tab.orden as number }, updated_at: raw.updated_at, ...(franja ? { franja } : {}), bloques } }
}

/** Origen (https://host) de una URL https, sin la clase URL. Nulo si trae usuario o no es https. */
export function origenDe(url: string): string | null {
  const m = /^(https:\/\/)([^\/?#]*)/.exec(url)
  if (!m || !m[2] || m[2].includes('@')) return null
  return m[1] + m[2].toLowerCase()
}

/** §4: un enlace vale solo si su origen es uno de los del servidor de esa tab. Sin orígenes fijados, ninguno vale. */
export function enlaceValido(url: string, origenes: readonly string[]): boolean {
  const o = origenDe(url)
  return URL_HTTPS.test(url) && !!o && origenes.includes(o)
}

/** Quita las acciones que `vale` rechaza: de cada ítem y acción (queda sin acción) o del bloque `enlace` (sin ítems, se va). */
function filtrarAcciones(p: PanelV1, vale: (a: Accion) => boolean): PanelV1 {
  const ok = (a: Accion | undefined): Accion | undefined => (a && !vale(a) ? undefined : a)
  const sinAccion = <T extends { accion?: Accion }>(x: T): T => {
    const { accion, ...resto } = x
    const a = ok(accion)
    return (a ? { ...resto, accion: a } : resto) as T
  }
  const bloques: Bloque[] = []
  for (const b of p.bloques) {
    if (b.tipo === 'enlace') {
      const items = b.items.filter((i) => vale(i))
      if (items.length) bloques.push({ ...b, items })
    } else if (b.tipo === 'filas') bloques.push({ ...b, items: b.items.map(sinAccion) })
    else if (b.tipo === 'checklist') bloques.push({ ...b, items: b.items.map(sinAccion) })
    else if (b.tipo === 'estado' || b.tipo === 'aviso' || b.tipo === 'vacio') bloques.push(sinAccion(b as { accion?: Accion } & Bloque) as Bloque)
    else bloques.push(b)
  }
  const franja = p.franja ? sinAccionPaso(p.franja, ok) : undefined
  const { franja: _f, ...base } = p
  return { ...base, bloques, ...(franja ? { franja } : {}) }
}
function sinAccionPaso(f: Franja, ok: (a: Accion | undefined) => Accion | undefined): Franja {
  const { paso, ...resto } = f
  const a = ok(paso)
  return a ? { ...resto, paso: a } : resto
}

/** §4: quita los enlaces cuyo origen no está en la lista de la tab. */
export const filtrarEnlaces = (p: PanelV1, origenes: readonly string[]): PanelV1 => filtrarAcciones(p, (a) => a.tipo !== 'enlace' || enlaceValido(a.url, origenes))

/** Regla 4: un `pedido` que empieza con `/` es un comando, y tiene que ser del propio plugin (`/<plugin>:...`). Una frase pasa. */
export const filtrarPedidos = (p: PanelV1, plugin: string): PanelV1 =>
  filtrarAcciones(p, (a) => a.tipo !== 'pedido' || !a.texto.startsWith('/') || a.texto.startsWith(`/${plugin}:`))
