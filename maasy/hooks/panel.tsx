// Núcleo del panel de Maasy en Claude Code y Claude Desktop (MEC-15 y MEC-16, contrato panel.v1).
// Reglas heredadas del spike T-133 y del contrato de tabs:
// - Un solo pintor: este mod dibuja el panel con pestañas (Crear, Cuenta y las de los plugins), la franja y el tema.
// - Sin tema (MEC-16 §8): makeColors solo pinta el pane; el núcleo no llama a $.theme.set.
// - Inerte hasta que se usa: session.start solo registra /maasy-panel. Nada de MCP ni paneles hasta la primera
//   tool maasy_* del plugin o /maasy-panel (arranque igual que sin el plugin).
// - Las tabs de otros plugins salen de su tool <id>_panel (spike VERIFIED 2026-11-25: $.tool.list las enumera y
//   $.mcp.connect('plugin:<plugin>:<key>') + $.mcp.call las leen). Texto como dato: solo se pinta, nunca va al modelo.
// - Nunca $.ui.ask (cuelga Desktop). Ningún botón envía: el `pedido` deja el texto en el prompt (`$.prompt.fill`).
// - Nada de await largo en un onPress (corta a los 10 s): lo largo va con void.
import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, Register } from 'claude-code'

import type { Panel } from '../types'
import {
  CREAR_VACIO,
  CUENTA_VACIA,
  aplicar,
  cupoTexto,
  descubrir,
  esDelServidor,
  franjaCrear,
  marcaActiva,
  nombreDeParte,
  ordenar,
  pasosCrear,
  PEDIDOS,
  progreso,
  tabDeRespuesta,
  toolCorta,
  type TabPlugin
} from './estado'
import type { Accion, Bloque } from './panel-v1'
import { COLOR_TONO, TOKENS } from './tokens.generated'

const PANE = { id: 'maasy-panel', title: 'Maasy' } as const
const SEÑAL = TOKENS.signal
const DIM = TOKENS['text-dim']
const FAINT = TOKENS['text-faint']
const FONDO = TOKENS.raised
const BARRA = TOKENS.overlay
const ESPERA_MS = 3000 // regla 2: una <id>_panel responde en menos de 3 s o la tab muestra "Sin datos por ahora"

const INICIAL: Panel = { tab: 'crear', brandId: null, crear: CREAR_VACIO, cuenta: CUENTA_VACIA, tabs: [] }
const panel = atom({ plugin: 'maasy', key: 'panel' } as const, INICIAL, { shape: 'panel-2' })
const franjaOculta = atom({ plugin: 'maasy', key: 'franjaOculta' } as const, false)
const activo = atom({ plugin: 'maasy', key: 'activo' } as const, false)

const cambiar = ($: Engine, f: (p: Panel) => Partial<Panel>) => update($, panel, (p) => ({ ...p, ...f(p) }))
const poner = ($: Engine, ref: TabPlugin['ref'], f: (t: TabPlugin) => Partial<TabPlugin>) =>
  cambiar($, (p) => ({ tabs: p.tabs.map((t) => (t.ref.server === ref.server && t.ref.id === ref.id ? { ...t, ...f(t) } : t)) }))

const tope = <T,>($: Engine, p: Promise<T>): Promise<T | null> => Promise.race([p, $.clock.sleep(ESPERA_MS).then(() => null)])

/** La carga más nueva de cada tab: una respuesta que llega después de otra pedida más tarde se descarta. */
const cargaVigente = new Map<string, number>()

/** Pide la `<id>_panel` de un plugin con el `brandId` de la marca activa (regla 11). Nunca lanza: cualquier falla deja "Sin datos por ahora". */
async function cargarTab($: Engine, ref: TabPlugin['ref']): Promise<void> {
  const n = (cargaVigente.get(ref.server) ?? 0) + 1
  cargaVigente.set(ref.server, n)
  const brandId = (await read($, panel)).brandId
  await poner($, ref, () => ({ cargando: true }))
  let resultado: { panel: TabPlugin['panel']; aviso: string | null } = { panel: null, aviso: 'Sin datos por ahora' }
  try {
    const c = await tope($, $.mcp.connect(ref.server)) // regla 2: connect también tiene tope de 3 s
    if (c?.isConnected) {
      const r = await tope($, $.mcp.call(c.server, ref.tool, brandId ? { brandId } : {}))
      if (r && !r.isError) resultado = tabDeRespuesta(ref, r)
    }
  } catch {
    // se queda con "Sin datos por ahora"
  }
  if (cargaVigente.get(ref.server) !== n || (await read($, panel)).brandId !== brandId) return // llegó tarde o la marca cambió
  await poner($, ref, (t) => ({ cargando: false, panel: resultado.panel ?? t.panel, aviso: resultado.panel ? null : resultado.aviso }))
}

