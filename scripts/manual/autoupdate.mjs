#!/usr/bin/env node
/**
 * Mantiene el Manual de Maasy en Claude al día con los plugins.
 *
 * Qué compara (contra --ref, por defecto origin/main):
 *   1. La versión de cada plugin (<plugin>/.claude-plugin/plugin.json) contra la que declara
 *      docs/manual/manual.config.json (plugins.<nombre>.version).
 *   2. Los plugins de .claude-plugin/marketplace.json contra los declarados: uno nuevo necesita capítulo,
 *      uno que llegó a main necesita pasar de estado y perder su etiqueta PRÓXIMAMENTE.
 *   3. Las rutas que alimentan cada capítulo (sources.<capítulo>.paths) desde el commit con que se revisó
 *      (sources.<capítulo>.sha) hasta --ref.
 *   Un plugin declarado con estado "pr:N" (todavía sin mergear) se mira en la cabeza de ese PR.
 *
 * Qué hace:
 *   (sin banderas)  ENSAYO: imprime el informe y no toca nada.
 *   --apply         crea la rama manual/autoupdate-<sha> en un worktree temporal y marca cada capítulo afectado
 *                   con un comentario "<!-- REVISAR ... -->" al inicio. build.mjs se NIEGA a construir mientras
 *                   haya una marca, así que nadie publica un capítulo sin revisar. Sube la rama.
 *   --pr            con --apply: abre el PR (gh; necesita GH_TOKEN en el entorno).
 *
 * Qué nunca hace: no toca la rama en la que se corre, no cambia versiones ni textos del manual (eso lo hace quien
 * revisa: actualiza el capítulo, pone la versión nueva en manual.config.json, sube MANUAL-VERSION, quita la marca)
 * y no publica. Mientras exista una rama manual/autoupdate-* sin integrar no abre otra.
 *
 * Uso:
 *   node scripts/manual/autoupdate.mjs [--ref origin/main] [--no-fetch] [--apply] [--pr] [--json]
 *   node scripts/manual/autoupdate.mjs --self-test
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONFIG_PATH = 'docs/manual/manual.config.json'
const MARK = /<!--\s*REVISAR[^>]*-->\n?/g

const git = (args, opts = {}) => execFileSync('git', ['-C', opts.cwd ?? ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const tryGit = (args, opts) => { try { return git(args, opts) } catch { return null } }
const showJson = (ref, path) => { const text = tryGit(['show', `${ref}:${path}`]); if (text === null) return null; try { return JSON.parse(text) } catch { return null } }

// ---------------------------------------------------------------------------------------------
// Lógica pura (se prueba con --self-test)
// ---------------------------------------------------------------------------------------------

/** Compara N.N.N con sufijos +build o -pre solo por su parte numérica; el sufijo cuenta como cambio si difiere. */
export const sameVersion = (a, b) => String(a) === String(b)

/**
 * @param declared  config.plugins
 * @param actual    { nombre: { version, onMain } | undefined } lo que hay en el ref (o en la cabeza de su PR)
 * @param marketplace nombres de plugins en marketplace.json del ref
 */
export function findPluginFindings(declared, actual, marketplace) {
  const out = []
  for (const [name, plugin] of Object.entries(declared)) {
    const found = actual[name]
    if (plugin.estado === 'planeado') {
      if (found) out.push({ tipo: 'llego', plugin: name, detalle: `${name} estaba planeado y ya existe (${found.version}): pásalo a estado main y escribe su capítulo como disponible` })
      continue
    }
    if (!found) { out.push({ tipo: 'desaparecio', plugin: name, detalle: `${name} (${plugin.estado}) ya no se encuentra en el ref` }); continue }
    if (/^pr:/.test(plugin.estado) && found.onMain) out.push({ tipo: 'llego', plugin: name, detalle: `${name} llegó a main (${found.version}): pasa su estado a main y quita la etiqueta PRÓXIMAMENTE del capítulo` })
    if (!sameVersion(plugin.version, found.version)) out.push({ tipo: 'version', plugin: name, de: plugin.version, a: found.version, detalle: `${name} cambió de ${plugin.version} a ${found.version}` })
  }
  for (const name of marketplace) if (!declared[name]) out.push({ tipo: 'nuevo', plugin: name, detalle: `${name} está en el marketplace y el manual no lo declara: falta su capítulo` })
  return out
}

