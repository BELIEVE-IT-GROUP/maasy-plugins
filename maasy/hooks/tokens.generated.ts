// GENERADO por plugin/build.mjs desde maasy-ui v2.1 (sha256 3cdd293f7887094d5ecc030242de034233aabc8a7ca164f0b8565d172084ae26). No se edita a mano.
import { makeColors } from './make-colors.js'

export const TOKENS = {
  "bg": "#0f1527",
  "raised": "#161f36",
  "overlay": "#1e2845",
  "hover": "#273454",
  "border": "#2a3654",
  "border-strong": "#3f4c78",
  "text": "#f4f6fb",
  "text-dim": "#9aa6c0",
  "text-faint": "#5c6784",
  "primary": "#2b6bff",
  "primary-deep": "#1d4fd0",
  "signal": "#1fb6ff",
  "signal-soft": "#6fd3ff",
  "ok": "#34d399",
  "warn": "#f5c542",
  "error": "#f8717a",
  "magenta": "#c21f80",
  "magenta-bright": "#ff4fb0",
  "masi": "#e0369c",
  "r-sm": "6px",
  "r-md": "10px",
  "r-lg": "14px",
  "r-xl": "16px",
  "r-pill": "999px",
  "content-w": "1100px",
  "sidebar-w": "248px"
} as const

// Tema del núcleo (regla 9): navy de maasy-ui, primario azul, señal cian. Los tonos del contrato salen de aquí.
export const { theme: TEMA } = makeColors({
  label: 'Maasy',
  only: 'dark',
  roles: { accent: TOKENS.primary, danger: TOKENS.error, success: TOKENS.ok, warning: TOKENS.warn, pro: TOKENS.signal },
  dark: {
    gray: {
      anchors: {
        'surface-0': TOKENS.bg,
        'surface-1': TOKENS.raised,
        'surface-2': TOKENS.overlay,
        'surface-3': TOKENS.hover,
        'text-primary': TOKENS.text,
        'text-secondary': TOKENS['text-dim'],
        'text-muted': TOKENS['text-faint']
      }
    }
  }
})

/** El `tono` de un bloque es semántico (regla 9): el núcleo lo traduce a estos colores. */
export const COLOR_TONO = {
  ok: TOKENS.ok,
  info: TOKENS.signal,
  warn: TOKENS.warn,
  error: TOKENS.error,
  neutro: TOKENS['text-dim']
} as const
