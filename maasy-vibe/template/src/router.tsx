import { Link, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

// 404 por defecto de todo el sitio. Sin esto, cualquier ruta inexistente (un link a una
// pagina que todavia no existe, una URL con error de tipeo) dispara un warning del router
// en consola y deja la vista vacia. Reemplazable: si el sitio quiere un 404 con su propia
// personalidad, se cambia este componente — pero nunca se elimina la opcion.
function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-500">404</p>
      <h1 className="text-2xl font-semibold">Esta página no existe</h1>
      <p className="max-w-sm text-neutral-600">
        La dirección que abriste no corresponde a ninguna página de este sitio.
      </p>
      <Link to="/" className="underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  )
}

// El nombre `getRouter` es CONTRATO con el plugin de TanStack Start: lo busca exportado
// desde este archivo. Renombrarlo (o exportar el router ya construido en vez de una
// funcion) rompe el build sin un mensaje que lo explique.
export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
