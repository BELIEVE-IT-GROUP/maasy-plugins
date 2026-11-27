// Núcleo del panel de Maasy: los hooks del test hacen de motor. Cada caso corre en terminal y en Desktop.
// Corre con: claude plugin test plugin
import { expect, test } from 'claude-code/testing'

const CWD = '/tmp/mi-marca'
const OWN = 'mcp__plugin_maasy_maasy__maasy_get_interview_spec'
const CONECTOR = 'mcp__claude_ai_Maasy_MCP__maasy_get_interview_spec'
const CREAR = 'mcp__plugin_maasy_maasy__maasy_create_brand'
const VIBE_TOOL = 'mcp__plugin_maasy-vibe_vibe__vibe_panel'
const AJENA = 'mcp__plugin_otro_otro__otro_panel'
const marca = (id: string) => ({ project_id: id, creada: true, brand_name: 'mi-marca', control_plane_url: `https://maasy.ai/brands/${id}` })
const INDICE = {
  interview_id: 'iv1',
  partes: [
    { parte: 'identidad', estado: 'hecha' },
    { parte: 'propuesta', estado: 'a medias' },
    { parte: 'icp', estado: 'pendiente' },
    { parte: 'voz', estado: 'pendiente' }
  ],
  faltan: ['ofertas'],
  siguiente: 'propuesta',
  cupo: { usadas: 0, limite: 1 }
}
const VIBE = {
  version: 1,
  tab: { id: 'vibe', titulo: 'Vibe', orden: 20 },
  updated_at: '2026-11-25T10:00:00Z',
  franja: { texto: 'mi-marca · publicada', paso: { tipo: 'pedido', etiqueta: 'Publicar', texto: '/maasy-vibe:publish' } },
  bloques: [
    { tipo: 'estado', titulo: 'Proyecto', valor: 'mi-marca', tono: 'ok' },
    { tipo: 'imagen', alt: 'x' },
    { tipo: 'enlace', titulo: 'En tu panel', items: [{ tipo: 'enlace', etiqueta: 'Dominios', url: 'https://app.believable.studio/p/mi-marca/dominios' }, { tipo: 'enlace', etiqueta: 'Malo', url: 'https://malo.com/x' }] }
  ]
}

const hasta = async (cond: () => boolean) => {
  for (let i = 0; i < 100 && !cond(); i++) await new Promise((r) => setTimeout(r, 10))
}
const unRato = () => new Promise((r) => setTimeout(r, 150))

const pane = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'maasy',
    surface,
    component: 'Pane',
    requestId: 'maasy-panel',
    props: { title: 'Maasy', isFocused: true, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} }
  }) as const
const band = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'maasy',
    surface,
    component: 'AbovePrompt',
    props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 4, bodyColumns: 120, scroll: { offset: 0, bodyRows: 4 }, view: {} }
  }) as const

