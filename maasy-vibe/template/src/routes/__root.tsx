import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

// El CSS entra como URL y se declara en `links`. Es el patron correcto en Start: un
// `import '../styles.css'` a secas anda en dev y deja la pagina SIN estilos en el HTML
// del prerender. El skill oficial de TanStack no cubre CSS; esto lo resuelve el
// template para que no haya que adivinarlo.
import appCss from '../styles.css?url'
import { SITE_DESCRIPTION, SITE_NAME } from '../site'

export const Route = createRootRoute({
  // Todo lo que va al <head> se declara aca (y por ruta, en el `head()` de cada una),
  // NUNCA en un index.html: en este stack el documento lo arma React. El componente que
  // lo imprime es `<HeadContent />`; el `Meta` de las versiones viejas ya no existe.
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_NAME },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:title', content: SITE_NAME },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      // Imagen y favicon neutros de public/: se reemplazan por los de la marca (mismo nombre).
      { property: 'og:image', content: '/og.png' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// El documento ENTERO lo renderiza React, <html> y <body> incluidos.
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {/* Sin <Scripts /> el HTML llega renderizado pero nunca hidrata: la pagina se
            ve bien y no responde a nada. */}
        <Scripts />
      </body>
    </html>
  )
}