/** Regla 5: la tab existe si en la sesión hay una `*_panel` de un servidor conectado. Se reenumera al abrir y al actualizar. */
async function descubrirTabs($: Engine): Promise<void> {
  const nombres = (await $.tool.list()).map((t) => t.name)
  const refs = descubrir(nombres)
  const antes = (await read($, panel)).tabs
  const tabs: TabPlugin[] = refs.map((ref) => antes.find((t) => t.ref.server === ref.server && t.ref.id === ref.id) ?? { ref, panel: null, aviso: null, cargando: false })
  await cambiar($, (p) => ({ tabs, tab: p.tab === 'crear' || p.tab === 'cuenta' || tabs.some((t) => t.ref.id === p.tab) ? p.tab : 'crear' }))
  await Promise.all(tabs.map((t) => cargarTab($, t.ref)))
}

/** Abre el pane y descubre las tabs: la primera vez que Maasy se usa en la sesión, con /maasy-panel o si cambió la marca. Una tool maasy_* más no repite nada. */
async function encender($: Engine, { foco = false, refrescar = false } = {}): Promise<void> {
  const primera = !(await read($, activo))
  if (primera) await update($, activo, () => true)
  if (primera || foco) void $.ui.open(foco ? { ...PANE, focus: true } : PANE).catch(() => {})
  if (primera || foco || refrescar) void descubrirTabs($).catch(() => {})
}

type Elementos = ReturnType<Engine['ui']['resolve']>

const wordmark = ({ Text }: Elementos) => (
  <Text bold>
    Maasy<Text color={SEÑAL}>.</Text>
  </Text>
)

/** Un `pedido` deja su texto en el prompt (la persona aprieta Enter); un `enlace` abre su URL, ya validada en estado.ts. */
function accionUI($: Engine, { Button, Link }: Elementos, a: Accion, key: string) {
  if (a.tipo === 'enlace') return <Link key={key} href={a.url} label={a.etiqueta} />
  return (
    <Button key={key} plain onPress={() => $.prompt.fill({ text: a.texto, mode: 'replace' })}>
      {a.etiqueta}
    </Button>
  )
}

function bloqueUI($: Engine, ui: Elementos, b: Bloque, k: string) {
  const { Box, Text, Link } = ui
  const titulo = 'titulo' in b && b.titulo ? <Text bold>{b.titulo}</Text> : null
  switch (b.tipo) {
    case 'estado':
      return (
        <Box key={k} flexDirection="column">
          <Text>
            <Text color={DIM}>{b.titulo}: </Text>
            <Text bold color={COLOR_TONO[b.tono ?? 'neutro']}>
              {b.valor}
            </Text>
          </Text>
          {b.detalle && <Text color={FAINT}>{b.detalle}</Text>}
          {b.accion && accionUI($, ui, b.accion, `${k}-a`)}
        </Box>
      )
    case 'pasos':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i, n) => (
            <Text key={`${k}-${n}`} color={i.estado === 'pendiente' ? FAINT : i.estado === 'actual' ? SEÑAL : TOKENS.ok}>
              {i.estado === 'hecho' ? '✓' : i.estado === 'actual' ? '›' : '·'} {i.titulo}
            </Text>
          ))}
        </Box>
      )
    case 'checklist':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i) => (
            <Box key={`${k}-${i.id}`} flexDirection="column">
              <Text color={i.estado === 'ok' ? DIM : i.estado === 'falta' ? undefined : FAINT}>
                {i.estado === 'ok' ? '✓' : i.estado === 'falta' ? '✗' : '·'} {i.titulo}
              </Text>
              {i.estado === 'falta' && i.detalle && <Text color={FAINT}>{i.detalle}</Text>}
              {i.estado === 'falta' && i.accion && accionUI($, ui, i.accion, `${k}-${i.id}-a`)}
            </Box>
          ))}
        </Box>
      )
    case 'filas':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i, n) => (
            <Box key={`${k}-${n}`} flexDirection="column">
              <Text>
                {i.titulo}
                {i.chip && <Text color={COLOR_TONO[i.chip.tono ?? 'neutro']}> {i.chip.texto}</Text>}
              </Text>
              {i.detalle && <Text color={FAINT}>{i.detalle}</Text>}
              {i.accion && accionUI($, ui, i.accion, `${k}-${n}-a`)}
            </Box>
          ))}
        </Box>
      )
    case 'kv':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i, n) => (
            <Text key={`${k}-${n}`}>
              <Text color={DIM}>{i.clave}: </Text>
              {i.valor}
            </Text>
          ))}
        </Box>
      )
    case 'metricas':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i, n) => (
            <Text key={`${k}-${n}`}>
              <Text color={DIM}>{i.etiqueta}: </Text>
              <Text bold>{i.valor}</Text>
              {i.delta && <Text color={COLOR_TONO[i.tono ?? 'neutro']}> {i.delta}</Text>}
            </Text>
          ))}
        </Box>
      )
    case 'aviso':
      return (
        <Box key={k} flexDirection="column">
          <Text color={COLOR_TONO[b.tono ?? 'info']}>{b.texto}</Text>
          {b.accion && accionUI($, ui, b.accion, `${k}-a`)}
        </Box>
      )
    case 'enlace':
      return (
        <Box key={k} flexDirection="column">
          {titulo}
          {b.items.map((i, n) => (
            <Link key={`${k}-${n}`} href={i.url} label={i.etiqueta} />
          ))}
        </Box>
      )
    case 'vacio':
      return (
        <Box key={k} flexDirection="column">
          <Text color={DIM}>{b.texto}</Text>
          {b.accion && accionUI($, ui, b.accion, `${k}-a`)}
        </Box>
      )
  }
}

