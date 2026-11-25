// Panel de Maasy (MEC-15/16): lo que el mod guarda en $.state (de la sesión). Sin imports (claude plugin validate lo
// exige): las formas repiten las de hooks/panel-v1.ts y hooks/estado.ts; panel.tsx las pasa de unas a otras y no
// compila si se separan.
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
export type TabRef = { id: string; plugin: string; key: string; tool: string; server: string }
export type TabPlugin = { ref: TabRef; panel: PanelV1 | null; aviso: string | null; cargando: boolean }
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

export type Panel = {
  /** La tab abierta: 'crear', 'cuenta' o el id de la de un plugin. */
  tab: string
  /** La marca activa del panel (la última que creó o dijo una tool maasy_*); es lo que se manda a cada `<id>_panel` como `{ brandId }`. */
  brandId: string | null
  crear: Crear
  cuenta: Cuenta
  tabs: TabPlugin[]
}

declare module 'claude-code' {
  interface PluginState {
    maasy: { panel: Shaped<Panel>; franjaOculta: boolean; activo: boolean }
  }
}
