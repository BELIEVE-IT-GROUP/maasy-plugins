#!/usr/bin/env node
/**
 * Purga la caché de Cloudflare de lo que acaba de publicar scripts/publish-manual.sh.
 *
 * R2 detrás de files.believe-global.com se cachea por URL: al republicar en la misma key, Cloudflare sigue sirviendo
 * la copia vieja (cf-cache-status: HIT) hasta purgar. También puede haber guardado un 404 de antes de la primera
 * publicación. Lee docs/manual/dist/publish-plan.tsv y purga cada URL pública.
 *
 * Necesita CLOUDFLARE_PURGE_TOKEN (permiso Zone > Cache Purge) en el entorno.
 * La zona se resuelve por nombre (believe-global.com). Nunca imprime el token.
 *
 * Uso: node scripts/manual/purge-cache.mjs   (con las variables de scripts/manual/.env.example cargadas)
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const config = JSON.parse(readFileSync(join(ROOT, 'docs/manual/manual.config.json'), 'utf8'))
const token = process.env.CLOUDFLARE_PURGE_TOKEN
if (!token) { console.error('Falta CLOUDFLARE_PURGE_TOKEN en el entorno.'); process.exit(1) }

const base = config.r2.public_base.replace(/\/+$/, '')
const host = new URL(base).hostname
const zoneName = host.split('.').slice(-2).join('.')
const keys = readFileSync(join(ROOT, 'docs/manual/dist/publish-plan.tsv'), 'utf8').split('\n').filter(Boolean).map((line) => line.split('\t')[1])
// index.html también se sirve como la carpeta, sin garantía: se purgan las dos formas de la página y el marcador.
const urls = keys.map((key) => `${base}/${key}`)

const api = async (path, init) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.success) throw new Error(`${path} falló (${response.status}): ${(body.errors ?? []).map((error) => error.message).join('; ') || 'sin detalle'}`)
  return body
}

const zones = await api(`/zones?name=${encodeURIComponent(zoneName)}`)
const zone = zones.result?.[0]?.id
if (!zone) throw new Error(`no encontré la zona ${zoneName}`)
for (let i = 0; i < urls.length; i += 30) await api(`/zones/${zone}/purge_cache`, { method: 'POST', body: JSON.stringify({ files: urls.slice(i, i + 30) }) })
console.log(`Caché purgada en ${zoneName}: ${urls.length} URL.`)
