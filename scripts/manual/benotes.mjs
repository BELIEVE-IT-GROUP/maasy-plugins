#!/usr/bin/env node
/**
 * Publica el Manual de Maasy en Claude en BeNotes (Cuadernos, cuadernos.believe-global.com) sin copiar a mano.
 *
 * BeNotes NO tiene llave de API: su única puerta programática es el MCP remoto `/api/mcp`
 * (Streamable HTTP, sin estado) con OAuth 2.1 por usuario (registro dinámico + PKCE S256). El access
 * token dura 1 h; el refresh dura 30 días y ROTA en cada uso: por eso cada corrida guarda el refresh
 * nuevo en Infisical antes de seguir. Es la receta del Manual de Believable
 * (scripts/manual/benotes.mjs) con su PROPIO secreto: compartir uno rompería al otro en la primera
 * rotación.
 *
 *   connect   una vez, quien administra Cuadernos, en su Mac con sesión abierta: registra el cliente,
 *             pide su consentimiento en el navegador y guarda BENOTES_MAASY_MANUAL_OAUTH en Infisical.
 *   push      crea o actualiza la nota con docs/manual/dist/benotes.json y la relee para verificar.
 *             Corre bajo `~/.believe/bin/infra` (necesita BENOTES_MAASY_MANUAL_OAUTH).
 *   plan      dice qué haría `push`, sin red y sin secretos.
 *
 * Usa el INFISICAL_TOKEN que entrega `infra`; fuera de infra, INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET.
 * Nunca imprime un token.
 */
import { execFileSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const config = JSON.parse(readFileSync(path.join(ROOT, 'docs/manual/manual.config.json'), 'utf8')).benotes
const BASE = (process.env.BENOTES_URL ?? config.url).replace(/\/+$/, '')
const SECRET_NAME = 'BENOTES_MAASY_MANUAL_OAUTH'
const PROJECT_ID = process.env.INFISICAL_PROJECT_ID ?? 'cff01b26-6296-4828-973e-dcc2f664113f'
const DOMAIN = process.env.INFISICAL_API_URL ?? 'https://vault.believe-global.com/api'
const PORT = 8766
const REDIRECT = `http://localhost:${PORT}/callback`

const fail = (message) => { console.error(`BeNotes: ${message}`); process.exit(1) }
const payload = () => JSON.parse(readFileSync(path.join(ROOT, 'docs/manual/dist/benotes.json'), 'utf8'))

function infisical() {
  const bin = [process.env.INFISICAL_BIN, '/opt/homebrew/bin/infisical', '/usr/local/bin/infisical'].filter(Boolean).find((candidate) => {
    try { execFileSync(candidate, ['--version'], { stdio: 'ignore' }); return true } catch { return false }
  }) ?? 'infisical'
  // `infra` ya entrega un INFISICAL_TOKEN de la misma identidad y borra el client secret antes de
  // correr el comando (2026-11): se usa ese token. El login propio queda para correr fuera de infra.
  let token = process.env.INFISICAL_TOKEN
  if (!token) {
    const clientId = process.env.INFISICAL_CLIENT_ID
    const clientSecret = process.env.INFISICAL_CLIENT_SECRET
    if (!clientId || !clientSecret) fail('falta INFISICAL_TOKEN (corre bajo ~/.believe/bin/infra) o INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET. No toqué nada.')
    token = execFileSync(bin, ['login', '--method=universal-auth', `--client-id=${clientId}`, `--client-secret=${clientSecret}`, `--domain=${DOMAIN}`, '--plain', '--silent'], { encoding: 'utf8' }).trim()
  }
  const scope = [`--projectId=${PROJECT_ID}`, '--env=prod', `--domain=${DOMAIN}`, `--token=${token}`, '--silent']
  return (value) => {
    // `NOMBRE=@archivo` NO sirve en esta CLI: guarda la ruta literal y sale con 0. Va por --file y
    // solo cuenta si la relectura es idéntica. El valor es JSON (comillas dobles), así que en el .env
    // va entre comillas simples, que son literales.
    if (/['\n]/.test(value)) fail(`${SECRET_NAME} trae comilla simple o salto de línea; no lo escribo.`)
    const dir = mkdtempSync(path.join(tmpdir(), 'benotes-'))
    const file = path.join(dir, 'secret.env')
    try {
      writeFileSync(file, `${SECRET_NAME}='${value}'\n`, { mode: 0o600 })
      execFileSync(bin, ['secrets', 'set', `--file=${file}`, ...scope], { stdio: 'ignore' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    const stored = execFileSync(bin, ['secrets', 'get', SECRET_NAME, '--plain', ...scope], { encoding: 'utf8' }).replace(/\n$/, '')
    if (stored !== value) fail(`Infisical no guardó ${SECRET_NAME} tal cual (la relectura no coincide). Vuelve a correr: node scripts/manual/benotes.mjs connect`)
  }
}

async function token(form) {
  const response = await fetch(`${BASE}/api/oauth/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.access_token || !body.refresh_token) fail(`el servidor no entregó tokens (${response.status} ${body.error ?? ''}). Si la sesión venció: node scripts/manual/benotes.mjs connect`)
  return body
}

let rpcId = 0
async function tool(accessToken, name, args = {}) {
  const response = await fetch(`${BASE}/api/mcp`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } })
  })
  const body = await response.json().catch(() => ({}))
  const text = body.result?.content?.[0]?.text
  if (!response.ok || body.error || body.result?.isError || typeof text !== 'string') fail(`${name} falló (${response.status}): ${body.error?.message ?? text ?? 'sin respuesta'}`)
  return JSON.parse(text)
}

async function connect() {
  const save = infisical()
  const registered = await fetch(`${BASE}/api/oauth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_name: 'Maasy en Claude: manual', redirect_uris: [REDIRECT] }) })
  const client = await registered.json().catch(() => ({}))
  if (registered.status !== 201 || !client.client_id) fail(`no pude registrar el cliente (${registered.status}).`)

  const b64url = (buffer) => buffer.toString('base64url')
  const verifier = b64url(randomBytes(48))
  const state = b64url(randomBytes(16))
  const authorize = new URL(`${BASE}/api/oauth/authorize`)
  for (const [key, value] of Object.entries({ response_type: 'code', client_id: client.client_id, redirect_uri: REDIRECT, code_challenge: b64url(createHash('sha256').update(verifier).digest()), code_challenge_method: 'S256', scope: 'read write', state })) authorize.searchParams.set(key, value)

  const code = await new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, REDIRECT)
      if (url.pathname !== '/callback') { response.writeHead(404).end(); return }
      const ok = url.searchParams.get('state') === state && url.searchParams.get('code')
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(ok ? 'Listo. Ya puedes cerrar esta pestaña.' : 'No se pudo conectar. Vuelve a la terminal.')
      server.close()
      if (ok) resolve(url.searchParams.get('code'))
      else reject(new Error('el navegador volvió sin código o con otro state'))
    }).listen(PORT, '127.0.0.1')
    setTimeout(() => { server.close(); reject(new Error('pasaron 5 minutos sin respuesta')) }, 300_000).unref()
    console.log(`Abre sesión en ${BASE} si no la tienes, y aprueba el acceso en la pestaña que se abre.`)
    try { execFileSync('open', [authorize.toString()]) } catch { console.log(`Abre a mano: ${authorize}`) }
  }).catch((error) => fail(error.message))

  const tokens = await token({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: verifier })
  save(JSON.stringify({ client_id: client.client_id, refresh_token: tokens.refresh_token }))
  const me = await tool(tokens.access_token, 'whoami')
  console.log(`Conectado a BeNotes (usuario ${me.userId}, permisos: ${me.scope}). Guardé ${SECRET_NAME} en Infisical (Believe-Infra / prod).`)
}

