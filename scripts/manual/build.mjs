#!/usr/bin/env node
/**
 * Construye el Manual de Maasy en Claude desde su única fuente: docs/manual/NN-*.md.
 *
 * Salida (docs/manual/dist/, git-ignored):
 *   index.html            página con la marca Believe (claro y oscuro), autocontenida salvo imágenes
 *   manual.md             todas las secciones en un solo Markdown (descarga)
 *   manual.json           versión, plugins que describe, hash del contenido y secciones
 *   benotes.json          {title, content}: el manual como doc Tiptap, lo que recibe BeNotes
 *   benotes-resumen.json  versión corta (portada + índice + link) para empujar a mano por el conector
 *   assets/*              imágenes que el manual referencia
 *   publish-plan.tsv      archivo<TAB>key de R2, en el orden en que se sube
 *
 * Sin dependencias: un parser de Markdown chico (el subconjunto que usa el manual) con dos
 * salidas, HTML y Tiptap, para que la web y BeNotes nunca se separen. Es el generador del Manual de
 * Believable (repo believable, scripts/manual/build.mjs) con la plantilla de Maasy en Claude, más las
 * figuras ```figura (HTML propio con prefijo vx-, en docs/manual/vx.css) y la lista de plugins.
 *
 * Uso: node scripts/manual/build.mjs
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = join(ROOT, 'docs/manual')
const DIST = join(SRC, 'dist')

// ---------------------------------------------------------------------------------------------
// Markdown → bloques. Subconjunto: # títulos, párrafos, listas planas, tablas, ``` bloques,
// > citas, imágenes y en línea **negrita**, *cursiva*, `código`, [enlace](url).
// ---------------------------------------------------------------------------------------------

const INLINE = /(`[^`]+`)|(\*\*.+?\*\*)|(\*[^*\s][^*]*?\*)|(!?\[[^\]]*\]\([^)\s]+\))/g

export function parseInline(source, marks = []) {
  const out = []
  let last = 0
  for (const match of source.matchAll(INLINE)) {
    if (match.index > last) out.push({ text: source.slice(last, match.index), marks })
    const token = match[0]
    if (match[1]) out.push({ text: token.slice(1, -1), marks: [...marks, { type: 'code' }] })
    else if (match[2]) out.push(...parseInline(token.slice(2, -2), [...marks, { type: 'bold' }]))
    else if (match[3]) out.push(...parseInline(token.slice(1, -1), [...marks, { type: 'italic' }]))
    else {
      const [, bang, label, href] = token.match(/^(!?)\[([^\]]*)\]\(([^)\s]+)\)$/)
      if (bang) out.push({ image: { alt: label, src: href } })
      else out.push(...parseInline(label, [...marks, { type: 'link', attrs: { href } }]))
    }
    last = match.index + token.length
  }
  if (last < source.length) out.push({ text: source.slice(last), marks })
  return out
}

const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
const LIST_ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/
const startsBlock = (line) => /^(#{1,4}\s|```|>|\|)/.test(line) || LIST_ITEM.test(line)

export function parseBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const body = []
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) body.push(lines[i])
      i++
      blocks.push({ type: 'code', lang: fence[1], text: body.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() }); i++; continue }

    if (line.startsWith('|') && /^\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const head = cells(line)
      const rows = []
      for (i += 2; i < lines.length && lines[i].startsWith('|'); i++) rows.push(cells(lines[i]))
      blocks.push({ type: 'table', head, rows })
      continue
    }

    if (line.startsWith('>')) {
      const body = []
      for (; i < lines.length && lines[i].startsWith('>'); i++) body.push(lines[i].replace(/^>\s?/, ''))
      blocks.push({ type: 'quote', blocks: parseBlocks(body.join('\n')) })
      continue
    }

    const item = line.match(LIST_ITEM)
    if (item) {
      const ordered = /\d/.test(item[1])
      const items = []
      for (; i < lines.length; i++) {
        const next = lines[i].match(LIST_ITEM)
        if (next) items.push(next[2])
        else if (lines[i].trim() && /^\s+/.test(lines[i])) items[items.length - 1] += ' ' + lines[i].trim()
        else break
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph = []
    for (; i < lines.length && lines[i].trim() && !(paragraph.length && startsBlock(lines[i])); i++) paragraph.push(lines[i].trim())
    const inline = parseInline(paragraph.join(' '))
    const images = inline.filter((node) => node.image)
    const onlyImages = images.length > 0 && inline.every((node) => node.image || !node.text.trim())
    blocks.push(onlyImages ? { type: 'gallery', images: images.map((node) => node.image) } : { type: 'paragraph', text: paragraph.join(' ') })
  }
  return blocks
}

// ---------------------------------------------------------------------------------------------
// Salida 1: HTML
// ---------------------------------------------------------------------------------------------

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const slug = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const plain = (text) => parseInline(text).map((node) => node.text ?? '').join('')

/** Sellos de disponibilidad que el manual escribe como `código` y la web pinta como etiqueta. */
const PILLS = { 'SOLO EQUIPO': 'team', PRÓXIMAMENTE: 'soon', BETA: 'beta', GRATIS: 'plan', STARTER: 'plan', PRO: 'plan', STUDIO: 'plan' }

