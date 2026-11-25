---
name: tanstack-start
description: >-
  El stack de este proyecto: TanStack Start (Vite + React) con rutas file-based en
  src/routes/ y prerender estatico (SSG). Úsalo SIEMPRE que toques rutas, navegacion,
  metadatos del <head>, carga de datos, el build, o cuando una pagina tenga que salir
  renderizada en el HTML. Tambien cuando algo "compila pero se rompe al navegar", cuando
  aparezca un reflejo de Next.js (app/, page.tsx, "use client", metadata export), o
  cuando un componente toque window/document.
version: 1.0.0
---

# TanStack Start en un proyecto Believable

Este proyecto **no es una SPA de Vite**. Es TanStack Start en modo prerender: cada ruta se
convierte en un archivo HTML con el contenido ya escrito, y ese HTML es el producto. Un
buscador o un agente lee la pagina completa sin ejecutar una linea de JavaScript.

**Antes de escribir codigo de routing, datos o `<head>`, lee el archivo de referencia que
corresponda en `oficial/`** (son los skills oficiales de TanStack, copiados literales). Tu
memoria de este framework probablemente esta desactualizada: la API cambio, y la version
vieja del *propio* Start (la de `app.config.ts` / Vinxi) es el drift mas peligroso, mas
que confundirlo con Next.js.

## Las dos cosas que el skill oficial NO cubre y aca importan

### 1. CSS y Tailwind: el import va con `?url`

El skill oficial no menciona CSS ni una vez. El patron correcto en Start es importar la
hoja como **URL** y declararla en `links` de la ruta raiz:

```tsx
// src/routes/__root.tsx
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({ links: [{ rel: 'stylesheet', href: appCss }] }),
  component: RootComponent
})
```

Un `import '../styles.css'` a secas anda en dev y deja la pagina **sin estilos en el HTML
del prerender**: el build pasa, la pagina se ve rota recien despues de publicar. El
template ya viene con esto resuelto en `src/routes/__root.tsx` — no lo cambies.

Tailwind v4 es CSS-first: los tokens viven en el bloque `@theme` de `src/styles.css` y
`tailwindcss()` va en `vite.config.ts` **antes** de `tanstackStart()`. No existe
`tailwind.config.*` y no hay que crearlo.

### 2. Donde cae la salida del build: `dist/client/`

El skill oficial de deployment solo habla del carril Nitro (`.output/server/…`). Con
prerender estatico la salida real es:

```
dist/
├── client/          ← EL SITIO. Es lo unico que se publica.
│   ├── index.html            (la ruta /)
│   ├── precios/index.html    (un index.html por ruta, en su carpeta)
│   └── assets/…
└── server/          ← bundle de servidor. NUNCA se publica.
```

Si alguna vez tenes que mirar el HTML de salida: **no uses `grep` a secas**. El HTML del
prerender contiene bytes NUL dentro del payload de hidratacion, `grep` cae a modo binario
y devuelve falsos negativos en silencio. Usa `grep -a` o lee el archivo desde codigo.

## Reglas duras de este proyecto

### `createServerFn` esta PROHIBIDO

Este proyecto se publica **estatico**: no hay servidor en runtime. Una server function que
alimente un loader se hornea en el HTML durante el build (parece funcionar) y despues, si
el visitante llega por navegacion de cliente, pega contra `/_serverFn/…`, recibe 404 y la
ruta cae en el error boundary con `Something went wrong!`. Sin error en consola, sin aviso
en el build. Esta medido, no es teoria.

Lo mismo vale para `createMiddleware`, server routes y cualquier cosa de
`@tanstack/react-start` que necesite un proceso vivo del lado servidor.

**Todo lo server-side va a Edge Functions (Deno)** en `supabase/functions/<nombre>/index.ts`,
que es donde ya viven los secretos y el service role. Ver el `CLAUDE.md` del proyecto.

### Componentes que tocan `window` o `document`: `<ClientOnly>`

El prerender ejecuta tus componentes **en el servidor**, donde no existen `window`,
`document`, `localStorage` ni `matchMedia`. Tocarlos durante el render tumba el build
(`failOnError: true`).

