// Pone una captura REAL del producto en la pantalla verde croma de una foto clave. Determinista,
// sin IA: la interfaz queda tal cual, legible. Busca las esquinas del verde (extremos de x±y),
// deforma la captura a ese cuadrilátero (filtro perspective) y monta la foto encima con el verde
// recortado (colorkey), así lo que tapa la pantalla (pelo, dedos, una taza) queda delante.
// Solo usa ffmpeg (sin ffprobe): $FFMPEG si está definido, si no `ffmpeg` del PATH.
//   node .claude/skills/hero-video/pantalla.mjs <foto-verde.jpg> <captura.png> <salida.jpg>
import { execFileSync, spawnSync } from 'node:child_process'

const [foto, captura, salida] = process.argv.slice(2)
if (!salida) throw new Error('uso: node pantalla.mjs <foto-verde.jpg> <captura.png> <salida.jpg>')
const FF = process.env.FFMPEG || 'ffmpeg'

const info = spawnSync(FF, ['-hide_banner', '-i', foto], { encoding: 'utf8' }).stderr
const dim = /Video:.*?, (\d{2,5})x(\d{2,5})/.exec(info)
if (!dim) throw new Error(`no pude leer el tamaño de ${foto}:\n${info.slice(-400)}`)
const [W, H] = [Number(dim[1]), Number(dim[2])]
const px = execFileSync(FF, ['-v', 'error', '-i', foto, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: W * H * 4 })

// Por fila, la tira continua de verde más larga (así una hoja o un reflejo suelto no cuenta):
// sus dos puntas son el borde de la pantalla en esa fila.
const borde = []
let n = 0
for (let y = 0; y < H; y++) {
  let mejor = [0, -1], ini = -1
  for (let x = 0; x <= W; x++) {
    const j = (y * W + x) * 3
    const verde = x < W && px[j + 1] >= 120 && px[j + 1] >= 1.8 * Math.max(px[j], px[j + 2])
    if (verde && ini < 0) ini = x
    if (!verde && ini >= 0) {
      if (x - 1 - ini > mejor[1] - mejor[0]) mejor = [ini, x - 1]
      ini = -1
    }
  }
  if (mejor[1] - mejor[0] < 20) continue
  n += mejor[1] - mejor[0] + 1
  borde.push([mejor[0], y], [mejor[1], y])
}
if (n < 1000) throw new Error(`no hay pantalla verde en ${foto}: regenera la foto clave pidiendo "flat chroma green screen"`)

// Envolvente convexa (monotone chain) y, sobre ella, el cuadrilátero de área máxima: se arranca
// por los extremos de x±y y se mueve cada esquina al punto que más área agrega, hasta que no
// mejore. Los extremos solos fallan con una pantalla muy en ángulo (un borde cerca de 45°).
const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
const pts = borde.sort((a, b) => a[0] - b[0] || a[1] - b[1])
const mitad = (lista) => lista.reduce((h, p) => {
  while (h.length >= 2 && cruz(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
  h.push(p)
  return h
}, [])
const casco = [...mitad(pts).slice(0, -1), ...mitad([...pts].reverse()).slice(0, -1)]
const area = (q) => Math.abs(q.reduce((s, p, i) => s + p[0] * q[(i + 1) % 4][1] - q[(i + 1) % 4][0] * p[1], 0)) / 2
const extremo = (f) => casco.reduce((m, p) => (f(p) > f(m) ? p : m))
// Orden alrededor del polígono: TL, TR, BR, BL.
const esq = [extremo((p) => -p[0] - p[1]), extremo((p) => p[0] - p[1]), extremo((p) => p[0] + p[1]), extremo((p) => p[1] - p[0])]
// Cada esquina solo se mueve por el arco de la envolvente entre sus dos vecinas: así el
// cuadrilátero nunca se cruza.
const N = casco.length
const arco = (de, a) => { const r = []; for (let i = (de + 1) % N; i !== a; i = (i + 1) % N) r.push(i); return r }
for (let mejoro = true, vueltas = 0; mejoro && vueltas < 50; vueltas++) {
  mejoro = false
  for (let k = 0; k < 4; k++) {
    const [ant, sig, yo] = [esq[(k + 3) % 4], esq[(k + 1) % 4], esq[k]].map((p) => casco.indexOf(p))
    const ida = arco(ant, sig)
    for (const i of ida.includes(yo) ? ida : arco(sig, ant)) {
      const q = esq.slice()
      q[k] = casco[i]
      if (area(q) > area(esq) + 0.5) { esq[k] = casco[i]; mejoro = true }
    }
  }
}
const [tl, tr, br, bl] = esq
// 2 % hacia afuera desde el centro: la captura desborda el verde y el borde lo define el croma de
// la foto (si no, en pantallas chicas o muy en ángulo queda un filo verde escalonado).
const [mx, my] = [(tl[0] + tr[0] + bl[0] + br[0]) / 4, (tl[1] + tr[1] + bl[1] + br[1]) / 4]
const q = [tl, tr, bl, br].map(([x, y]) => `${Math.round(mx + (x - mx) * 1.02)}:${Math.round(my + (y - my) * 1.02)}`).join(':')
// El recorte se limita al rectángulo de la pantalla (+ margen): con la foto entera, el colorkey
// también le quita el verde a una planta o a una prenda.
const xs = [tl, tr, bl, br].map((p) => p[0])
const ys = [tl, tr, bl, br].map((p) => p[1])
const [cx, cy] = [Math.max(0, Math.min(...xs) - 12), Math.max(0, Math.min(...ys) - 12)]
const [cw, ch] = [Math.min(W, Math.max(...xs) + 12) - cx, Math.min(H, Math.max(...ys) + 12) - cy]
console.log(`${foto}: ${n} px verdes, esquinas TL TR BL BR = ${q}`)

execFileSync(FF, ['-y', '-v', 'error', '-i', captura, '-i', foto, '-filter_complex',
  // Una pantalla real brilla menos que una captura pura: un toque más oscura y menos contraste.
  `[0]scale=${W}:${H},eq=brightness=-0.03:contrast=0.94,format=rgba,perspective=${q}:sense=destination,crop=${cw}:${ch}:${cx}:${cy}[s];` +
  `[1]format=rgba,split[base][c];[c]crop=${cw}:${ch}:${cx}:${cy},format=rgba,colorkey=0x00ff00:0.32:0.08,despill=type=green[f];` +
  `[s][f]overlay=format=rgb[p];[base][p]overlay=${cx}:${cy}:format=rgb,format=yuvj420p`,
  '-q:v', '2', salida])
console.log(`→ ${salida}`)