function inlineHtml(text, asset) {
  return parseInline(text).map((node) => {
    if (node.image) return `<img src="${esc(asset(node.image.src))}" alt="${esc(node.image.alt)}" loading="lazy">`
    let html = esc(node.text)
    for (const mark of [...node.marks].reverse()) {
      if (mark.type === 'code') html = PILLS[node.text] ? `<span class="pill pill-${PILLS[node.text]}">${html}</span>` : `<code>${html}</code>`
      else if (mark.type === 'bold') html = `<strong>${html}</strong>`
      else if (mark.type === 'italic') html = `<em>${html}</em>`
      else if (mark.type === 'link') html = `<a href="${esc(mark.attrs.href)}">${html}</a>`
    }
    return html
  }).join('')
}

function blocksHtml(blocks, ctx) {
  const inline = (text) => inlineHtml(text, ctx.asset)
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading': {
        if (block.level === 1) return ''
        const id = `${ctx.id}-${slug(plain(block.text))}`
        return `<h${block.level} id="${id}">${inline(block.text)}</h${block.level}>`
      }
      case 'paragraph': return `<p>${inline(block.text)}</p>`
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul'
        return `<${tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`
      }
      case 'code':
        // Figura: HTML propio del repo (docs/manual/), con clases vx-. No viene de afuera, se publica tal cual.
        if (block.lang === 'figura') return block.text
        if (block.lang === 'pedido') {
          const asks = block.text.split('\n').filter((line) => line.trim()).map((line) => `<p class="ask">${esc(line)}</p>`).join('')
          return `<div class="asks"><span class="asks-label">Así se lo pides a Claude</span>${asks}</div>`
        }
        return `<pre><code>${esc(block.text)}</code></pre>`
      case 'quote': return `<aside class="callout">${blocksHtml(block.blocks, ctx)}</aside>`
      case 'table':
        return `<div class="table-wrap"><table><thead><tr>${block.head.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      case 'gallery':
        // Las capturas van a lo ancho, una por figura, con su pie: se leen como pantallas, no como íconos.
        return block.images.map((image) => `<figure class="shot"><img src="${esc(ctx.asset(image.src))}" alt="${esc(image.alt)}" loading="lazy" width="1440" height="900"><figcaption>${esc(image.alt)}</figcaption></figure>`).join('')
      default: return ''
    }
  }).join('\n')
}

// ---------------------------------------------------------------------------------------------
// Salida 2: doc Tiptap (lo que guarda BeNotes: heading, paragraph, bulletList, orderedList,
// listItem, codeBlock, blockquote, table*; marcas bold, italic, code, link). Sin imágenes.
// ---------------------------------------------------------------------------------------------

function inlineTiptap(text) {
  return parseInline(text).filter((node) => node.text).map((node) => {
    // La marca `code` de Tiptap excluye a las demás: si está, va sola.
    const marks = node.marks.some((mark) => mark.type === 'code') ? [{ type: 'code' }] : node.marks
    return marks.length ? { type: 'text', text: node.text, marks } : { type: 'text', text: node.text }
  })
}
const tiptapParagraph = (text) => {
  const content = inlineTiptap(text)
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' }
}

/** Texto de una figura: su descripción (data-alt) y su pie (figcaption), que dice la conclusión. */
export function figuraText(html) {
  const caption = (html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/) ?? [])[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const alt = html.match(/data-alt="([^"]*)"/)?.[1]
  return [alt, caption].filter(Boolean).join(' ')
}

/** BeNotes no dibuja HTML: de una figura deja su descripción y su pie como cita (la figura completa está en la página). */
function figuraTiptap(html) {
  const text = figuraText(html)
  return text ? [{ type: 'blockquote', content: [tiptapParagraph(`Figura: ${text}`)] }] : []
}

export function blocksTiptap(blocks) {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case 'heading': return [{ type: 'heading', attrs: { level: Math.min(block.level, 3) }, content: inlineTiptap(block.text) }]
      case 'paragraph': return [tiptapParagraph(block.text)]
      case 'list':
        return [{ type: block.ordered ? 'orderedList' : 'bulletList', content: block.items.map((item) => ({ type: 'listItem', content: [tiptapParagraph(item)] })) }]
      case 'code':
        if (block.lang === 'figura') return figuraTiptap(block.text)
        if (block.lang === 'pedido') return [{ type: 'blockquote', content: block.text.split('\n').filter((line) => line.trim()).map(tiptapParagraph) }]
        return [{ type: 'codeBlock', content: [{ type: 'text', text: block.text }] }]
      case 'quote': return [{ type: 'blockquote', content: blocksTiptap(block.blocks).filter((node) => node.type === 'paragraph') }]
      case 'table':
        return [{
          type: 'table',
          content: [
            { type: 'tableRow', content: block.head.map((cell) => ({ type: 'tableHeader', content: [tiptapParagraph(cell)] })) },
            ...block.rows.map((row) => ({ type: 'tableRow', content: row.map((cell) => ({ type: 'tableCell', content: [tiptapParagraph(cell)] })) }))
          ]
        }]
      default: return []
    }
  })
}

// ---------------------------------------------------------------------------------------------
// Chequeo propio del parser: si esto falla, no se construye nada.
// ---------------------------------------------------------------------------------------------

function selfCheck() {
  const assert = (ok, what) => { if (!ok) throw new Error(`Chequeo del parser falló: ${what}`) }
  const blocks = parseBlocks('# T\n\nHola **negrita con `código`** y [link](https://x.y).\n\n| A | B |\n|---|---|\n| `SOLO EQUIPO` | 2 |\n\n```pedido\nuno\ndos\n```\n\n> **Nota:** ojo\n\n1. a\n2. b\n\n![x](a.png) ![y](b.png)\n')
  assert(blocks.map((block) => block.type).join() === 'heading,paragraph,table,code,quote,list,gallery', 'tipos de bloque')
  const html = blocksHtml(blocks, { id: 's', asset: (src) => src })
  assert(html.includes('<strong>negrita con </strong><strong><code>código</code></strong>'), 'negrita con código')
  assert(html.includes('<span class="pill pill-team">SOLO EQUIPO</span>'), 'sello de disponibilidad')
  assert(html.includes('<p class="ask">dos</p>') && html.includes('<ol><li>a</li>'), 'pedidos y lista')
  assert((html.match(/<figure class="shot">/g) ?? []).length === 2, 'capturas a lo ancho')
  assert(!blocksHtml(parseBlocks('<script>'), { id: 's', asset: (src) => src }).includes('<script>'), 'escape de HTML')
  const doc = blocksTiptap(blocks)
  assert(doc[2].type === 'table' && doc[2].content[1].content[0].type === 'tableCell', 'tabla Tiptap')
  assert(JSON.stringify(doc).includes('"marks":[{"type":"code"}]') && !JSON.stringify(doc).includes('"text":""'), 'marcas Tiptap')
  assert(slug('Qué es Maasy en Claude') === 'que-es-maasy-en-claude', 'slug')
  const fig = parseBlocks('```figura\n<figure class="vx-fig" data-alt="a"><figcaption>b</figcaption></figure>\n```\n')
  assert(fig[0].lang === 'figura' && blocksHtml(fig, { id: 's', asset: (src) => src }).startsWith('<figure class="vx-fig"'), 'figura en HTML')
  assert(JSON.stringify(blocksTiptap(fig)).includes('Figura: a b'), 'figura en Tiptap')
  assert(figuraText('<figure data-alt="x"><figcaption><b>y</b> z</figcaption></figure>') === 'x y z', 'texto de figura')
}

// ---------------------------------------------------------------------------------------------
// Plantilla. Marca Believe (skill brand-kit-believe): Paper 50 y Believe Blue, Fraunces para
// titulares con su punto cian, Inter para el cuerpo, JetBrains Mono para datos. Cero degradados,
// cero sombras, radio 2 px, hairline como única separación. Oscuro: Believe Blue 950 / 900.
// ---------------------------------------------------------------------------------------------

const DARK = '--bg:#050C29;--surface:#041D5C;--raised:#0A1A4A;--text:#F2F2EC;--muted:#A9B0C8;--primary:#8AB4FF;--deep:#062778;--line:rgba(242,242,236,.14);--code-bg:rgba(242,242,236,.07);--ask:#0C3BB9;--ask-text:#FAFAF7;color-scheme:dark'

const CSS = `
:root{--bg:#FAFAF7;--surface:#F3F1E8;--raised:#FFFFFF;--text:#1A1A1A;--muted:#6B6B65;--primary:#0C3BB9;--deep:#062778;--signal:#00AAFF;--line:rgba(26,26,26,.12);--code-bg:#F3F1E8;--ask:#0C3BB9;--ask-text:#FAFAF7;--display:Fraunces,Georgia,serif;--font:Inter,-apple-system,system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,Menlo,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${DARK}}}
:root[data-theme="dark"]{${DARK}}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:400 17px/1.55 var(--font);-webkit-font-smoothing:antialiased}
a{color:var(--primary);text-underline-offset:3px}
img{max-width:100%;height:auto}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px}
.dot{color:var(--signal)}

