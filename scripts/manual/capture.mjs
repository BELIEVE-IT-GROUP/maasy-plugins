#!/usr/bin/env node
/**
 * Pantallas del Manual de Maasy en Claude.
 *
 * Hoy el manual usa los DISEÑOS APROBADOS (mockups en files.believe-global.com/maasy/mockups/, datos de ejemplo
 * de "mi-marca" y de una persona llamada Ana), porque la mayoría de los plugins todavía no tiene UI publicada.
 * Este script los recorta con Playwright (Chromium sin ventana) y deja los PNG en docs/manual/img/capturas/.
 * Cada captura del manual dice en su pie que es el diseño aprobado y qué cambió en lo publicado.
 *
 * Cuando una pantalla real exista (plugin publicado, control plane en producción), se reemplaza su escena por una
 * captura real y se quita el aviso del pie. Las capturas reales del control plane (sin datos de clientes) entran
 * a mano en docs/manual/img/capturas/ y no pasan por acá.
 *
 * Uso: node scripts/manual/capture.mjs [--only nombre[,nombre]] [--list]
 * Playwright: usa `playwright-core` de PLAYWRIGHT_CORE (carpeta node_modules) o del que haya en este repo, y el
 * Chromium de ~/Library/Caches/ms-playwright (o CHROMIUM_BIN). No toca la red salvo las páginas de los mockups.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'docs/manual/img/capturas')
const BASE = 'https://files.believe-global.com/maasy/mockups/'

// frame: n-ésimo marco de Claude Desktop (.cd) de la página. clip: recorte fijo desde el borde superior de la página.
export const SCENES = [
  { name: 'instalar-plugin', url: 'plugin-maasy/01-instalar.html', frame: 0 },
  { name: 'alta', url: 'plugin-maasy/02-alta.html', frame: 0 },
  { name: 'entrevista-tarjetas', url: 'plugin-maasy/03-entrevista.html', frame: 0 },
  { name: 'subir-archivos', url: 'plugin-maasy/04-assets.html', frame: 0 },
  { name: 'marca-creada', url: 'plugin-maasy/05-marca.html', frame: 0 },
  { name: 'control-adn', url: 'maasy/adn.html', clip: { x: 0, y: 0, width: 1280, height: 960 } },
  { name: 'control-canvas', url: 'maasy/canvas.html', clip: { x: 0, y: 0, width: 1280, height: 1040 } },
  { name: 'control-crm', url: 'maasy/crm.html', clip: { x: 0, y: 0, width: 1280, height: 900 } },
  { name: 'control-llaves', url: 'maasy/llaves.html', clip: { x: 0, y: 0, width: 1280, height: 760 } },
  { name: 'vibe-elegir', url: 'vibe/index.html', frame: 1 },
  { name: 'vibe-app', url: 'vibe/index.html', frame: 2 },
  { name: 'vibe-publicar', url: 'vibe/index.html', frame: 3 },
  { name: 'motion-marca', url: 'motion/index.html', frame: 1 },
  { name: 'motion-avance', url: 'motion/index.html', frame: 2 },
  { name: 'lens-ver', url: 'motion/index.html', frame: 5 },
  { name: 'feed-semana', url: 'reply-feed/index.html', frame: 6 },
  { name: 'reply-borrador', url: 'reply-feed/index.html', frame: 1 },
  { name: 'reply-conversaciones', url: 'reply-feed/index.html', frame: 5 },
  { name: 'aos-auditar', url: 'aos/index.html', frame: 1 },
  { name: 'aos-medir', url: 'aos/index.html', frame: 3 }
]

function findCore() {
  const candidates = [process.env.PLAYWRIGHT_CORE, join(ROOT, 'node_modules')].filter(Boolean)
  for (const dir of candidates) if (existsSync(join(dir, 'playwright-core'))) return createRequire(join(dir, '/'))('playwright-core')
  throw new Error('No encuentro playwright-core. Pon PLAYWRIGHT_CORE=/ruta/a/node_modules (una carpeta que lo tenga).')
}

function findChromium() {
  if (process.env.CHROMIUM_BIN) return process.env.CHROMIUM_BIN
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  const shell = readdirSync(cache).filter((name) => name.startsWith('chromium_headless_shell-')).sort().pop()
  if (!shell) throw new Error('No encuentro el Chromium de Playwright (npx playwright install chromium) ni CHROMIUM_BIN.')
  return join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
}

async function main(argv) {
  if (argv.includes('--list')) return console.log(SCENES.map((scene) => scene.name).join('\n'))
  const only = argv.includes('--only') ? new Set(argv[argv.indexOf('--only') + 1].split(',')) : null
  const { chromium } = findCore()
  const browser = await chromium.launch({ executablePath: findChromium() })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' })
  mkdirSync(OUT, { recursive: true })
  let failed = 0
  for (const scene of SCENES.filter((item) => !only || only.has(item.name))) {
    const page = await context.newPage()
    try {
      await page.goto(BASE + scene.url, { waitUntil: 'networkidle' })
      const file = join(OUT, `${scene.name}.png`)
      if (scene.frame !== undefined) {
        const frames = await page.$$('.cd')
        if (!frames[scene.frame]) throw new Error(`no hay marco ${scene.frame} (hay ${frames.length})`)
        await frames[scene.frame].screenshot({ path: file })
      } else {
        await page.screenshot({ path: file, fullPage: true, clip: scene.clip })
      }
      console.log(`ok  ${scene.name}`)
    } catch (error) {
      failed++
      console.error(`ERROR ${scene.name}: ${error.message}`)
    } finally {
      await page.close()
    }
  }
  await browser.close()
  if (failed) process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2))