/** Capítulos afectados: por el plugin que los alimenta o por una ruta cambiada. */
export function affectedSections(sources, findings, changedByFile) {
  const out = {}
  const add = (file, why) => { (out[file] ??= []).push(why) }
  for (const [file, source] of Object.entries(sources)) {
    for (const finding of findings) if ((source.plugins ?? []).includes(finding.plugin)) add(file, finding.detalle)
    for (const path of changedByFile[file] ?? []) add(file, `cambió ${path}`)
  }
  return out
}

function selfTest() {
  const assert = (ok, what) => { if (!ok) throw new Error(`self-test: ${what}`) }
  const declared = { a: { version: '1.0.0', estado: 'main' }, b: { version: '0.2.0', estado: 'pr:2' }, c: { estado: 'planeado' }, gone: { version: '1', estado: 'main' } }
  const actual = { a: { version: '1.1.0', onMain: true }, b: { version: '0.2.0', onMain: true }, c: { version: '0.1.0', onMain: true } }
  const f = findPluginFindings(declared, actual, ['a', 'b', 'c', 'nuevo'])
  const kinds = f.map((item) => `${item.tipo}:${item.plugin}`).sort().join()
  assert(kinds === 'desaparecio:gone,llego:b,llego:c,nuevo:nuevo,version:a', `hallazgos (${kinds})`)
  assert(findPluginFindings({ a: { version: '1.0.0', estado: 'main' } }, { a: { version: '1.0.0', onMain: true } }, ['a']).length === 0, 'sin cambios no hay hallazgos')
  const sections = affectedSections({ '01.md': { plugins: ['a'] }, '02.md': { plugins: ['z'] }, '03.md': { plugins: [] } }, f, { '03.md': ['x/y.md'] })
  assert(Object.keys(sections).sort().join() === '01.md,03.md', 'capítulos afectados')
  assert(sections['03.md'][0] === 'cambió x/y.md', 'motivo por ruta')
  const text = '# T\n\n<!-- REVISAR autoupdate 2026-01-01: algo -->\ncuerpo'
  assert(text.replace(MARK, '') === '# T\n\ncuerpo', 'la marca se quita')
  console.log('self-test OK')
}

// ---------------------------------------------------------------------------------------------
// Lectura del repo
// ---------------------------------------------------------------------------------------------

function readActual(ref, declared) {
  const actual = {}
  for (const [name, plugin] of Object.entries(declared)) {
    let onMain = true
    let manifest = showJson(ref, `${name}/.claude-plugin/plugin.json`)
    if (!manifest && /^pr:\d+$/.test(plugin.estado)) {
      const n = plugin.estado.slice(3)
      const local = `refs/manual-autoupdate/pr-${n}`
      if (tryGit(['fetch', '-q', 'origin', `+pull/${n}/head:${local}`]) !== null) manifest = showJson(local, `${name}/.claude-plugin/plugin.json`)
      onMain = false
    }
    if (manifest) actual[name] = { version: manifest.version, onMain }
  }
  // Plugins que no están declarados: se detectan por el marketplace.
  return actual
}

function readMarketplace(ref) {
  const market = showJson(ref, '.claude-plugin/marketplace.json')
  return (market?.plugins ?? []).map((plugin) => plugin.name)
}

function changedPaths(sources, ref) {
  const changed = {}
  for (const [file, source] of Object.entries(sources)) {
    if (!source.sha || !(source.paths ?? []).length) continue
    if (tryGit(['cat-file', '-e', `${source.sha}^{commit}`]) === null) { changed[file] = [`(el commit ${source.sha.slice(0, 7)} ya no existe: revisa el capítulo completo)`]; continue }
    const names = tryGit(['diff', '--name-only', source.sha, ref, '--', ...source.paths])
    if (names) changed[file] = names.split('\n').filter(Boolean)
  }
  return changed
}

// ---------------------------------------------------------------------------------------------
// Aplicar: rama con marcas REVISAR
// ---------------------------------------------------------------------------------------------

export function markSection(markdown, date, reasons) {
  const body = markdown.replace(MARK, '')
  const note = `<!-- REVISAR autoupdate ${date}: ${reasons.join(' | ').replace(/--/g, '-')} -->\n`
  const first = body.indexOf('\n')
  return first === -1 ? body + '\n' + note : body.slice(0, first + 1) + '\n' + note + body.slice(first + 1).replace(/^\n/, '')
}