const barra = (pct: number, ancho = 20) => '█'.repeat(Math.round((pct / 100) * ancho)) + '░'.repeat(ancho - Math.round((pct / 100) * ancho))

function crearUI($: Engine, ui: Elementos, p: Panel) {
  const { Box, Text, Button, Link } = ui
  const c = p.crear
  const pct = progreso(c)
  const nombre = c.marca?.nombre ?? 'tu marca'
  const hayCuenta = p.cuenta.cupo !== null
  return (
    <Box flexDirection="column" gap={1}>
      {c.partes.length > 0 || c.marca ? (
        <Box flexDirection="column">
          <Text>
            <Text bold>ADN de {nombre} </Text>
            <Text color={pct === 100 ? TOKENS.ok : SEÑAL}>{pct}%</Text>
          </Text>
          <Text color={pct === 100 ? TOKENS.ok : SEÑAL}>{barra(pct)}</Text>
          {c.partes.map((x) => (
            <Text key={`parte-${x.id}`}>
              <Text color={DIM}>{nombreDeParte(x.id)} </Text>
              <Text color={x.estado === 'hecha' ? TOKENS.ok : x.estado === 'a medias' ? SEÑAL : FAINT}>
                {x.estado === 'hecha' ? 'Listo' : x.estado === 'a medias' ? 'En curso' : 'Pendiente'}
              </Text>
            </Text>
          ))}
          {c.faltan.length > 0 && !c.marca && (
            <Text color={FAINT}>
              Faltan: {c.faltan.slice(0, 3).join(', ')}
              {c.faltan.length > 3 ? ` y ${c.faltan.length - 3} más` : ''}
            </Text>
          )}
          {c.vence && !c.marca && <Text color={FAINT}>Tu borrador se guarda hasta el {c.vence.slice(0, 10)}.</Text>}
        </Box>
      ) : (
        <Text color={DIM}>Todavía no hay una marca ni una entrevista abierta.</Text>
      )}
      <Box flexDirection="column">
        {pasosCrear(c, hayCuenta).map((s) => (
          <Text key={`paso-${s.titulo}`} color={s.estado === 'pendiente' ? FAINT : s.estado === 'actual' ? SEÑAL : TOKENS.ok}>
            {s.estado === 'hecho' ? '✓' : s.estado === 'actual' ? '›' : '·'} {s.titulo}
          </Text>
        ))}
      </Box>
      <Box flexDirection="column">
        <Button key="empezar" variant="primary" hotkey="1" onPress={() => $.prompt.fill({ text: PEDIDOS.empezar, mode: 'replace' })}>
          {c.marca ? 'Crear otra marca' : c.partes.length ? 'Seguir la entrevista' : 'Empezar'}
        </Button>
        {c.marca?.url && <Link key="marca" href={c.marca.url} label="Ver el ADN completo" />}
        {c.marca && (
          <Button key="borrar" plain hotkey="2" onPress={() => $.prompt.fill({ text: PEDIDOS.borrar, mode: 'replace' })}>
            Borrar mi marca
          </Button>
        )}
      </Box>
    </Box>
  )
}

function cuentaUI(ui: Elementos, p: Panel) {
  const { Box, Text } = ui
  const fila = (k: string, v: string) => (
    <Text key={k}>
      <Text color={DIM}>{k}: </Text>
      {v}
    </Text>
  )
  return (
    <Box flexDirection="column">
      <Text bold>Cuenta</Text>
      {fila('Plan', p.cuenta.plan ?? '—')}
      {fila('Marcas', cupoTexto(p.cuenta.cupo))}
    </Box>
  )
}