/** El motor de mentira: las tools de otros plugins, el MCP y lo que el panel deja en el prompt. */
function motor(on: Parameters<Parameters<typeof test>[1]>[1], opts: { vibe?: unknown; colgado?: boolean; connectColgado?: boolean; tools?: string[] } = {}) {
  const r = { fills: [] as string[], submits: 0, asks: 0, calls: [] as string[], args: [] as unknown[], connects: [] as string[], temas: 0, abiertos: 0, comandos: 0 }
  on('mcp.connect', (_, e) => {
    r.connects.push(e.server)
    if (opts.connectColgado) return new Promise<never>(() => {})
    return { value: { isConnected: true, server: e.server } }
  })
  on('mcp.call', (_, e) => {
    r.calls.push(`${e.server}:${e.tool}`)
    r.args.push(e.args)
    if (opts.colgado) return new Promise<never>(() => {})
    return { value: { isError: false, content: [{ type: 'text', text: JSON.stringify(opts.vibe ?? VIBE) }] } }
  })
  on('clock.sleep', () => ({ value: undefined }))
  on('prompt.fill', (_, e) => {
    r.fills.push(e.text)
    return { isFilled: true }
  })
  on('prompt.submit', (_, e) => {
    r.submits += 1
    return { text: e.text }
  })
  on('tool.call', { tool: 'AskUserQuestion' }, () => {
    r.asks += 1
    return { deny: 'el panel no pregunta con AskUserQuestion' }
  })
  on('tool.list', () => ({ value: (opts.tools ?? [VIBE_TOOL, 'Bash']).map((name) => ({ name })) }) as never)
  let creadas = 0
  on('tool.call', { tool: CREAR }, () => ({ result: { content: [{ type: 'text', text: JSON.stringify(marca(`brand-${++creadas}`)) }] } }))
  on('theme.set', () => {
    r.temas += 1
    return { value: { isDrawn: true, requestId: 't' } }
  })
  on('ui.open', () => {
    r.abiertos += 1
    return { value: { isPlaced: true } }
  })
  on('command.register', () => {
    r.comandos += 1
    return { value: { command: 'maasy-panel' } }
  })
  on('tool.call', { tool: OWN }, () => ({ result: { content: [{ type: 'text', text: JSON.stringify(INDICE) }] } }))
  on('tool.call', { tool: CONECTOR }, () => ({ result: { content: [{ type: 'text', text: JSON.stringify(INDICE) }] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  return r
}

test('arranque inerte: solo registra el comando, sin tema, panel, MCP ni franja', async ($, on) => {
  const r = motor(on)
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await unRato()
  expect(r.comandos).toBe(1)
  expect(r.temas).toBe(0)
  expect(r.abiertos).toBe(0)
  expect(r.connects).toEqual([])
  expect(r.calls).toEqual([])
  const ui = await $.ui.mount(band('desktop'))
  expect(await ui.find({ type: 'Text', text: /^Maasy\.?$/ })).toBeUndefined()
  await ui.unmount()
})

test('session.start no espera al tema, a los paneles ni al MCP', async ($, on) => {
  const nunca = () => new Promise<never>(() => {})
  on('theme.set', () => nunca())
  on('ui.open', () => nunca())
  on('mcp.connect', () => nunca())
  on('mcp.call', () => nunca())
  on('command.register', () => nunca())
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  const listo = await Promise.race([
    $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: false }).then(() => true),
    new Promise<false>((res) => setTimeout(() => res(false), 1000))
  ])
  expect(listo).toBe(true)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`la primera tool maasy_* enciende el panel: pane, tabs de plugins y la franja de la entrevista · ${surface}`, async ($, on) => {
    const r = motor(on)
    await $.session.start({ cwd: CWD, surface, isInteractive: true })
    await $.tool.call({ tool: OWN })
    await hasta(() => r.calls.length > 0)
    expect(r.temas).toBe(0) // §8: el núcleo no pone tema
    expect(r.abiertos).toBe(1)
    expect(r.connects).toEqual(['plugin:maasy-vibe:vibe'])
    expect(r.calls).toEqual(['plugin:maasy-vibe:vibe:vibe_panel'])
    const ui = await $.ui.mount(pane(surface))
    expect((await ui.find({ type: 'Text', text: /^ADN de tu marca/ }))?.text).toContain('38%')
    expect(await ui.find({ type: 'Text', text: /Voz y tono/ })).toBeDefined()
    await ui.press({ key: 'empezar' })
    expect(r.fills).toEqual(['/maasy:start'])
    expect(r.submits).toBe(0)
    await ui.unmount()
    const b = await $.ui.mount(band(surface))
    expect((await b.find({ type: 'Text', text: /Entrevista · parte 2 de 4/ }))?.text).toContain('parte 2 de 4')
    for (const key of ['franja-panel', 'franja-ocultar']) await b.press({ key })
    await b.unmount()
    expect(r.asks).toBe(0)
    expect(r.submits).toBe(0)
  })

  test(`la primera tool maasy_* del conector de la cuenta también enciende el panel · ${surface}`, async ($, on) => {
    // Claude Code descarta el servidor del plugin cuando la cuenta tiene el conector de Maasy a la misma URL:
    // las tools llegan como mcp__claude_ai_Maasy_MCP__* y el panel tiene que reconocerlas igual.
    const r = motor(on)
    await $.session.start({ cwd: CWD, surface, isInteractive: true })
    await $.tool.call({ tool: CONECTOR })
    await hasta(() => r.calls.length > 0)
    expect(r.abiertos).toBe(1)
    expect(r.connects).toEqual(['plugin:maasy-vibe:vibe'])
    const ui = await $.ui.mount(pane(surface))
    expect((await ui.find({ type: 'Text', text: /^ADN de tu marca/ }))?.text).toContain('38%')
    await ui.unmount()
  })

  test(`la tab del plugin se pinta por bloques, descarta el bloque desconocido y el enlace de otro origen · ${surface}`, async ($, on) => {
    const r = motor(on)
    await $.session.start({ cwd: CWD, surface, isInteractive: true })
    await $.tool.call({ tool: OWN })
    await hasta(() => r.calls.length > 0)
    await unRato()
    const ui = await $.ui.mount(pane(surface))
    await ui.press({ key: 'tab-vibe' })
    expect((await ui.find({ type: 'Text', text: /Proyecto/ }))?.text).toContain('mi-marca')
    expect(await ui.find({ type: 'Link', text: /Dominios/ })).toBeDefined()
    expect(await ui.find({ type: 'Link', text: /Malo/ })).toBeUndefined()
    await ui.unmount()
    const b = await $.ui.mount(band(surface))
    expect((await b.find({ type: 'Text', text: /mi-marca · publicada/ }))?.text).toContain('publicada')
    await b.press({ key: 'franja-paso' })
    expect(r.fills).toEqual(['/maasy-vibe:publish'])
    expect(r.submits).toBe(0)
    await b.unmount()
  })
}

test('una tab que no responde en 3 s dice qué falta y qué comando la vuelve a pedir, y no rompe el panel', async ($, on) => {
  const r = motor(on, { colgado: true })
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: OWN })
  await hasta(() => r.calls.length > 0)
  await unRato()
  const ui = await $.ui.mount(pane('desktop'))
  await ui.press({ key: 'tab-vibe' })
  const aviso = await ui.find({ type: 'Text', text: /Sin datos por ahora/ })
  expect(aviso).toBeDefined()
  expect(aviso?.text).toContain('/maasy-panel')
  await ui.unmount()
})

