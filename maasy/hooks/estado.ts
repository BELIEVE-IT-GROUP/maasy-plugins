// Lógica pura del panel de Maasy (MEC-15 y MEC-16). Sin motor: se prueba con Deno (estado.test.ts).
// El panel lee lo que ya pasa por el chat (resultado de las tools maasy_* y de las <id>_panel) y nunca llama a
// una tool que escriba.
import { enlaceValido, filtrarEnlaces, filtrarPedidos, limpio, SIN_DATOS, type PanelV1, validarPanel } from './panel-v1'

// ---------------- Enlaces permitidos (§4): el origen de cada tab.id lo fija el núcleo, no el plugin ----------------
// Copia fija de la tabla de §4.1 mientras MEC-34 no sirva `ui_origins`. Todas admiten además la Suite.
// La Suite (donde el dueño aprueba, conecta cuentas y ve su Canvas) vive en vibe.maasy.ai: toda tab puede enlazar ahí.
const SUITE = 'https://vibe.maasy.ai'
export const ORIGENES: Record<string, readonly string[]> = {
  maasy: ['https://maasy.ai', SUITE],
  vibe: ['https://app.believable.studio', SUITE],
  motion: [SUITE],
  lens: [SUITE],
  reply: ['https://reply.believe-global.com', SUITE],
  feed: ['https://reply.believe-global.com', SUITE],
  ads: [SUITE],
  aos: ['https://beaos.believe-global.com', SUITE],
  games: ['https://games.maasy.ai', SUITE]
}

/** Orden de §4.1, fijado por el núcleo. `tab.orden` solo vale para un id que no está aquí. */
export const ORDEN: Record<string, number> = { maasy: 10, vibe: 20, motion: 30, lens: 35, reply: 40, feed: 45, ads: 50, aos: 60, games: 70 }

/** Lista cerrada de ids de tab (los de §4.1). Un plugin con otro id no se vuelve tab ni recibe el `brandId`. */
const IDS_TAB: readonly string[] = Object.keys(ORDEN)

// ---------------- Descubrimiento de tabs (§5, spike VERIFIED 2026-11-25) ----------------
export type TabRef = { id: string; plugin: string; key: string; tool: string; server: string }

const PANEL = /^mcp__plugin_([a-z0-9-]+)_([a-z0-9-]+)__([a-z][a-z0-9-]*)_panel$/

/** La tab del núcleo puede venir de cualquier servidor de Maasy: el del plugin, el conector de la cuenta o el que la app de escritorio nombra con un uuid. */
const PANEL_MAASY = /^mcp__.+__(maasy_panel)$/

/** El servidor tal como lo nombra la sesión: lo que va entre `mcp__` y la tool. Es el que existe y al que se conecta. */
const servidorDe = (tool: string): string => tool.slice(5, tool.indexOf('__', 5))

/** De los nombres de `$.tool.list()` a las tabs: `mcp__plugin_<plugin>_<key>__<id>_panel`, solo con los ids de §4.1. `maasy_panel` ("Pedir a Maasy") es la del núcleo: vale la del plugin maasy o la de un conector de Maasy, y su servidor es el que de verdad existe en la sesión. */
export function descubrir(nombres: readonly string[]): TabRef[] {
  const out: TabRef[] = []
  for (const nombre of nombres) {
    const m = PANEL.exec(nombre)
    const [, plugin, key, id] = m ?? []
    if (plugin && key && id && IDS_TAB.includes(id) && (id !== 'maasy' || plugin === 'maasy')) {
      out.push({ id, plugin, key, tool: `${id}_panel`, server: id === 'maasy' ? key : `plugin:${plugin}:${key}` })
      continue
    }
    if (PANEL_MAASY.test(nombre)) out.push({ id: 'maasy', plugin: 'maasy', key: 'maasy', tool: 'maasy_panel', server: servidorDe(nombre) })
  }
  return out
}

/** ¿La tool `e.tool` es de ese servidor? Para refrescar la tab dueña después de cada una de sus tools (regla 6). */
export const esDelServidor = (tool: string, t: Pick<TabRef, 'plugin' | 'key'>): boolean => tool.startsWith(`mcp__plugin_${t.plugin}_${t.key}__`)

export type TabPlugin = { ref: TabRef; panel: PanelV1 | null; aviso: string | null; cargando: boolean }

/** Regla 5: por la tabla de §4.1; `tab.orden` solo para un id fuera de ella (y 999 si no cargó). El empate lo decide el id. */
const lugar = (t: TabPlugin): number => ORDEN[t.ref.id] ?? t.panel?.tab.orden ?? 999
export function ordenar(tabs: TabPlugin[]): TabPlugin[] {
  return [...tabs].sort((a, b) => lugar(a) - lugar(b) || a.ref.id.localeCompare(b.ref.id))
}

/** Un `brandId` de verdad (uuid o slug corto): es lo único que el núcleo manda a los plugins. */
const BRAND_ID = /^[A-Za-z0-9_-]{1,64}$/
export const brandIdValido = (v: unknown): v is string => typeof v === 'string' && BRAND_ID.test(v)

