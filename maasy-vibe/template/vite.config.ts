import { writeFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
// Plugin de Believable: source mapping (data-blv-loc) solo en desarrollo.
import blvLoc from './blv-loc-plugin.cjs'

// Ola 6: cuando Believable compila para un link de vista previa, setea esta variable con
// la ruta donde quiere el mapa `id -> archivo:linea`. Solo entonces se inyectan los
// data-blv-id. El mapa se escribe FUERA de dist/ a proposito: nunca se sube a R2.
const idMapOut = process.env.BLV_IDMAP_OUT

function writeIdMap(target: string): Plugin {
  return {
    name: 'blv-idmap-write',
    closeBundle() {
      const map = (globalThis as { __BLV_IDMAP__?: Record<string, string | null> }).__BLV_IDMAP__
      writeFileSync(target, JSON.stringify(map ?? {}), 'utf8')
    }
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    // ORDEN OBLIGATORIO: tanstackStart() SIEMPRE antes de react(). Lo marca como MUST el
    // skill oficial de TanStack; invertirlo rompe la transformacion de las rutas.
    tanstackStart({
      // SSG: cada ruta se convierte en un index.html con el contenido ya renderizado.
      // Es el motivo de existir de este stack — el HTML viaja escrito, legible por
      // agentes sin ejecutar JS. La salida cae en dist/client (ver CLAUDE.md).
      prerender: {
        enabled: true,
        crawlLinks: true,
        concurrency: 14,
        // Una ruta que revienta en el prerender frena el build. A proposito: publicar
        // una pagina rota en silencio es peor que no publicar.
        failOnError: true
      },
      // sitemap.xml con todas las rutas prerenderizadas. El host es la URL publica: si no se
      // pasa SITE_URL, sale un marcador (.invalid) que Believable cambia por la URL al publicar.
      sitemap: { enabled: true, host: process.env.SITE_URL || 'https://believable.invalid' }
    }),
    react({
      // Solo en dev (vite serve) inyectamos la "etiqueta invisible" data-blv-loc en
      // cada elemento JSX, para el Tweak panel sin IA. En build de produccion no va,
      // salvo el build de vista previa, que lleva el id opaco en su lugar.
      babel: {
        plugins:
          command === 'serve' ? [blvLoc] : idMapOut ? [[blvLoc, { mode: 'id' }]] : []
      }
    }),
    ...(idMapOut ? [writeIdMap(idMapOut)] : [])
  ],
  server: {
    // Believable controla el puerto; el host fijo evita exponer el dev server en la red
    host: '127.0.0.1'
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  }
}))