function apply({ ref, short, sections, findings, openPr }) {
  const branch = `manual/autoupdate-${short}`
  const pending = (tryGit(['branch', '-a', '--list', '*manual/autoupdate-*']) ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
  if (pending.length) {
    console.log(`Ya hay una rama de autoupdate sin integrar (${pending.join(', ')}). No abro otra hasta que se integre o se borre.`)
    return
  }
  const dir = mkdtempSync(join(tmpdir(), 'maasy-manual-'))
  try {
    git(['worktree', 'add', '-q', '-b', branch, dir, ref])
    const date = new Date().toISOString().slice(0, 10)
    for (const [file, reasons] of Object.entries(sections)) {
      const path = join(dir, 'docs/manual', file)
      writeFileSync(path, markSection(readFileSync(path, 'utf8'), date, reasons))
    }
    git(['add', 'docs/manual'], { cwd: dir })
    git(['commit', '-q', '-m', `docs(manual): autoupdate ${short}, ${Object.keys(sections).length} capítulo(s) por revisar`], { cwd: dir })
    git(['push', '-q', '-u', 'origin', branch], { cwd: dir })
    console.log(`Rama ${branch} subida con ${Object.keys(sections).length} capítulo(s) marcados.`)
    if (openPr) {
      const body = ['Capítulos del manual que cambiaron de contexto. Cada uno trae un comentario `REVISAR` al inicio: build.mjs no construye mientras exista.', '', ...Object.entries(sections).map(([file, why]) => `- \`${file}\`: ${why.join('; ')}`), '', 'Para cerrar: actualiza el capítulo, pon la versión nueva en `manual.config.json` (plugins y sources), quita el comentario, sube `MANUAL-VERSION` y agrega la entrada al CHANGELOG.'].join('\n')
      const token = process.env.GH_TOKEN
      if (!token) { console.log('Sin GH_TOKEN: no abro el PR. Cárgalo en el entorno, o ábrelo a mano.'); return }
      execFileSync('gh', ['pr', 'create', '--repo', 'BELIEVE-IT-GROUP/maasy-plugins', '--head', branch, '--base', 'main', '--title', `docs(manual): autoupdate ${short}`, '--body', body], { env: { ...process.env, GH_TOKEN: token }, stdio: 'inherit' })
    }
    void findings
  } finally {
    tryGit(['worktree', 'remove', '--force', dir])
    rmSync(dir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------------------------

function main(argv) {
  if (argv.includes('--self-test')) return selfTest()
  const flag = (name) => argv.includes(name)
  const ref = argv.includes('--ref') ? argv[argv.indexOf('--ref') + 1] : 'origin/main'
  if (!flag('--no-fetch')) tryGit(['fetch', '-q', 'origin'])
  const sha = tryGit(['rev-parse', ref])
  if (!sha) throw new Error(`No existe ${ref}.`)
  const short = sha.slice(0, 7)
  const config = JSON.parse(readFileSync(join(ROOT, CONFIG_PATH), 'utf8'))

  const actual = readActual(ref, config.plugins)
  const findings = findPluginFindings(config.plugins, actual, readMarketplace(ref))
  const sections = affectedSections(config.sources ?? {}, findings, changedPaths(config.sources ?? {}, ref))

  if (flag('--json')) return console.log(JSON.stringify({ ref, sha, findings, sections }, null, 2))
  console.log(`==> Manual de Maasy en Claude: autoupdate contra ${ref} (${short})${flag('--apply') ? '' : ' (ENSAYO: no se escribe nada; con --apply se abre la rama)'}`)
  for (const [name, plugin] of Object.entries(config.plugins)) {
    const found = actual[name]
    console.log(`  ${name.padEnd(14)} manual: ${String(plugin.version ?? '-').padEnd(14)} ${plugin.estado.padEnd(9)} repo: ${found ? found.version + (found.onMain ? '' : ' (en el PR)') : 'no está'}`)
  }
  if (!findings.length && !Object.keys(sections).length) return console.log('Todo al día: ningún plugin cambió ni cambiaron las rutas que alimentan cada capítulo.')
  console.log('\nHallazgos de plugins:')
  for (const item of findings) console.log(`  - ${item.detalle}`)
  console.log('\nCapítulos por revisar:')
  for (const [file, why] of Object.entries(sections)) console.log(`  - ${file}\n      ${[...new Set(why)].join('\n      ')}`)
  if (flag('--apply')) apply({ ref, short, sections, findings, openPr: flag('--pr') })
  else console.log('\nCorre con --apply para dejar la rama con los capítulos marcados (y --pr para abrir el PR).')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)) } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1) }
}