/** La marca activa después de una tool maasy_*: la que crea `create_brand`, o la que otra tool dice (`brand_id`); `delete_my_brand` la quita. */
export function marcaActiva(actual: string | null, tool: string, resultado: unknown): string | null {
  const j = leerJson(resultado)
  if (!esObj(j)) return actual
  if (tool === 'delete_my_brand') return j.borrada === true ? null : actual
  const id = tool === 'create_brand' ? (j.creada === true || j.project_id ? j.project_id : undefined) : j.brand_id
  return brandIdValido(id) ? id : actual
}

/** Un resultado de tool MCP (texto o forma de McpToolResult) a su JSON. Nulo si no hay. */
export function leerJson(r: unknown): unknown {
  const parsear = (t: unknown) => {
    if (typeof t !== 'string') return null
    try {
      return JSON.parse(t)
    } catch {
      return null
    }
  }
  if (typeof r === 'string') return parsear(r)
  if (!r || typeof r !== 'object') return null
  const o = r as { structuredContent?: unknown; content?: unknown }
  if (o.structuredContent && typeof o.structuredContent === 'object') return o.structuredContent
  const bloques = Array.isArray(r) ? r : Array.isArray(o.content) ? o.content : []
  for (const b of bloques) {
    const t = b && typeof b === 'object' && (b as { type?: unknown }).type === 'text' ? (b as { text?: unknown }).text : null
    const j = parsear(t)
    if (j !== null) return j
  }
  return null
}

/** Bytes UTF-8 del JSON de `v` (el tope de §2 es en bytes, no en caracteres). */
export const bytesDe = (v: unknown): number => {
  const j = JSON.stringify(v ?? '') ?? ''
  let n = 0
  for (const c of j) {
    const p = c.codePointAt(0) as number
    n += p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4
  }
  return n
}
const TOPE_BYTES = 32 * 1024

/** La respuesta de una `<id>_panel` a la tab que se dibuja: valida, filtra enlaces y nunca lanza. */
export function tabDeRespuesta(ref: TabRef, r: unknown): { panel: PanelV1 | null; aviso: string | null } {
  if (bytesDe(r) > TOPE_BYTES * 2 + 1024) return { panel: null, aviso: SIN_DATOS } // antes de parsear: la respuesta trae el JSON dos veces (structuredContent y texto)
  const json = leerJson(r)
  if (bytesDe(json) > TOPE_BYTES) return { panel: null, aviso: SIN_DATOS } // §2: 32 KB de JSON
  const res = validarPanel(json, ref.plugin)
  if (!res.ok) return { panel: null, aviso: res.texto }
  // La tab dice quién es: tiene que ser la del servidor que respondió (otro id sería hacerse pasar por otra tab)
  if (res.panel.tab.id !== ref.id) return { panel: null, aviso: SIN_DATOS }
  return { panel: filtrarPedidos(filtrarEnlaces(res.panel, ORIGENES[ref.id] ?? []), ref.plugin), aviso: null }
}

// ---------------- Tabs propias: Crear y Cuenta ----------------
export type Parte = { id: string; estado: 'hecha' | 'a medias' | 'pendiente' }
export type Cupo = { usadas: number; limite: number | null }
export type Crear = {
  interviewId: string | null
  partes: Parte[]
  faltan: string[]
  vence: string | null
  siguiente: string | null
  marca: { nombre: string; url: string | null } | null
}
export type Cuenta = { cupo: Cupo | null; plan: string | null }
export const CREAR_VACIO: Crear = { interviewId: null, partes: [], faltan: [], vence: null, siguiente: null, marca: null }
export const CUENTA_VACIA: Cuenta = { cupo: null, plan: null }

export const NOMBRES: Record<string, string> = {
  identidad: 'Identidad',
  propuesta: 'Propuesta de valor',
  propuesta_de_valor: 'Propuesta de valor',
  icp: 'ICP',
  voz: 'Voz y tono',
  visual: 'Lo visual',
  prueba_social: 'Prueba social'
}
export const nombreDeParte = (id: string): string => NOMBRES[id] ?? (id ? id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ') : '')

const ESTADOS = ['hecha', 'a medias', 'pendiente']
const esObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const cad = (v: unknown): string | null => (typeof v === 'string' && v && limpio(v) ? v : null)

function leerPartes(v: unknown): Parte[] | null {
  if (!Array.isArray(v)) return null
  const out: Parte[] = []
  for (const p of v) {
    if (!esObj(p)) continue
    const id = cad(p.parte) ?? cad(p.id)
    const estado = typeof p.estado === 'string' && ESTADOS.includes(p.estado) ? (p.estado as Parte['estado']) : null
    if (id && estado) out.push({ id, estado })
  }
  return out
}
export function leerCupo(v: unknown): Cupo | null {
  if (!esObj(v)) return null
  const usadas = num(v.usadas)
  if (usadas === null) return null
  return { usadas, limite: v.limite === null ? null : num(v.limite) }
}
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && limpio(x)).slice(0, 30) : [])
/** La URL de la marca vale solo si es https, limpia y del origen de la tab de Maasy (§4.1). */
const urlMarca = (v: unknown): string | null => {
  const u = cad(v)
  return u && enlaceValido(u, ORIGENES.maasy ?? []) ? u : null
}

