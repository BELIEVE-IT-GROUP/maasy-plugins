// Panel de Believable (T-136): la lógica pura, sin `$` ni Node. La prueban tests/plugin-panel.test.ts
// (vitest) y el mod la usa en panel.tsx. Nada de aquí es receta: los textos de arreglo del checklist llegan
// del servidor en cada ítem (`pedido`) y no viven en el plugin.

// MEC-18 §2.2 · Fuente única del nombre del plugin. plugin/identidad.mjs la lee de aquí para el build, y build.mjs
// falla si .claude-plugin/plugin.json o .mcp.json dicen otra cosa. tests/plugin-identidad.test.ts vigila que en
// plugin/ no quede el nombre viejo.
export const PLUGIN = 'maasy-vibe'
export const SERVIDOR = 'vibe'
export const NOMBRE = 'Maasy Vibe'
/** /maasy-vibe:<x> */
export const comando = (x: string): string => `/${PLUGIN}:${x}`
/** Qué tool del servidor es (`publish` en mcp__plugin_maasy-vibe_vibe__vibe_publish). null si no es una de las nuestras. */
export const accionDeTool = (nombre: string): string | null => new RegExp(`__${SERVIDOR}_(\\w+)$`).exec(nombre)?.[1] ?? null
/** El nombre completo de una tool del servidor, como lo ve Claude Code: mcp__plugin_maasy-vibe_vibe__<x>. */
export const tool = (x: string): string => `mcp__plugin_${PLUGIN}_${SERVIDOR}__${x}`

export const CONTROL_PLANE = 'https://app.believable.studio'
export const SEÑAL = '#1fb6ff'

/** Lo que dice vibe_whoami (structuredContent). null: todavía no se preguntó. */
export interface Sesion {
  sesion: boolean
  email?: string
  plan?: string
  cupo?: string
}

export interface Proyecto {
  nombre: string
  publishId: string | null
  url: string | null
  /** El modo con el que se empezó (.believable/project.json `modo`), si quedó guardado. */
  modo: string | null
  /** Qué se construye (`que` de /maasy-vibe:start), si quedó guardado. */
  que: string | null
  dominios: number
  tieneLogin: boolean
}

export interface ItemCheck {
  id: string
  grupo: 'web' | 'agentes'
  titulo: string
  estado: 'ok' | 'falta' | 'no-aplica'
  detalle: string
  pedido: string | null
}

export interface Checklist {
  url: string
  lista: boolean
  items: ItemCheck[]
}

export interface Estado {
  sesion: Sesion | null
  proyecto: Proyecto | null
  checklist: Checklist | null
  /** Hubo ediciones desde la última publicación. */
  cambios: boolean
}

export type Accion = { tipo: 'prompt'; texto: string } | { tipo: 'link'; href: string } | { tipo: 'checklist' }

export interface Paso {
  id: 'entrar' | 'empezar' | 'publicar' | 'login' | 'checklist' | 'dominio' | 'listo'
  titulo: string
  boton: string | null
  accion: Accion | null
}

const MODOS: Record<string, string> = {
  plantilla: 'Plantilla',
  entrevista: 'Entrevista guiada',
  clonar: 'Clonar sitio',
  diseno: 'Desde un diseño',
  importar: 'Importar Git o Lovable',
  idea: 'Idea de negocio',
  new: 'Plantilla'
}

export const modoLegible = (m: string | null): string => (m ? (MODOS[m] ?? m) : 'sin modo guardado')

// ponytail: "tiene login" mira solo las dependencias; un login escrito a mano sin SDK no se ve.
const LOGIN_DEPS = /^(appwrite|@supabase\/supabase-js|@supabase\/ssr|better-auth|@clerk\/.+|firebase|next-auth|@auth\/.+)$/
// Lo que se construye que pide cuentas de usuario (ids de la pregunta "que" de /maasy-vibe:start).
const QUE_CON_LOGIN = new Set(['plataforma', 'dashboard'])

