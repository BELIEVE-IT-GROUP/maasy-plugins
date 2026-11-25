// Panel de Believable en Claude Code y Claude Desktop (T-136, BLUEPRINT-V2 Step 4). Lo aprendido en el spike
// (docs/specs/plugin-claude-code/spike-ui-desktop.md) manda aquí:
// - Nunca $.ui.ask desde un botón, la franja o un hook fuera de un turno: deja a Desktop en "Pensando". Las
//   preguntas del panel se dibujan en el panel (el "¿publicar?" de abajo).
// - Ningún botón envía por la persona: deja el texto en el prompt con $.prompt.fill y ella aprieta Enter.
//   La única acción directa es Publicar, que la persona confirma en el mismo panel.
// - Nada de await largo en un onPress (el motor corta a los 10 s): lo largo corre con void.
// - Wordmark en texto: "Believable" en un color y el punto en cian (BOS-25).
// - Tema solo si otro mod no puso el suyo: dos $.theme.set compiten y el último gana.
// - Fuera de un proyecto de Believable (esProyectoBelievable) el mod no se mete (T-136c): sin tema, sin paneles,
//   sin franja y sin llamar al MCP; solo queda /maasy-vibe-panel para abrirlo a mano. Con el plugin a nivel de
//   usuario, cada sesión de la máquina (BeDev, `claude -p`) pasa por aquí.
// - session.start no espera nada: devuelve apenas corre next y todo lo demás va en void con catch, para que una
//   sesión sin UI arranque igual que sin el plugin.
import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, McpToolResult, Register, ThemeSetArgs } from 'claude-code'

import type { Panel } from '../types'
import {
  enlaces,
  esProyectoBelievable,
  faltan,
  accionDeTool,
  checklistDeResultado,
  leerProyecto,
  leerSesion,
  mensajeDeCheck,
  modoLegible,
  pedidoDeArreglo,
  SEÑAL,
  siguientePaso,
  type Paso
} from './estado'
import { makeColors } from './make-colors.js'

const PROYECTO = { id: 'maasy-vibe-proyecto', title: 'Maasy Vibe' } as const
const CHECKLIST = { id: 'maasy-vibe-checklist', title: 'Checklist' } as const
const TEXTO_2 = '#9aa6c0'
const TEXTO_MUDO = '#8590ab'
const FONDO = '#161f36'
// Lo que cambia la app en disco: después de esto el sitio publicado queda atrás.
const EDITAN = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

const INICIAL: Panel = { sesion: null, proyecto: null, checklist: null, cambios: false, ocupado: null, confirmar: false, mensaje: null }
const panel = atom({ plugin: 'maasy-vibe', key: 'panel' } as const, INICIAL, { shape: 'panel-1' })
const franjaOculta = atom({ plugin: 'maasy-vibe', key: 'franjaOculta' } as const, false)
const otroTema = atom({ plugin: 'maasy-vibe', key: 'otroTema' } as const, false)
// La carpeta es un proyecto de Believable: solo entonces hay tema, paneles al abrir y franja.
const activo = atom({ plugin: 'maasy-vibe', key: 'activo' } as const, false)

// Chrome navy de la UI de Believable (theme.css); primario #2b6bff en las acciones, la señal cian en el texto.
const { theme } = makeColors({
  label: 'Maasy Vibe',
  only: 'dark',
  roles: { accent: '#2b6bff', danger: '#f8717a', success: '#34d399', warning: '#f5c542', pro: SEÑAL },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0f1527',
        'surface-1': '#161f36',
        'surface-2': '#1e2845',
        'surface-3': '#1e2845',
        'text-primary': '#f4f6fb',
        'text-secondary': TEXTO_2,
        'text-muted': TEXTO_MUDO
      }
    }
  }
})
export const LOOK: ThemeSetArgs = { colors: theme }

const cambiar = ($: Engine, f: (p: Panel) => Partial<Panel>) => update($, panel, (p) => ({ ...p, ...f(p) }))

const textoDe = (r: McpToolResult): string =>
  r.content
    .map((b) => (b.type === 'text' && 'text' in b ? String(b.text) : ''))
    .filter(Boolean)
    .join('\n')

/** Una tool del MCP del plugin; null si el servidor no está. El key de .mcp.json se resuelve al nombre de /mcp. */
async function llamar($: Engine, tool: string, args?: Record<string, unknown>): Promise<McpToolResult | null> {
  const c = await $.mcp.connect('vibe')
  if (!c.isConnected) return null
  return $.mcp.call(c.server, tool, args)
}

