#!/usr/bin/env node
/**
 * Publica el Manual de Maasy en Claude en BeNotes (Cuadernos, cuadernos.believe-global.com) sin copiar a mano.
 *
 * Entra por el MCP remoto `/api/mcp` con el token de máquina BENOTES_MANUALES_TOKEN, compartido
 * por todas las recetas de manuales. No vence ni rota, así que nadie tiene que dar permiso en el
 * navegador y varios repos pueden usarlo a la vez. Su alcance es mínimo: solo lee y actualiza las
 * notas de manuales de su lista y crea notas en su cuaderno. El resto de las notas no existe para él.
 *
 *   push   crea o actualiza la nota con docs/manual/dist/benotes.json y la relee para verificar.
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
const payload = () => JSON.parse(readFileSync(path.join(ROOT, 'docs/manual/dist/benotes.json'), 'utf8'))

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
  const { title, content } = payload()
  const accessToken = process.env[SECRET_NAME]
  if (!accessToken) fail(`falta ${SECRET_NAME} (token de máquina de BeNotes; vive en el gestor de secretos).`)
  const call = (name, args) => tool(accessToken, name, args)

  let pageId = config.page_id
  if (!pageId) {
    const found = await call('notes_search', { query: title, limit: 20 })
    const same = found.results.filter((page) => page.title === title)
    if (same.length > 1) fail(`hay ${same.length} notas llamadas "${title}". Deja una y pon su id en docs/manual/manual.config.json (benotes.page_id).`)
    pageId = same[0]?.id ?? null
  }
  if (pageId) {
    await call('notes_update', { pageId, title, content })
  } else {
    const { notebooks } = await call('notes_list_notebooks')
    const notebook = config.notebook ? notebooks.find((item) => item.id === config.notebook || item.name === config.notebook) : notebooks.length === 1 ? notebooks[0] : null
    if (!notebook) fail(`no sé en qué cuaderno crear la nota. Pon benotes.notebook en docs/manual/manual.config.json. Cuadernos: ${notebooks.map((item) => item.name ?? item.id).join(', ')}`)
    pageId = (await call('notes_create', { notebookId: notebook.id, title, content })).page.id
    console.log(`Nota creada. Deja el id en docs/manual/manual.config.json para que la identidad viaje con el repo: "page_id": "${pageId}"`)
  }

  // Verificación por efecto: se relee la nota y se comparan título y contenido.
  const { page } = await call('notes_read', { pageId })
  // BeNotes devuelve las claves en otro orden ({text,type} en vez de {type,text}): se compara en forma canónica.
  const canon = (value) => JSON.stringify(value, (_key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))
  const sameBody = canon(page.content?.content) === canon(content.content)
  if (page.title !== title || !sameBody) fail(`la nota ${pageId} no quedó igual a lo enviado (título o contenido distinto).`)
  console.log(`BeNotes: "${title}" publicada y verificada (nota ${pageId}, versión ${page.version}, ${content.content.length} bloques).`)
}

function plan() {
  const { title, content } = payload()
  const bytes = Buffer.byteLength(JSON.stringify(content))
  console.log(`  servidor   ${BASE}/api/mcp (MCP con token de máquina)`)
  console.log(`  nota       "${title}", ${content.content.length} bloques, ${bytes} bytes`)
  console.log(`  destino    ${config.page_id ? `actualiza la nota ${config.page_id} (notes_update)` : `busca por título exacto (notes_search); si existe la actualiza (notes_update), si no la crea (notes_create) en ${config.notebook ? `el cuaderno "${config.notebook}"` : 'el único cuaderno de la cuenta'}`}`)
  console.log('  verifica   relee la nota (notes_read) y compara título y contenido')
  console.log(`  requiere   ${SECRET_NAME} en el entorno`)
}

const command = { push, plan }[process.argv[2]]
if (!command) fail('uso: benotes.mjs push | plan')
await command()