/** Toda tool de Maasy con cualquier servidor delante: el del plugin, el conector de la cuenta (`mcp__claude_ai_Maasy_MCP__*`, `mcp__claude_ai_Maasy__*`) o el que la app de escritorio nombra con un uuid. El nombre corto es lo único que importa. */
export const TOOL_MAASY = /^mcp__.+__(maasy_[a-z_]+)$/
export const toolCorta = (tool: string): string | null => TOOL_MAASY.exec(tool)?.[1]?.slice('maasy_'.length) ?? null

/** Lo que una tool maasy_* ya llamada cambia en las tabs Crear y Cuenta. El JSON roto o ajeno no cambia nada. */
export function aplicar(crear: Crear, cuenta: Cuenta, tool: string, resultado: unknown): { crear: Crear; cuenta: Cuenta } {
  const j = leerJson(resultado)
  if (!esObj(j)) return { crear, cuenta }
  const cupo = leerCupo(j.cupo)
  const cuenta2 = cupo ? { ...cuenta, cupo } : cuenta
  switch (tool) {
    case 'get_interview_spec':
    case 'save_interview_step':
    case 'set_visual_identity':
    case 'save_derivation': {
      const partes = leerPartes(j.partes)
      return {
        cuenta: cuenta2,
        crear: {
          ...crear,
          interviewId: cad(j.interview_id) ?? crear.interviewId,
          partes: partes ?? crear.partes,
          faltan: 'faltan' in j ? lista(j.faltan) : crear.faltan,
          vence: cad(j.vence) ?? crear.vence,
          siguiente: 'siguiente' in j ? cad(j.siguiente) : crear.siguiente
        }
      }
    }
    case 'create_brand':
      if (j.creada === true || cad(j.project_id))
        return { cuenta: cuenta2, crear: { ...CREAR_VACIO, partes: crear.partes.map((p) => ({ ...p, estado: 'hecha' as const })), marca: { nombre: cad(j.brand_name) ?? 'Tu marca', url: urlMarca(j.control_plane_url) } } }
      return { crear, cuenta: cuenta2 }
    case 'delete_my_brand':
      return j.borrada === true ? { crear: CREAR_VACIO, cuenta: cuenta2 } : { crear, cuenta: cuenta2 }
    case 'discard_interview':
      return { crear: { ...CREAR_VACIO, marca: crear.marca }, cuenta: cuenta2 }
    default:
      return { crear, cuenta: cuenta2 }
  }
}

/** Porcentaje del ADN: partes hechas sobre el total (media cuenta las "a medias"). Una cuenta, la de acá. */
export function progreso(c: Crear): number {
  if (c.marca) return 100
  if (!c.partes.length) return 0
  const pts = c.partes.reduce((a, p) => a + (p.estado === 'hecha' ? 1 : p.estado === 'a medias' ? 0.5 : 0), 0)
  return Math.round((pts / c.partes.length) * 100)
}

export const entrevistaAbierta = (c: Crear): boolean => !c.marca && c.partes.length > 0

/** Texto de la franja de la tab Crear (la franja de las demás la manda su plugin). */
export function franjaCrear(c: Crear): string | null {
  if (c.marca) return `${c.marca.nombre} · ADN listo`
  if (!entrevistaAbierta(c)) return null
  const i = c.partes.findIndex((p) => p.estado !== 'hecha')
  const n = i < 0 ? c.partes.length : i + 1
  return `Entrevista · parte ${n} de ${c.partes.length}`
}

export type PasoCrear = { titulo: string; estado: 'hecho' | 'actual' | 'pendiente' }
/** Los cuatro pasos de la maqueta: Cuenta, Entrevista, Assets y Marca creada. */
export function pasosCrear(c: Crear, hayCuenta: boolean): PasoCrear[] {
  const sinEntrevista = !entrevistaAbierta(c) && !c.marca
  const hechas = c.marca || (c.partes.length > 0 && c.partes.every((p) => p.estado === 'hecha'))
  const e = (hecho: boolean, actual: boolean): PasoCrear['estado'] => (hecho ? 'hecho' : actual ? 'actual' : 'pendiente')
  const cuenta = hayCuenta || !sinEntrevista || !!c.marca
  return [
    { titulo: 'Cuenta', estado: e(cuenta, !cuenta) },
    { titulo: 'Entrevista', estado: e(!!hechas, cuenta && !hechas) },
    { titulo: 'Assets', estado: e(!!c.marca, !!hechas && !c.marca) },
    { titulo: 'Marca creada', estado: e(!!c.marca, false) }
  ]
}

export const cupoTexto = (c: Cupo | null): string => (c ? (c.limite === null ? `${c.usadas} marcas` : `${c.usadas} de ${c.limite}`) : '—')

/** Pedidos que deja el panel en el prompt: comandos del propio plugin y nada más. */
export const PEDIDOS = { empezar: '/maasy:start', borrar: '/maasy:borrar' } as const