La convencion del proyecto es el mecanismo idiomatico de Start:

```tsx
import { ClientOnly } from '@tanstack/react-router'

<ClientOnly fallback={<div className="h-64" />}>
  <MapaConWebGL />
</ClientOnly>
```

Reglas practicas:

- Leer `window` dentro de `useEffect` o de un handler **es seguro** y no necesita
  `<ClientOnly>`: no corre en el servidor.
- Leerlo **durante el render** (o en el cuerpo del modulo) necesita `<ClientOnly>`.
- El `fallback` tiene que ocupar el mismo espacio que el contenido real, o la pagina salta
  al hidratar.
- Si necesitas saber si ya hidrataste, `useHydrated()` de `@tanstack/react-start`.

## Trampas conocidas (medidas, no supuestas)

| Reflejo | Lo correcto |
|---|---|
| `app.config.ts` con `defineConfig` de `@tanstack/react-start/config` | **`vite.config.ts` plano** con el plugin `tanstackStart()`. La API vieja no la lee nadie: build muerto |
| `<Meta />` en el shell | **`<HeadContent />`**. `<Meta />` no existe como export: build muerto |
| Crear `src/client.tsx` y `src/ssr.tsx` | **No existen.** Son dos archivos muertos que ademas confunden |
| `export const router = createRouter(...)` | **`export function getRouter()`** en `src/router.tsx`. El nombre es contrato con el plugin |
| `react()` antes de `tanstackStart()` | `tanstackStart()` **siempre primero**. Lo marca MUST el skill oficial |
| `export const metadata = {...}`, `page.tsx`, `layout.tsx`, `"use client"`, `next/link` | Reflejos de Next.js. Aca: `head:` en la ruta, `src/routes/*.tsx`, `<Link to="…">` de `@tanstack/react-router` |
| `dist/index.html` en la raiz | `dist/client/index.html` |
| Olvidar `<Scripts />` en el shell | La pagina se ve pero nunca hidrata: no responde a nada |

## Referencia oficial (`oficial/`)

Copias literales de los skills que mantiene el equipo de TanStack. Léelos ante la duda; no
los edites.

| Archivo | Cuando abrirlo |
|---|---|
| `react-start.md` | Entrada: estructura del proyecto, imports, setup completo |
| `start-core.md` | Nucleo de Start: que es cada pieza |
| `start-core-execution-model.md` | **Que corre en el servidor y que en el cliente.** `ClientOnly`, `useHydrated`, `createIsomorphicFn` |
| `start-core-deployment.md` | Prerender, SSR selectivo, SEO |
| `router-core.md` | Routing: el mapa general |
| `router-core-data-loading.md` | Loaders, contexto del router, invalidacion |
| `router-core-navigation.md` | `<Link>`, `useNavigate`, redirects |
| `router-core-path-params.md` | Rutas dinamicas (`$id`) |
| `router-core-search-params.md` + `-validation.md` | Query params tipados y su validacion |
| `router-core-type-safety.md` | Tipos del router de punta a punta |
| `router-core-not-found-and-errors.md` | 404 y error boundaries |
| `router-core-code-splitting.md` | Carga diferida por ruta |
| `router-core-ssr.md` | Hidratacion, mismatches, SSR selectivo |
| `router-core-auth-and-guards.md` | Guards de ruta (el login sigue siendo Supabase) |
| `react-router.md` | Bindings de React del router |
| `router-plugin.md` | El plugin de Vite y la generacion de `routeTree.gen.ts` |
| `virtual-file-routes.md` | Rutas declaradas a mano en vez de por archivo |
| `migrate-from-nextjs.md` | Cuando notes que estas escribiendo Next.js |
| `migrate-from-react-router.md` | Cuando notes que estas escribiendo React Router v6 |

> Los archivos de `oficial/` describen el framework completo, servidor incluido. Cuando
> alguno explique `createServerFn`, middleware o server routes: **en este proyecto no
> aplican** (ver la regla dura de arriba). Esa parte del framework no esta disponible aca.
