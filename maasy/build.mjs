// Tokens del panel desde maasy-ui v2.1 (regla 9 del contrato de tabs): baja el CSS, exige su sha, saca los
// tokens de :root y escribe hooks/tokens.generated.ts. Si el sha no coincide, falla: no hay tokens a mano.
//   node plugin/build.mjs            → baja el CSS y reescribe hooks/tokens.generated.ts
//   node plugin/build.mjs --check    → baja el CSS y falla si hooks/tokens.generated.ts no es el que sale de él
//   node plugin/build.mjs --css ruta → usa un archivo local en vez de bajarlo (el sha se exige igual)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

export const URL_CSS = 'https://files.believe-global.com/maasy/ui/v2.1/maasy-ui.css'
export const SHA_CSS = '3cdd293f7887094d5ecc030242de034233aabc8a7ca164f0b8565d172084ae26'

/** Los tokens de :root con valor literal (hex o medida). Los calculados (color-mix, var) no se copian. */
export function tokensDe(css) {
  const raiz = /:root\s*\{([^}]*)\}/.exec(css)
  if (!raiz) throw new Error('maasy-ui.css no trae :root')
  const out = {}
  for (const m of raiz[1].matchAll(/--mx-([a-z0-9-]+):\s*([^;]+);/g)) {
    const v = m[2].replace(/\/\*.*?\*\//g, '').trim()
    if (/^#[0-9a-fA-F]{6}$/.test(v) || /^\d+px$/.test(v)) out[m[1]] = v
  }
  for (const k of ['bg', 'raised', 'overlay', 'hover', 'border', 'text', 'text-dim', 'text-faint', 'primary', 'signal', 'ok', 'warn', 'error', 'magenta-bright'])
    if (!out[k]) throw new Error(`falta el token --mx-${k} en :root`)
  return out
}

/** `bytes`: el CSS tal como llegó (Buffer o Uint8Array). El sha se saca de los bytes, no del texto decodificado. */
export function generar(bytes) {
  const sha = createHash('sha256').update(bytes).digest('hex')
  if (sha !== SHA_CSS) throw new Error(`maasy-ui.css no es la v2.1 fijada: sha ${sha}, se esperaba ${SHA_CSS}`)
  const t = tokensDe(new TextDecoder().decode(bytes))
  return `// GENERADO por plugin/build.mjs desde maasy-ui v2.1 (sha256 ${SHA_CSS}). No se edita a mano.
import { makeColors } from './make-colors.js'

export const TOKENS = ${JSON.stringify(t, null, 2)} as const

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

/** El \`tono\` de un bloque es semántico (regla 9): el núcleo lo traduce a estos colores. */
export const COLOR_TONO = {
  ok: TOKENS.ok,
  info: TOKENS.signal,
  warn: TOKENS.warn,
  error: TOKENS.error,
  neutro: TOKENS['text-dim']
} as const
`
}

async function bajar() {
  const r = await fetch(URL_CSS, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`no pude bajar ${URL_CSS}: ${r.status}`)
  return new Uint8Array(await r.arrayBuffer())
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { check: { type: 'boolean' }, css: { type: 'string' } } })
  const salida = join(dirname(fileURLToPath(import.meta.url)), 'hooks', 'tokens.generated.ts')
  const fuente = generar(values.css ? readFileSync(values.css) : await bajar())
  if (values.check) {
    if (readFileSync(salida, 'utf8') !== fuente) throw new Error('hooks/tokens.generated.ts no es el que sale de maasy-ui v2.1: corre node plugin/build.mjs')
    console.log('tokens.generated.ts al día con maasy-ui v2.1')
  } else {
    writeFileSync(salida, fuente)
    console.log('escrito', salida)
  }
}
