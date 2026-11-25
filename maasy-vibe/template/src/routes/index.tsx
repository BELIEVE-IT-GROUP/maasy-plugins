import { createFileRoute } from '@tanstack/react-router'

import { SITE_NAME } from '../site'

const suggestions = [
  'Crea una landing page para un estudio de diseño con hero y precios',
  'Arma un dashboard con tarjetas de métricas y una tabla',
  'Diseña una página de producto con galería y CTA'
]

// Cada ruta es un archivo en src/routes/. El argumento de createFileRoute es la URL y
// tiene que coincidir con la ruta del archivo: el plugin la genera y la verifica.
export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: SITE_NAME }]
  }),
  component: Inicio
})

function Inicio() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Proyecto nuevo
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
          Pídele algo a Be en el panel de la izquierda para empezar.
        </p>

        <div className="mt-14 grid gap-3 text-left sm:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground transition-colors duration-200 hover:border-ring/50 hover:text-foreground"
            >
              {suggestion}
            </div>
          ))}
        </div>

        <p className="mt-14 text-xs text-muted-foreground/60">
          Esta pantalla desaparece con tu primera instrucción.
        </p>
      </div>
    </main>
  )
}