const objeto = (raw: string | null): Record<string, unknown> | null => {
  if (raw === null) return null
  try {
    const v: unknown = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}
const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** La marca que /maasy-vibe:new deja en el CLAUDE.md del template (REGLAS_INICIO de plugin/server/tools/new.ts). */
export const MARCA_TEMPLATE = '<!-- believable:reglas:inicio'

/**
 * ¿Esta carpeta es un proyecto de Believable? Sí con .believable/project.json (lo escribe la app al crear y
 * /maasy-vibe:publish al publicar) o con la marca del template en CLAUDE.md (lo crea /maasy-vibe:new). Un
 * package.json solo no alcanza: cualquier repo de Node lo tiene, y el mod no se mete en sesiones ajenas.
 */
export const esProyectoBelievable = (projectJson: string | null, claudeMd: string | null): boolean =>
  projectJson !== null || (claudeMd ?? '').includes(MARCA_TEMPLATE)

/** El proyecto de la carpeta, de su package.json y .believable/project.json. Sin package.json no hay proyecto. */
export function leerProyecto(packageJson: string | null, projectJson: string | null, carpeta: string): Proyecto | null {
  const pkg = objeto(packageJson)
  if (!pkg) return null
  const p = objeto(projectJson) ?? {}
  const publishId = texto(p.publishId)
  const valido = publishId !== null && /^[a-z0-9-]+$/.test(publishId)
  const deps = Object.keys({ ...(pkg.dependencies as object | undefined), ...(pkg.devDependencies as object | undefined) })
  return {
    nombre: texto(pkg.name) ?? (carpeta.split('/').filter(Boolean).pop() || 'mi-app'),
    publishId: valido ? publishId : null,
    url: valido ? `https://${publishId}.apps.believe-global.com` : null,
    modo: texto(p.modo),
    que: texto(p.que),
    dominios: Array.isArray(p.domains) ? p.domains.length : 0,
    tieneLogin: deps.some((d) => LOGIN_DEPS.test(d))
  }
}

export function leerSesion(structured: unknown): Sesion | null {
  if (!structured || typeof structured !== 'object') return null
  const s = structured as Record<string, unknown>
  if (typeof s.sesion !== 'boolean') return null
  if (!s.sesion) return { sesion: false }
  return { sesion: true, email: texto(s.email) ?? undefined, plan: texto(s.plan) ?? undefined, cupo: texto(s.cupo) ?? undefined }
}

const ESTADOS = new Set(['ok', 'falta', 'no-aplica'])

export function leerChecklist(structured: unknown): Checklist | null {
  if (!structured || typeof structured !== 'object') return null
  const s = structured as Record<string, unknown>
  if (!Array.isArray(s.items)) return null
  const items = s.items.filter(
    (i): i is ItemCheck => !!i && typeof i === 'object' && typeof i.id === 'string' && typeof i.titulo === 'string' && ESTADOS.has(i.estado)
  )
  return { url: typeof s.url === 'string' ? s.url : '', lista: s.lista === true, items }
}

const json = (t: string): unknown => {
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

/**
 * El checklist de un resultado de vibe_check, venga como venga (B3, QA T-141a). Claude Code puede dejar
 * fuera el structuredContent (lo omite pasado su tope de tamaño) y el JSON llega como texto en content; en
 * tool.call el resultado de una tool MCP tampoco tiene forma fija. Se prueba structuredContent (objeto o texto),
 * el resultado mismo y cada bloque de texto.
 */
export function checklistDeResultado(r: unknown): Checklist | null {
  if (typeof r === 'string') return leerChecklist(json(r))
  if (!r || typeof r !== 'object') return null
  const o = r as { structuredContent?: unknown; content?: unknown }
  const sc = typeof o.structuredContent === 'string' ? json(o.structuredContent) : o.structuredContent
  const directo = leerChecklist(sc) ?? leerChecklist(o)
  if (directo) return directo
  const bloques = Array.isArray(r) ? r : Array.isArray(o.content) ? o.content : []
  for (const b of bloques) {
    const t = b && typeof b === 'object' && (b as { type?: unknown }).type === 'text' ? (b as { text?: unknown }).text : null
    const c = typeof t === 'string' ? leerChecklist(json(t)) : null
    if (c) return c
  }
  return null
}

/** Lo que el panel dice cuando el check no trae checklist: el texto del servidor, nunca JSON crudo (B3). */
export function mensajeDeCheck(texto: string): string {
  const t = texto.trim()
  if (!t || /^[[{]/.test(t) || t.includes('"items":')) return 'No pude leer el checklist. Pídele a Believable /maasy-vibe:check para verlo en el chat.'
  return t
}

export const faltan = (c: Checklist | null): ItemCheck[] => (c ? c.items.filter((i) => i.estado === 'falta') : [])

/** Enlaces al control plane: la cuenta sin app publicada, las pestañas de Cloud con ella. */
export function enlaces(publishId: string | null): { label: string; href: string }[] {
  if (!publishId) return [{ label: 'Tus proyectos', href: `${CONTROL_PLANE}/proyectos` }, { label: 'Plan y facturación', href: `${CONTROL_PLANE}/plan` }]
  const base = `${CONTROL_PLANE}/p/${publishId}`
  return [
    { label: 'Overview', href: base },
    { label: 'Integraciones', href: `${base}/integraciones` },
    { label: 'Secrets', href: `${base}/secrets` },
    { label: 'Dominios', href: `${base}/dominios` },
    { label: 'Analytics', href: `${base}/analytics` },
    { label: 'Agentes (MCP)', href: `${base}/agentes` },
    { label: 'Plan y facturación', href: `${CONTROL_PLANE}/plan` }
  ]
}

/** La franja: una sugerencia por vez, en el orden en que la persona las necesita. */
export function siguientePaso(e: Estado): Paso {
  if (e.sesion && !e.sesion.sesion) return { id: 'entrar', titulo: 'Entra a tu cuenta de Believable', boton: 'Entrar', accion: { tipo: 'prompt', texto: '/maasy-vibe:login' } }
  const p = e.proyecto
  if (!p) return { id: 'empezar', titulo: 'Sin app en esta carpeta', boton: 'Empezar', accion: { tipo: 'prompt', texto: '/maasy-vibe:start' } }
  if (!p.publishId) return { id: 'publicar', titulo: 'Publica tu app', boton: 'Publicar', accion: { tipo: 'prompt', texto: '/maasy-vibe:publish' } }
  if (e.cambios) return { id: 'publicar', titulo: 'Hay cambios sin publicar', boton: 'Publicar', accion: { tipo: 'prompt', texto: '/maasy-vibe:publish' } }
  if (p.que && QUE_CON_LOGIN.has(p.que) && !p.tieneLogin)
    return { id: 'login', titulo: 'Agrega login', boton: 'Pedirlo', accion: { tipo: 'prompt', texto: 'Agrega login a esta app: que las personas puedan crear su cuenta, entrar y salir.' } }
  const f = faltan(e.checklist)
  if (f.length) return { id: 'checklist', titulo: `Faltan ${f.length} del checklist`, boton: 'Ver', accion: { tipo: 'checklist' } }
  if (p.dominios === 0) return { id: 'dominio', titulo: 'Conecta tu dominio', boton: 'Dominios', accion: { tipo: 'link', href: `${CONTROL_PLANE}/p/${p.publishId}/dominios` } }
  return { id: 'listo', titulo: 'Tu app está lista', boton: null, accion: null }
}

/** Lo que "Pídeselo a Believable" deja en el prompt para un ítem que falta. */
export function pedidoDeArreglo(i: ItemCheck): string {
  return i.pedido ?? `Arregla esto del checklist de producción: ${i.titulo}. ${i.detalle}`
}