test('version distinta de 1: "Actualiza el plugin maasy-vibe"', async ($, on) => {
  const r = motor(on, { vibe: { ...VIBE, version: 2 } })
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: OWN })
  await hasta(() => r.calls.length > 0)
  await unRato()
  const ui = await $.ui.mount(pane('desktop'))
  await ui.press({ key: 'tab-vibe' })
  expect(await ui.find({ type: 'Text', text: /Actualiza el plugin maasy-vibe/ })).toBeDefined()
  await ui.unmount()
})

test('con el conector de Maasy, la tab del núcleo se pide al servidor que existe (claude_ai_Maasy_MCP)', async ($, on) => {
  const PANEL_CONECTOR = 'mcp__claude_ai_Maasy_MCP__maasy_panel'
  const r = motor(on, { tools: [PANEL_CONECTOR] })
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: CONECTOR })
  await hasta(() => r.connects.length > 0)
  expect(r.connects).toEqual(['claude_ai_Maasy_MCP'])
  await hasta(() => r.calls.length > 0)
  expect(r.calls).toEqual(['claude_ai_Maasy_MCP:maasy_panel'])
})

test('brandId: cada <id>_panel recibe la marca activa y al cambiar de marca se vacían las tabs', async ($, on) => {
  const r = motor(on)
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: OWN })
  await hasta(() => r.calls.length >= 1)
  expect(r.args).toEqual([{}]) // sin marca activa: {} sigue siendo válido
  await $.tool.call({ tool: CREAR })
  await hasta(() => r.calls.length >= 2)
  await unRato()
  await $.tool.call({ tool: CREAR })
  await hasta(() => r.calls.length >= 3)
  await unRato()
  expect(r.args).toEqual([{}, { brandId: 'brand-1' }, { brandId: 'brand-2' }])
})

test('una tool maasy_* más no vuelve a llamar a las tabs; solo la tool del servidor dueño refresca su tab', async ($, on) => {
  const r = motor(on)
  for (const tool of ['mcp__plugin_otro_otro__otro_hacer', 'mcp__plugin_maasy-vibe_vibe__vibe_publish'])
    on('tool.call', { tool }, () => ({ result: { content: [{ type: 'text', text: '{}' }] } }))
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: OWN })
  await hasta(() => r.calls.length >= 1)
  await unRato()
  await $.tool.call({ tool: OWN })
  await $.tool.call({ tool: 'mcp__plugin_otro_otro__otro_hacer' })
  await unRato()
  expect(r.calls.length).toBe(1)
  expect(r.abiertos).toBe(1)
  await $.tool.call({ tool: 'mcp__plugin_maasy-vibe_vibe__vibe_publish' })
  await hasta(() => r.calls.length >= 2)
  await unRato()
  expect(r.calls).toEqual(['plugin:maasy-vibe:vibe:vibe_panel', 'plugin:maasy-vibe:vibe:vibe_panel'])
})

test('un plugin ajeno (id fuera de la lista cerrada) no se vuelve tab ni recibe el brandId', async ($, on) => {
  const r = motor(on, { tools: [VIBE_TOOL, AJENA] })
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: CREAR })
  await hasta(() => r.calls.length >= 1)
  await unRato()
  expect(r.connects).toEqual(['plugin:maasy-vibe:vibe'])
  const ui = await $.ui.mount(pane('desktop'))
  expect(await ui.find({ type: 'Button', key: 'tab-otro' })).toBeUndefined()
  await ui.unmount()
})

test('un connect que no responde en 3 s deja el aviso con el comando que la vuelve a pedir', async ($, on) => {
  const r = motor(on, { connectColgado: true })
  await $.session.start({ cwd: CWD, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: OWN })
  await hasta(() => r.connects.length > 0)
  await unRato()
  const ui = await $.ui.mount(pane('desktop'))
  await ui.press({ key: 'tab-vibe' })
  const aviso = await ui.find({ type: 'Text', text: /Sin datos por ahora/ })
  expect(aviso).toBeDefined()
  expect(aviso?.text).toContain('/maasy-panel')
  await ui.unmount()
})