/** Relee la carpeta: el proyecto del panel y si es de Believable. Devuelve esto último. */
async function refrescarProyecto($: Engine): Promise<boolean> {
  const cwd = await $.session.cwd()
  const leer = (f: string): Promise<string | null> => $.fs.read(`${cwd}/${f}`).then((t: unknown) => (typeof t === 'string' ? t : null), () => null)
  const [pkg, proj, claudeMd] = await Promise.all([leer('package.json'), leer('.believable/project.json'), leer('CLAUDE.md')])
  const proyecto = leerProyecto(pkg, proj, cwd)
  const es = esProyectoBelievable(proj, claudeMd)
  await cambiar($, (p) => ({ proyecto, checklist: proyecto?.publishId ? p.checklist : null }))
  if (es !== (await read($, activo))) await update($, activo, () => es)
  return es
}

/** Al arrancar, solo dentro de un proyecto de Believable: tema (si nadie puso otro), paneles y datos. */
async function arrancar($: Engine): Promise<void> {
  if (!(await refrescarProyecto($))) return
  if (!(await read($, otroTema))) void $.theme.set(LOOK).catch(() => {})
  void $.ui.open(PROYECTO).catch(() => {})
  void $.ui.open(CHECKLIST).catch(() => {})
  await refrescarSesion($)
  await correrCheck($)
}

async function refrescarSesion($: Engine): Promise<void> {
  const r = await llamar($, 'vibe_whoami').catch(() => null)
  const sesion = r ? leerSesion(r.structuredContent) : null
  if (sesion) await cambiar($, () => ({ sesion }))
}

async function correrCheck($: Engine): Promise<void> {
  const p = await read($, panel)
  if (!p.proyecto?.publishId || p.ocupado) return
  await cambiar($, () => ({ ocupado: 'check' }))
  try {
    const r = await llamar($, 'vibe_check', { path: await $.session.cwd() })
    const checklist = r && !r.isError ? checklistDeResultado(r) : null
    await cambiar($, () => (checklist ? { checklist, mensaje: null } : { mensaje: r ? mensajeDeCheck(textoDe(r)) : 'No encontré el servidor del plugin de Maasy Vibe.' }))
  } catch (err) {
    await cambiar($, () => ({ mensaje: `No pude correr el checklist: ${String(err)}` }))
  } finally {
    await cambiar($, () => ({ ocupado: null }))
  }
}

/** Después de publicar (desde el panel o porque el modelo llamó la tool): todo de nuevo. */
async function despuesDePublicar($: Engine): Promise<void> {
  await cambiar($, () => ({ cambios: false }))
  await refrescarProyecto($)
  await Promise.all([refrescarSesion($), correrCheck($)])
}

export async function publicar($: Engine): Promise<void> {
  await cambiar($, () => ({ ocupado: 'publicar', confirmar: false, mensaje: null }))
  $.ui.toast('Maasy Vibe: publicando. Compila si hace falta, sube el build y lo verifica; puede tardar unos minutos.')
  let ok = false
  try {
    const r = await llamar($, 'vibe_publish', { path: await $.session.cwd() })
    const t = r ? textoDe(r) : 'No encontré el servidor del plugin de Maasy Vibe.'
    ok = !!r && !r.isError
    const lineas = t.split('\n').filter(Boolean)
    const resumen = (ok ? lineas.find((l) => l.startsWith('Subidos')) : lineas[lineas.length - 1]) ?? t
    $.ui.toast(ok ? `Maasy Vibe: publicado. ${resumen}` : `Maasy Vibe: no se publicó. ${resumen}`)
    await cambiar($, () => ({ mensaje: resumen }))
  } catch (err) {
    $.ui.toast(`Maasy Vibe: no se publicó. ${String(err)}`)
  } finally {
    await cambiar($, () => ({ ocupado: null }))
  }
  if (ok) await despuesDePublicar($)
}

async function refrescarTodo($: Engine): Promise<void> {
  await refrescarProyecto($)
  await refrescarSesion($)
  await correrCheck($)
}

type Elementos = ReturnType<Engine['ui']['resolve']>