function pluginUI($: Engine, ui: Elementos, t: TabPlugin) {
  const { Box, Text, Button } = ui
  return (
    <Box flexDirection="column" gap={1}>
      {t.cargando && !t.panel && <Text color={SEÑAL}>Cargando…</Text>}
      {!t.panel && !t.cargando && <Text color={DIM}>{t.aviso ?? 'Sin datos por ahora'}</Text>}
      {t.panel?.bloques.map((b, n) => bloqueUI($, ui, b, `${t.ref.id}-${n}`))}
      {t.panel && t.panel.bloques.length === 0 && <Text color={DIM}>Sin datos por ahora</Text>}
      <Button key={`act-${t.ref.id}`} plain hotkey="r" onPress={() => void cargarTab($, t.ref).catch(() => {})}>
        Actualizar
      </Button>
    </Box>
  )
}

export const register: Register = (on) => {
  // Inerte: solo registra el comando y vuelve. Sin MCP, sin tema, sin paneles (el arranque no cambia).
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    void $.command.register({ name: 'maasy-panel', description: 'Abre el panel de Maasy' }).catch(() => {})
    return ran
  })

  on('command.run', { command: 'maasy-panel' }, async ($) => {
    await encender($, { foco: true })
    return { text: 'Panel de Maasy abierto.' }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError) return ran
    const propia = toolCorta(e.tool)
    if (propia) {
      void (async () => {
        const p = await read($, panel)
        const r = aplicar(p.crear, p.cuenta, propia, ran.result)
        const brandId = marcaActiva(p.brandId, propia, ran.result)
        const cambio = brandId !== p.brandId
        // Otra marca: se vacían las tabs (con los datos de la anterior) y se vuelven a pedir con el brandId nuevo
        await cambiar($, () => (cambio ? { ...r, brandId, tabs: [] } : r))
        await encender($, { refrescar: cambio })
      })().catch(() => {})
    } else if (e.tool.startsWith('mcp__plugin_')) {
      // Regla 6: después de cada tool del servidor dueño de una tab (menos la propia `<id>_panel`), solo esa tab se refresca.
      void (async () => {
        if (!(await read($, activo)) || e.tool.endsWith('_panel')) return
        for (const t of (await read($, panel)).tabs) if (esDelServidor(e.tool, t.ref)) await cargarTab($, t.ref)
      })().catch(() => {})
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE.id }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const p = await read($, panel)
    const tabs = ordenar(p.tabs)
    const abierta = p.tab === 'cuenta' ? 'cuenta' : p.tab === 'crear' ? 'crear' : (tabs.find((t) => t.ref.id === p.tab)?.ref.id ?? 'crear')
    const titulo = (t: TabPlugin) => t.panel?.tab.titulo ?? t.ref.id
    const botones: { id: string; titulo: string }[] = [{ id: 'crear', titulo: 'Crear' }, { id: 'cuenta', titulo: 'Cuenta' }, ...tabs.map((t) => ({ id: t.ref.id, titulo: titulo(t) }))]
    const actual = tabs.find((t) => t.ref.id === abierta)
    return (
      <Box flexDirection="column" gap={1} padding={1} backgroundColor={FONDO}>
        {wordmark(ui)}
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {botones.map((b) =>
            b.id === abierta ? (
              <Button key={`tab-${b.id}`} variant="primary" onPress={() => cambiar($, () => ({ tab: b.id }))}>
                {b.titulo}
              </Button>
            ) : (
              <Button key={`tab-${b.id}`} plain onPress={() => cambiar($, () => ({ tab: b.id }))}>
                {b.titulo}
              </Button>
            )
          )}
        </Box>
        {abierta === 'crear' ? crearUI($, ui, p) : abierta === 'cuenta' ? cuentaUI(ui, p) : actual ? pluginUI($, ui, actual) : <Text color={DIM}>Sin datos por ahora</Text>}
        <Button key="actualizar-todo" plain dimColor onPress={() => void descubrirTabs($).catch(() => {})}>
          Actualizar pestañas
        </Button>
      </Box>
    )
  })

  // La franja (.cd-plugbar de maasy-ui): la pone la tab activa; sin franja en la activa, no hay franja (regla 7).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, activo)) || (await read($, franjaOculta))) return next(e)
    const p = await read($, panel)
    const t = p.tabs.find((x) => x.ref.id === p.tab)
    const texto = t ? (t.panel?.franja?.texto ?? null) : p.tab === 'crear' ? franjaCrear(p.crear) : null
    if (!texto) return next(e)
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const paso = t?.panel?.franja?.paso
    return (
      <Box flexDirection="row" gap={1} backgroundColor={BARRA} paddingX={1}>
        {wordmark(ui)}
        <Text color={DIM}>{texto}</Text>
        {paso && accionUI($, ui, paso, 'franja-paso')}
        <Button key="franja-panel" plain onPress={() => void $.ui.open({ ...PANE, focus: true }).catch(() => {})}>
          Abrir panel
        </Button>
        <Button key="franja-ocultar" role="dismiss" dimColor onPress={() => update($, franjaOculta, () => true)}>
          Ocultar
        </Button>
      </Box>
    )
  })
}