async function push() {
  const { title, content } = payload()
  let stored
  try { stored = JSON.parse(process.env[SECRET_NAME] ?? '') } catch { fail(`falta ${SECRET_NAME}. Una vez, quien administra Cuadernos, en su Mac: ~/.believe/bin/infra node scripts/manual/benotes.mjs connect`) }
  // El refresh rota: sin poder guardar el nuevo, no se gasta el viejo.
  const save = infisical()
  const tokens = await token({ grant_type: 'refresh_token', refresh_token: stored.refresh_token, client_id: stored.client_id })
  save(JSON.stringify({ client_id: stored.client_id, refresh_token: tokens.refresh_token }))
  const call = (name, args) => tool(tokens.access_token, name, args)

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
  console.log(`  servidor   ${BASE}/api/mcp (MCP con OAuth por usuario)`)
  console.log(`  nota       "${title}", ${content.content.length} bloques, ${bytes} bytes`)
  console.log(`  destino    ${config.page_id ? `actualiza la nota ${config.page_id} (notes_update)` : `busca por título exacto (notes_search); si existe la actualiza (notes_update), si no la crea (notes_create) en ${config.notebook ? `el cuaderno "${config.notebook}"` : 'el único cuaderno de la cuenta'}`}`)
  console.log('  verifica   relee la nota (notes_read) y compara título y contenido')
  console.log(`  requiere   ${SECRET_NAME} en Infisical (una vez: ~/.believe/bin/infra node scripts/manual/benotes.mjs connect)`)
}

const command = { connect, push, plan }[process.argv[2]]
if (!command) fail('uso: benotes.mjs connect | push | plan')
await command()