const wordmark = ({ Text }: Elementos) => (
  <Text bold>
    Maasy Vibe<Text color={SEÑAL}>.</Text>
  </Text>
)

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    void $.command.register({ name: 'maasy-vibe-panel', description: 'Abre el panel de Maasy Vibe' }).catch(() => {})
    void arrancar($).catch(() => {})
    return ran
  })

  // Si otro mod pone su tema, se queda el suyo: el de Believable no se vuelve a poner encima.
  on('theme.set', async ($, e, next) => {
    if (next.origin.plugin !== $.plugin.name) await update($, otroTema, () => true)
    return next(e)
  }).catch(($, e, next) => (next.called ? next(e) : next(e)))

  on('command.run', { command: 'maasy-vibe-panel' }, async ($) => {
    await $.ui.open({ ...PROYECTO, focus: true })
    void refrescarTodo($).catch(() => {})
    return { text: 'Panel de Maasy Vibe abierto.' }
  })

  // El panel se actualiza solo: tras una edición, y tras publicar, revisar o crear desde el chat.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError) return ran
    const tool = accionDeTool(e.tool)
    if (EDITAN.has(e.tool)) {
      void cambiar($, (p) => ({ cambios: p.cambios || !!p.proyecto?.publishId }))
    } else if (tool === 'publish' || tool === 'unpublish') {
      void despuesDePublicar($).catch(() => {})
    } else if (tool === 'check') {
      const checklist = checklistDeResultado(ran.result)
      void (checklist ? cambiar($, () => ({ checklist })) : correrCheck($)).catch(() => {})
    } else if (tool === 'new' || tool === 'login' || tool === 'logout') {
      void refrescarProyecto($)
        .then(() => refrescarSesion($))
        .catch(() => {})
    }
    return ran
  }).catch(($, e, next) => next(e))

  // package.json o .believable/ pudieron cambiar por otro camino (Bash, git): se releen al cerrar el turno.
  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    void refrescarProyecto($).catch(() => {})
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PROYECTO.id }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button, Link } = ui
    const p = await read($, panel)
    const paso = siguientePaso(p)
    const fila = e.props.bodyColumns < 50 ? 'column' : 'row'
    const pr = p.proyecto
    const s = p.sesion
    if (!pr) {
      return (
        <Box flexDirection="column" gap={1} padding={1} backgroundColor={FONDO}>
          {wordmark(ui)}
          <Text color={TEXTO_2}>No hay una app de Believable en esta carpeta.</Text>
          <Text color={TEXTO_MUDO}>Empezar deja /maasy-vibe:start en el prompt: apriétalo con Enter.</Text>
          <Button key="empezar" variant="primary" hotkey="1" onPress={() => $.prompt.fill({ text: '/maasy-vibe:start', mode: 'replace' })}>
            Empezar
          </Button>
          {s && !s.sesion && <Text color={TEXTO_MUDO}>Sin sesión: Maasy Vibe te pide entrar al empezar.</Text>}
        </Box>
      )
    }
    return (
      <Box flexDirection="column" gap={1} padding={1} backgroundColor={FONDO}>
        {wordmark(ui)}
        <Box flexDirection="column">
          <Text bold>{pr.nombre}</Text>
          <Text color={TEXTO_2}>Modo: {modoLegible(pr.modo)}</Text>
          {pr.url ? <Link key="url" href={pr.url} label={pr.url.replace('https://', '')} /> : <Text color={TEXTO_2}>Sin publicar</Text>}
          {s?.sesion ? (
            <Text color={TEXTO_2}>
              Plan {s.plan ?? '—'} · {s.cupo ?? 'cupo sin dato'}
            </Text>
          ) : s ? (
            <Button key="entrar" plain onPress={() => $.prompt.fill({ text: '/maasy-vibe:login', mode: 'replace' })}>
              Sin sesión: entrar
            </Button>
          ) : (
            <Text color={TEXTO_MUDO}>Revisando la cuenta…</Text>
          )}
        </Box>

        <Box flexDirection="column">
          <Text bold>Siguiente paso</Text>
          <Text color={TEXTO_2}>{paso.titulo}</Text>
          {botonDePaso($, ui, paso, 'paso')}
        </Box>

        <Box flexDirection="column">
          <Text bold>Publicar</Text>
          {p.ocupado === 'publicar' ? (
            <Text color={SEÑAL}>Publicando…</Text>
          ) : p.confirmar ? (
            <Box flexDirection="column">
              <Text>¿Publicar {pr.nombre}{pr.url ? ` en ${pr.url.replace('https://', '')}` : ' en un subdominio nuevo'}?</Text>
              <Box flexDirection={fila} gap={1}>
                <Button key="publicar-si" variant="primary" hotkey="y" onPress={() => void publicar($)}>
                  Sí, publicar
                </Button>
                <Button key="publicar-no" role="dismiss" onPress={() => cambiar($, () => ({ confirmar: false }))}>
                  Cancelar
                </Button>
              </Box>
            </Box>
          ) : (
            <Button key="publicar" variant="primary" hotkey="p" onPress={() => cambiar($, () => ({ confirmar: true, mensaje: null }))}>
              {pr.publishId ? 'Publicar de nuevo' : 'Publicar'}
            </Button>
          )}
          {p.mensaje && <Text color={TEXTO_MUDO}>{p.mensaje}</Text>}
        </Box>

        <Box flexDirection="column">
          <Text bold>Integraciones y Cloud</Text>
          {enlaces(pr.publishId).map((l) => (
            <Link key={`cp-${l.label}`} href={l.href} label={l.label} />
          ))}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: CHECKLIST.id }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const p = await read($, panel)
    const c = p.checklist
    const f = faltan(c)
    return (
      <Box flexDirection="column" gap={1} padding={1} backgroundColor={FONDO}>
        <Text bold>Listo para producción</Text>
        {!p.proyecto?.publishId ? (
          <Text color={TEXTO_2}>El checklist revisa el sitio publicado: publica primero.</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            {p.ocupado === 'check' ? (
              <Text color={SEÑAL}>Revisando el sitio…</Text>
            ) : (
              <Button key="revisar" hotkey="r" onPress={() => void correrCheck($).catch(() => {})}>
                Revisar ahora
              </Button>
            )}
            {c && <Text color={c.lista ? '#34d399' : TEXTO_2}>{c.lista ? 'Lista para producción.' : `Faltan ${f.length}.`}</Text>}
            {f.map((i) => (
              <Box key={`falta-${i.id}`} flexDirection="column">
                <Text>✗ {i.titulo}</Text>
                <Text color={TEXTO_MUDO}>{i.detalle}</Text>
                <Button key={`pedir-${i.id}`} plain onPress={() => $.prompt.fill({ text: pedidoDeArreglo(i), mode: 'replace' })}>
                  Pídeselo a Believable
                </Button>
              </Box>
            ))}
            {c?.items
              .filter((i) => i.estado !== 'falta')
              .map((i) => (
                <Text color={i.estado === 'ok' ? TEXTO_2 : TEXTO_MUDO}>
                  {i.estado === 'ok' ? '✓' : '·'} {i.titulo}
                </Text>
              ))}
            {p.mensaje && !c && <Text color={TEXTO_MUDO}>{p.mensaje}</Text>}
          </Box>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, activo)) || (await read($, franjaOculta))) return next(e)
    const ui = $.ui.resolve(e)
    const { Box, Text, Button, Link } = ui
    const paso = siguientePaso(await read($, panel))
    return (
      <Box flexDirection="row" gap={1} backgroundColor="#1e2845" paddingX={1}>
        {wordmark(ui)}
        <Text color={TEXTO_2}>{paso.titulo}</Text>
        {botonDePaso($, ui, paso, 'franja-paso')}
        <Button key="franja-panel" plain onPress={() => $.ui.open({ ...PROYECTO, focus: true })}>
          Panel
        </Button>
        <Button key="franja-ocultar" role="dismiss" dimColor onPress={() => update($, franjaOculta, () => true)}>
          Ocultar
        </Button>
      </Box>
    )
  })
}

/** El botón del siguiente paso: deja el texto en el prompt, abre el checklist o enlaza al control plane. */
function botonDePaso($: Engine, { Button, Link }: Elementos, paso: Paso, key: string) {
  const a = paso.accion
  if (!a || !paso.boton) return null
  if (a.tipo === 'link') return <Link key={key} href={a.href} label={paso.boton} />
  if (a.tipo === 'checklist') return <Button key={key} plain onPress={() => $.ui.open({ ...CHECKLIST, focus: true })}>{paso.boton}</Button>
  return <Button key={key} plain onPress={() => $.prompt.fill({ text: a.texto, mode: 'replace' })}>{paso.boton}</Button>
}
