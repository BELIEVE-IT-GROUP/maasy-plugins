// Panel de Believable (T-136): lo que el mod guarda en $.state (de la sesión). El contrato va sin imports
// (claude plugin validate lo exige): las formas repiten las de hooks/estado.ts, y panel.tsx, que pasa unas
// a otras, no compila si se separan.
export type Sesion = { sesion: boolean; email?: string; plan?: string; cupo?: string }
export type Proyecto = {
  nombre: string
  publishId: string | null
  url: string | null
  modo: string | null
  que: string | null
  dominios: number
  tieneLogin: boolean
}
export type ItemCheck = {
  id: string
  grupo: 'web' | 'agentes'
  titulo: string
  estado: 'ok' | 'falta' | 'no-aplica'
  detalle: string
  pedido: string | null
}
export type Checklist = { url: string; lista: boolean; items: ItemCheck[] }

export type Panel = {
  sesion: Sesion | null
  proyecto: Proyecto | null
  checklist: Checklist | null
  /** Hubo ediciones desde la última publicación. */
  cambios: boolean
  /** Lo que corre ahora mismo desde el panel. */
  ocupado: 'publicar' | 'check' | null
  /** El "¿publicar?" dibujado en el panel (nunca $.ui.ask: cuelga el turno en Desktop). */
  confirmar: boolean
  /** La última línea para la persona: un error, el resultado de publicar. */
  mensaje: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'maasy-vibe': { panel: Shaped<Panel>; franjaOculta: boolean; otroTema: boolean; activo: boolean }
  }
}
