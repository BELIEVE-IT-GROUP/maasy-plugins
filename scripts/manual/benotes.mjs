#!/usr/bin/env node
/**
 * Publica el Manual de Maasy en Claude en BeNotes (Cuadernos, cuadernos.believe-global.com) sin copiar a mano.
 *
 * Entra por el MCP remoto `/api/mcp` con el token de máquina BENOTES_MANUALES_TOKEN, compartido
 * por todas las recetas de manuales. No vence ni rota, así que nadie tiene que dar permiso en el
 * navegador y varios repos pueden usarlo a la vez. Su alcance es mínimo: solo lee y actualiza las
 * notas de manuales de su lista y crea notas en su cuaderno. El resto de las notas no existe para él.
 *
 * En BeNotes el manual es una nota índice (benotes.page_id) con una nota hija por capítulo
 * (benotes.capitulos: número → id). Cada nota lleva Markdown como texto, un párrafo por línea: el
 * capítulo sin su título, con las imágenes apuntando a R2 (url_base/assets/), cada figura como una línea
 * "> Figura: descripción y pie", cada pedido como citas bajo "Así se lo pides a Claude:" y los sellos
 * (`PRÓXIMAMENTE`, `GRATIS`...) sin comillas de código.
 *
 *   push   actualiza el índice y las hijas desde docs/manual/ (y dist/manual.json) y relee cada una.
 *          Necesita BENOTES_MANUALES_TOKEN en el entorno (cárgalo desde el gestor de secretos).
 *   plan   dice qué haría `push`, sin red y sin secretos.
 *
 * Nunca imprime el token.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const config = JSON.parse(readFileSync(path.join(ROOT, 'docs/manual/manual.config.json'), 'utf8')).benotes
const BASE = (process.env.BENOTES_URL ?? config.url).replace(/\/+$/, '')
const SECRET_NAME = 'BENOTES_MANUALES_TOKEN'

const fail = (message) => { console.error(`BeNotes: ${message}`); process.exit(1) }
const MANUAL = path.join(ROOT, 'docs/manual')

// Los sellos que la web pinta como etiqueta (PILLS en build.mjs) van en BeNotes sin comillas de código.
const PILLS = /`(SOLO EQUIPO|PRÓXIMAMENTE|BETA|GRATIS|STARTER|PRO|STUDIO)`/g

// Las notas que publica push, en orden: el índice y una hija por capítulo.
function notes() {
  if (!config.page_id || !config.capitulos) fail('faltan benotes.page_id o benotes.capitulos en docs/manual/manual.config.json.')
  const meta = JSON.parse(readFileSync(path.join(MANUAL, 'dist/manual.json'), 'utf8'))
  const plugins = Object.entries(meta.plugins).map(([name, version]) => `${name} ${version.split('+')[0]}`)
  const chapters = meta.sections.map((section, i) => {
    const number = String(i + 1).padStart(2, '0')
    const pageId = config.capitulos[number]
    if (!pageId) fail(`el capítulo ${number} (${section.title}) no tiene nota en benotes.capitulos. Créala como hija del índice y suma su id ahí y al token.`)
    const text = readFileSync(path.join(MANUAL, section.file), 'utf8').replace(/^# .*\n\n?/, '').replace(/\]\(img\/capturas\//g, `](${meta.url_base}/assets/`)
      .replace(/```figura\n([\s\S]*?)\n```/g, (_, html) => `> Figura: ${html.match(/data-alt="([^"]*)"/)?.[1] ?? ''} ${(html.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] ?? '').replace(/<[^>]+>/g, '')}`.trimEnd())
      .replace(/```pedido\n([\s\S]*?)\n```/g, (_, body) => ['Así se lo pides a Claude:', ...body.split('\n').filter(Boolean).map((line) => `> ${line}`)].join('\n'))
      .replace(PILLS, '$1')
      .trimEnd()
    return { pageId, title: `${number} ${section.title}`, text }
  })
  const index = [
    `Versión ${meta.manual_version} (${meta.date}). Describe ${plugins.slice(0, -1).join(', ')} y ${plugins.at(-1)}.`,
    `Versión con diseño y capturas: ${meta.url}`,
    `Esta nota es el índice. Cada capítulo es una nota hija, con su texto completo y sus imágenes como enlaces a ${meta.url_base.replace(/^https:\/\//, '')}/assets/. Se genera desde docs/manual/ del repo maasy-plugins: los cambios hechos acá se pierden en la siguiente publicación, edita el repo.`,
    '## Capítulos',
    ...meta.sections.map((section, i) => `${i + 1}. ${section.title}`)
  ].join('\n')
  return [{ pageId: config.page_id, title: config.title, text: index }, ...chapters]
}

// Lo mismo que hace BeNotes con `text`: un párrafo por línea, las vacías quedan vacías.
const paragraphs = (text) => text.split('\n').map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' }))

let rpcId = 0
async function tool(accessToken, name, args = {}) {
  const response = await fetch(`${BASE}/api/mcp`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } })
  })
  if (response.status === 401) fail(`BeNotes rechazó ${SECRET_NAME} (401): revocado o mal copiado en el gestor de secretos.`)
  const body = await response.json().catch(() => ({}))
  const text = body.result?.content?.[0]?.text
  if (!response.ok || body.error || body.result?.isError || typeof text !== 'string') fail(`${name} falló (${response.status}): ${body.error?.message ?? text ?? 'sin respuesta'}`)
  return JSON.parse(text)
}

async function push() {
  const accessToken = process.env[SECRET_NAME]
  if (!accessToken) fail(`falta ${SECRET_NAME} (token de máquina de BeNotes; vive en el gestor de secretos).`)
  const call = (name, args) => tool(accessToken, name, args)
  // BeNotes devuelve las claves en otro orden ({text,type} en vez de {type,text}): se compara en forma canónica.
  const canon = (value) => JSON.stringify(value, (_key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))
  let written = 0
  for (const { pageId, title, text } of notes()) {
    const before = (await call('notes_read', { pageId })).page
    if (before.title === title && canon(before.content?.content) === canon(paragraphs(text))) continue
    await call('notes_update', { pageId, title, text })
    // Verificación por efecto: se relee la nota y se comparan título y contenido.
    const { page } = await call('notes_read', { pageId })
    if (page.title !== title || canon(page.content?.content) !== canon(paragraphs(text))) fail(`la nota ${pageId} ("${title}") no quedó igual a lo enviado.`)
    console.log(`  ${title}: actualizada (versión ${page.version})`)
    written++
  }
  console.log(`BeNotes: "${config.title}" verificada (${written} de ${notes().length} notas escritas; el resto ya estaba al día).`)
}

function plan() {
  const list = notes()
  console.log(`  servidor   ${BASE}/api/mcp (MCP con token de máquina)`)
  console.log(`  índice     "${list[0].title}" (nota ${list[0].pageId})`)
  console.log(`  hijas      ${list.length - 1} capítulos, de "${list[1].title}" a "${list.at(-1).title}"`)
  console.log('  escribe    solo las que cambiaron (notes_update con text) y relee cada una (notes_read)')
  console.log(`  requiere   ${SECRET_NAME} en el entorno`)
}

const command = { push, plan }[process.argv[2]]
if (!command) fail('uso: benotes.mjs push | plan')
await command()