.hero{border-bottom:1px solid var(--line)}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:22px 0}
.lockup{display:flex;align-items:center;gap:12px;text-decoration:none}
.lockup img{height:30px;width:auto;display:block}
.product{font:500 30px/1 var(--display);letter-spacing:-.02em;color:var(--text)}
.product-sub{font:500 12px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.theme{appearance:none;border:1px solid var(--line);background:transparent;color:var(--text);border-radius:2px;padding:8px 12px;font:500 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:40px;align-items:center;padding:40px 0 56px}
.eyebrow{font:500 11px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
h1.title{font:500 clamp(44px,7vw,80px)/1.02 var(--display);font-optical-sizing:auto;letter-spacing:-.025em;margin:18px 0 18px;text-wrap:balance;max-width:14ch}
h1.title em{font-style:italic;color:var(--primary)}
.sub{font-size:clamp(17px,2vw,19px);color:var(--muted);max-width:40ch;margin:0 0 26px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
.chip{border:1px solid var(--line);border-radius:2px;padding:7px 10px;font:500 12px/1.2 var(--mono);letter-spacing:.06em;color:var(--muted)}
.chip b{color:var(--text);font-weight:500}
.cta{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-block;border-radius:2px;padding:13px 20px;font:600 15px/1 var(--font);text-decoration:none}
.btn-fill{color:#FAFAF7;background:var(--deep)}
.btn-ghost{color:var(--primary);border:1px solid var(--line)}
.hero-shot{margin:0;border:1px solid var(--line);border-radius:2px;overflow:hidden;background:#050C29}
.hero-shot img{display:block;width:100%}
.hero-cap{font:400 12.5px/1.4 var(--font);color:var(--muted);background:var(--bg);padding:8px 12px;border-top:1px solid var(--line)}

.layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:56px;align-items:start;padding-top:44px;padding-bottom:80px}
.side{position:sticky;top:20px;max-height:calc(100vh - 40px);overflow:auto;padding-right:6px}
.side h2{font:500 11px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:0 0 12px}
.side ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--line)}
.side li a{display:flex;gap:10px;padding:7px 12px;margin-left:-1px;border-left:1px solid transparent;color:var(--text);text-decoration:none;font:500 14.5px/1.35 var(--font)}
.side li a span{color:var(--muted);font:500 12px/1.6 var(--mono)}
.side li a:hover{color:var(--primary)}
.side li a.on{border-left-color:var(--primary);color:var(--primary)}
details.toc{display:none;border:1px solid var(--line);border-radius:2px;padding:4px 16px;margin-top:24px}
details.toc summary{cursor:pointer;font-weight:600;padding:12px 0}
details.toc ol{margin:0 0 12px;padding-left:22px}
details.toc li{padding:5px 0}

main{min-width:0;max-width:800px}
section.part{padding:8px 0 56px;border-bottom:1px solid var(--line);margin-bottom:48px}
section.part:last-of-type{border-bottom:0}
.part-head{margin-bottom:10px}
.num{display:block;font:500 11px/1 var(--mono);letter-spacing:.2em;color:var(--muted);margin-bottom:12px}
.part-head h1{font:500 clamp(32px,4.6vw,46px)/1.08 var(--display);letter-spacing:-.02em;margin:0;text-wrap:balance}
h2{font:500 26px/1.2 var(--display);letter-spacing:-.015em;margin:44px 0 12px}
h3{font:600 18px/1.3 var(--font);margin:30px 0 8px}
p{margin:0 0 16px;max-width:66ch}
ul,ol{margin:0 0 18px;padding-left:24px;max-width:66ch}
li{margin:6px 0}
li::marker{color:var(--primary)}
strong{font-weight:600}
code{font:400 .86em/1.4 var(--mono);background:var(--code-bg);padding:2px 5px;border-radius:2px;overflow-wrap:anywhere}
pre{background:#050C29;color:#E8EEFB;border-radius:2px;padding:18px;overflow:auto;margin:0 0 20px;font-size:13px;line-height:1.5;border:1px solid var(--line)}
pre code{background:none;color:inherit;padding:0;font-size:inherit;overflow-wrap:normal}
.pill{display:inline-block;font:500 10.5px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;padding:4px 7px;border-radius:2px;vertical-align:2px;white-space:nowrap;border:1px solid currentColor}
.pill-team{color:var(--deep)}
.pill-soon{color:var(--muted)}
.pill-beta,.pill-plan{color:var(--primary)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pill-team{color:var(--text)}}
:root[data-theme="dark"] .pill-team{color:var(--text)}
.table-wrap{overflow-x:auto;margin:0 0 22px;border:1px solid var(--line);border-radius:2px}
table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.5}
th,td{text-align:left;vertical-align:top;padding:11px 14px;border-bottom:1px solid var(--line)}
th{font:500 11px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);background:var(--surface)}
tr:last-child td{border-bottom:0}
.asks{display:flex;flex-direction:column;align-items:flex-end;gap:8px;margin:6px 0 24px;padding:18px;border:1px solid var(--line);border-radius:2px;background:var(--surface)}
.asks-label{align-self:flex-start;font:500 11px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.ask{margin:0;max-width:88%;background:var(--ask);color:var(--ask-text);padding:10px 14px;border-radius:2px;font-size:15.5px;line-height:1.45}
.callout{border-left:2px solid var(--primary);background:var(--surface);border-radius:2px;padding:14px 18px;margin:0 0 22px}
.callout p:last-child{margin-bottom:0}
figure.shot{margin:10px 0 28px;border:1px solid var(--line);border-radius:2px;overflow:hidden;background:#050C29}
figure.shot img{display:block;width:100%}
figure.shot figcaption{font:400 13px/1.5 var(--font);color:var(--muted);background:var(--bg);padding:10px 14px;border-top:1px solid var(--line)}

footer{border-top:1px solid var(--line);padding:44px 0 56px}
footer .wrap{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;align-items:flex-end}
footer p{margin:0;max-width:56ch;font-size:14px;line-height:1.6;color:var(--muted)}
footer .sign img{height:26px;width:auto;display:block}
footer .sign .on-dark{display:none}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) footer .sign .on-light{display:none}:root:not([data-theme="light"]) footer .sign .on-dark{display:block}}
:root[data-theme="dark"] footer .sign .on-light{display:none}:root[data-theme="dark"] footer .sign .on-dark{display:block}

@media (max-width:960px){
  .hero-grid{grid-template-columns:1fr;padding:24px 0 40px}
  .layout{grid-template-columns:1fr;gap:0;padding-top:0}
  .side{display:none}
  details.toc{display:block}
  main{padding-top:36px}
}
@media print{.side,.theme,details.toc,.cta{display:none}.layout{display:block}body{background:#fff}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`

const SCRIPT = `
(function(){
  var root=document.documentElement,button=document.querySelector('.theme'),order=['auto','light','dark'],label={auto:'Tema: sistema',light:'Tema: claro',dark:'Tema: oscuro'},mode='auto';
  try{mode=localStorage.getItem('maasy-manual-theme')||'auto'}catch(e){}
  function apply(){if(mode==='auto')root.removeAttribute('data-theme');else root.setAttribute('data-theme',mode);button.textContent=label[mode]}
  button.addEventListener('click',function(){mode=order[(order.indexOf(mode)+1)%3];try{localStorage.setItem('maasy-manual-theme',mode)}catch(e){}apply()});
  apply();
  if(!('IntersectionObserver' in window))return;
  var links={};document.querySelectorAll('.side a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
  var spy=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;Object.keys(links).forEach(function(id){links[id].classList.toggle('on',id===entry.target.id)})})},{rootMargin:'-20% 0px -70% 0px'});
  document.querySelectorAll('section.part').forEach(function(section){spy.observe(section)});
})();
`

// El título de cada sección cierra con el punto cian de la marca (salvo que ya termine en signo).
const headline = (title) => `${esc(title)}${/[.?!:]$/.test(title) ? '' : '<span class="dot">.</span>'}`

const VX = readFileSync(join(SRC, 'vx.css'), 'utf8')

function page({ config, meta, sections }) {
  const nav = sections.map((section) => `<li><a href="#${section.id}"><span>${section.num}</span>${esc(section.title)}</a></li>`).join('')
  const body = sections.map((section) => `<section class="part" id="${section.id}"><div class="part-head"><span class="num">${section.num}</span><h1>${headline(section.title)}</h1></div>\n${section.html}\n</section>`).join('\n')
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.title)}</title>
<meta name="description" content="${esc(config.subtitle)}">
<meta name="robots" content="noindex">
<meta name="maasy-manual-version" content="${esc(meta.manual_version)}">
<meta property="og:title" content="${esc(config.title)}">
<meta property="og:description" content="${esc(config.subtitle)}">
<meta property="og:image" content="${esc(meta.url_base)}/assets/${esc(config.hero)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
<style id="vx">${VX}</style>
</head>
<body>
<header class="hero" id="top">
  <div class="wrap">
    <div class="topbar">
      <a class="lockup" href="#top" aria-label="Maasy en Claude"><span class="product">Maasy<span class="dot">.</span></span><span class="product-sub">en Claude</span></a>
      <button class="theme" type="button" aria-label="Cambiar tema">Tema</button>
    </div>
    <div class="hero-grid">
      <div>
        <span class="eyebrow">Manual de usuario · v${esc(meta.manual_version)}</span>
        <h1 class="title">Tu marca, <em>dentro de Claude</em><span class="dot">.</span></h1>
        <p class="sub">${esc(config.subtitle)}</p>
        <div class="chips">
          <span class="chip">Manual <b>v${esc(meta.manual_version)}</b></span>
          <span class="chip">Plugins documentados <b>${esc(meta.plugins_count)}</b></span>
          <span class="chip">${esc(meta.date)}</span>
        </div>
        <div class="cta">
          <a class="btn btn-fill" href="#${sections[0].id}">Empezar a leer</a>
          <a class="btn btn-ghost" href="manual.md" download>Descargar en Markdown</a>
        </div>
      </div>
      <figure class="hero-shot"><img src="assets/${esc(config.hero)}" alt="${esc(config.hero_alt)}" width="${esc(config.hero_size[0])}" height="${esc(config.hero_size[1])}"><figcaption class="hero-cap">${esc(config.hero_caption)}</figcaption></figure>
    </div>
  </div>
</header>
<div class="wrap">
  <details class="toc"><summary>Contenido</summary><ol>${sections.map((section) => `<li><a href="#${section.id}">${esc(section.title)}</a></li>`).join('')}</ol></details>
</div>
<div class="wrap layout">
  <nav class="side" aria-label="Contenido"><h2>Contenido</h2><ol>${nav}</ol></nav>
  <main>
${body}
  </main>
</div>
<footer>
  <div class="wrap">
    <p>${esc(config.title)} v${esc(meta.manual_version)}. Describe ${esc(meta.app_version)}. Fuente única: <code>docs/manual/</code> en el repo maasy-plugins. Las pantallas son los diseños aprobados con datos de ejemplo; donde difieren de lo publicado, el pie lo dice.</p>
    <div class="sign"><img class="on-light" src="assets/believe-positive.svg" alt="Believe" width="110" height="26"><img class="on-dark" src="assets/believe-negative.svg" alt="Believe" width="110" height="30"></div>
  </div>
</footer>
<script>${SCRIPT}</script>
</body>
</html>
`
}

// ---------------------------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------------------------

function build() {
  selfCheck()
  const read = (path) => readFileSync(path, 'utf8')
  const config = JSON.parse(read(join(SRC, 'manual.config.json')))
  const manualVersion = read(join(SRC, 'MANUAL-VERSION')).trim()
  // Qué plugins y versiones describe esta edición lo declara el manual (manual.config.json, plugins),
  // no el repo del día: autoupdate.mjs avisa cuando un plugin cambia de versión.
  const declared = Object.entries(config.plugins).filter(([, plugin]) => plugin.estado !== 'planeado')
  const appVersion = declared.map(([name, plugin]) => `${name} ${plugin.version}`).join(', ')
  const behind = declared.filter(([name, plugin]) => {
    try { return JSON.parse(read(join(ROOT, name, '.claude-plugin/plugin.json'))).version !== plugin.version } catch { return false }
  }).map(([name]) => name)
  if (!/^\d+\.\d+\.\d+$/.test(manualVersion)) throw new Error(`MANUAL-VERSION inválida: "${manualVersion}" (se espera N.N.N)`)

  // El historial tiene que nombrar esta versión: sin entrada, no hay edición.
  const entry = read(join(SRC, 'CHANGELOG.md')).match(new RegExp(`^## ${manualVersion.replace(/\./g, '\\.')} \\((\\d{4}-\\d{2}-\\d{2})\\)`, 'm'))
  if (!entry) throw new Error(`docs/manual/CHANGELOG.md no tiene la entrada "## ${manualVersion} (AAAA-MM-DD)".`)

  const files = readdirSync(SRC).filter((name) => /^\d\d-.+\.md$/.test(name)).sort()
  if (!files.length) throw new Error('No hay secciones (docs/manual/NN-*.md).')

  rmSync(DIST, { recursive: true, force: true })
  mkdirSync(join(DIST, 'assets'), { recursive: true })

  // Imágenes: el Markdown apunta a rutas reales del repo (se ven en GitHub); acá se copian a assets/.
  const assets = new Map()
  const addAsset = (name, source) => {
    const known = assets.get(name)
    if (known && known !== source) throw new Error(`Dos imágenes distintas con el mismo nombre: ${name}`)
    statSync(source)
    assets.set(name, source)
    return `assets/${name}`
  }
  for (const [name, source] of Object.entries(config.assets)) addAsset(name, join(ROOT, source))
  const asset = (src) => (/^https?:/.test(src) ? src : addAsset(basename(src), resolve(SRC, src)))

  const hash = createHash('sha256')
  const sections = files.map((file, index) => {
    const markdown = read(join(SRC, file))
    hash.update(file).update('\0').update(markdown).update('\0')
    if (markdown.includes('—')) throw new Error(`${file} tiene rayas largas (—): el manual no las usa.`)
    if (/<!--\s*REVISAR/.test(markdown)) throw new Error(`${file} tiene una marca REVISAR (la dejó autoupdate.mjs): revísala, actualiza la sección y quita la marca antes de construir.`)
    const blocks = parseBlocks(markdown)
    const title = blocks.find((block) => block.type === 'heading' && block.level === 1)?.text
    if (!title) throw new Error(`${file} no empieza con un título "# …".`)
    const id = slug(title)
    return { file, id, title, num: String(index + 1).padStart(2, '0'), markdown, blocks, html: blocksHtml(blocks, { id, asset }) }
  })
  if (!assets.has(config.hero)) throw new Error(`la imagen de portada "${config.hero}" no está en assets`)
  for (const [name, source] of [...assets].sort()) hash.update(name).update('\0').update(readFileSync(source)).update('\0')
  hash.update(readFileSync(join(SRC, 'vx.css'))).update('\0')
  hash.update(manualVersion).update('\0').update(appVersion)

  const urlBase = `${config.r2.public_base}/${config.r2.prefix}`
  let commit = ''
  try { commit = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() } catch { /* fuera de git: sin commit */ }
  const meta = {
    title: config.title,
    manual_version: manualVersion,
    app_version: appVersion,
    plugins: Object.fromEntries(declared.map(([name, plugin]) => [name, plugin.version])),
    plugins_count: declared.length,
    date: entry[1],
    content_sha256: hash.digest('hex'),
    commit,
    url: `${urlBase}/index.html`,
    url_base: urlBase,
    sections: sections.map(({ file, id, title }) => ({ file, id, title }))
  }

  for (const [name, source] of assets) copyFileSync(source, join(DIST, 'assets', name))
  writeFileSync(join(DIST, 'index.html'), page({ config, meta, sections }))

  const header = `<!-- ${config.title} v${manualVersion}. Describe ${appVersion}. Generado desde docs/manual/ del repo maasy-plugins: no editar este archivo. -->\n\n`
  const noFigures = (markdown) => markdown.replace(/```figura\n([\s\S]*?)\n```/g, (_, html) => `> Figura: ${figuraText(html)}`)
  const toAssets = (markdown) => noFigures(markdown).replace(/\]\((?!https?:)([^)\s]+\.(?:png|jpe?g|gif|webp|svg))\)/g, (_, src) => `](assets/${basename(src)})`)
  writeFileSync(join(DIST, 'manual.md'), header + sections.map((section) => toAssets(section.markdown).trim()).join('\n\n---\n\n') + '\n')
  writeFileSync(join(DIST, 'manual.json'), JSON.stringify(meta, null, 2) + '\n')

  // BeNotes: portada + todo el manual como doc Tiptap. El resumen es la versión para empujar a mano.
  const cover = [
    tiptapParagraph(`**Versión ${manualVersion}** (${meta.date}). Describe ${appVersion}.`),
    tiptapParagraph(`Versión con diseño y capturas: [${meta.url}](${meta.url})`),
    tiptapParagraph('Esta nota se genera desde `docs/manual/` del repo maasy-plugins. Los cambios hechos acá se pierden en la siguiente publicación: edita el repo.')
  ]
  const full = { title: config.benotes.title, content: { type: 'doc', content: [...cover, ...sections.flatMap((section) => blocksTiptap(section.blocks))] } }
  const summary = {
    title: config.benotes.title,
    content: {
      type: 'doc',
      content: [
        ...cover,
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Contenido' }] },
        { type: 'orderedList', content: sections.map((section) => ({ type: 'listItem', content: [tiptapParagraph(`[${section.title}](${meta.url}#${section.id})`)] })) }
      ]
    }
  }
  writeFileSync(join(DIST, 'benotes.json'), JSON.stringify(full))
  writeFileSync(join(DIST, 'benotes-resumen.json'), JSON.stringify(summary, null, 2) + '\n')

  // Orden de subida: primero lo que la página pide, al final la página y el marcador de versión.
  const plan = [
    ...[...assets.keys()].sort().map((name) => `assets/${name}`),
    'manual.md',
    'index.html',
    'manual.json'
  ]
  writeFileSync(join(DIST, 'publish-plan.tsv'), plan.map((file) => `${file}\t${config.r2.prefix}/${file}`).join('\n') + '\n')

  const words = sections.reduce((sum, section) => sum + section.markdown.split(/\s+/).length, 0)
  console.log(`${config.title} v${manualVersion} (describe ${appVersion}, ${meta.date})`)
  if (behind.length) console.log(`AVISO: ${behind.join(', ')} ya va en otra versión que la declarada en manual.config.json. Corre: node scripts/manual/autoupdate.mjs`)
  console.log(`${sections.length} secciones, ~${words} palabras, ${assets.size} imágenes, hash ${meta.content_sha256.slice(0, 12)}`)
  for (const file of [...plan, 'benotes.json', 'benotes-resumen.json']) console.log(`  ${String(statSync(join(DIST, file)).size).padStart(8)}  docs/manual/dist/${file}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { build() } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1) }
}
