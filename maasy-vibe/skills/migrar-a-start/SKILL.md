---
name: migrar-a-start
description: >-
  Migra un proyecto Believable viejo (SPA de Vite con index.html + src/main.tsx + App.tsx)
  al stack nuevo: TanStack Start con prerender estatico, para que cada pagina viaje como
  HTML ya escrito y legible por agentes. Úsalo cuando el usuario diga "migra mi proyecto al
  stack nuevo", "pásalo a TanStack", "quiero el deploy nuevo", "hazlo agent-ready",
  "actualiza este proyecto al template nuevo", o pregunte por que su sitio no sale
  renderizado en el HTML.
version: 1.2.0
---

<!-- Versión del plugin de Claude Code: se genera a mano desde template/.claude/skills/migrar-a-start/SKILL.md
cambiando solo lo que depende de la app (preview, checkpoints, ruta de la plantilla). Un cambio de receta va en las dos. -->

# Migrar un proyecto viejo a TanStack Start (SSG)

Los proyectos que Believable creo antes del template v2 son **SPAs de Vite**: un
`index.html` con un `<div id="root">` vacio, `src/main.tsx` que monta React, y `App.tsx`
como pantalla unica. El HTML que se publica no tiene contenido: un buscador o un agente que
no ejecuta JavaScript ve una pagina en blanco.

El stack nuevo es **TanStack Start con prerender**: el build renderiza cada ruta y escribe
un `index.html` con el contenido adentro. Eso es lo que se gana. Todo lo demas (los
componentes, el CSS, los tokens de Tailwind, el diseno) **viaja intacto**.

> Trabaja con el skill **`tanstack-start`** al lado. Este documento es la receta de la
> mudanza; ese otro es el manual del framework. Ante cualquier duda de routing, `head()`,
> loaders o build, la respuesta esta ahi, no en tu memoria (que de este framework esta
> desactualizada).

> **Mantener este skill vivo.** Este skill viaja en el plugin de Believable para Claude
> Code. Si migrando aprendes algo nuevo (una trampa, un caso de router que no estaba, un
> paso que faltaba), dile a la persona que lo reporte al equipo de Believable para que entre
> a la receta canónica y le llegue a todos. No edites los archivos del plugin: se pisan en
> la próxima actualización.

## Antes de tocar nada: dile al usuario si vale la pena

Migrar es mecanico pero no es gratis. Sé honesto **antes** de empezar:

**Vale la pena** cuando el sitio es contenido publico que alguien tiene que encontrar o
citar: landing, sitio de producto, portafolio, blog, precios, documentacion. Ahi el premio
es real y medible — el texto viaja en el HTML.

**No vale la pena**, y hay que decirlo:

- **Todo detras de un login.** Si el visitante ve una pantalla de sesion hasta que se
  autentica, lo unico que se prerenderiza es esa pantalla. La ganancia de SEO/agentes es
  cercana a cero y el trabajo es el mismo.
- **Un dashboard o herramienta interna** cuyo contenido depende de datos por usuario. Mismo
  argumento: no hay nada publico que hornear.
- **La app depende de datos frescos en cada visita** para su primera pantalla. El prerender
  hornea el resultado del build; datos que cambian se consultan desde el cliente igual, asi
  que el HTML sale con el estado vacio.

Si el proyecto cae en alguno de esos casos, dilo con el motivo y ofrece la alternativa
(dejarlo como esta funciona perfecto; el carril viejo sigue publicando sin problema). No
migres "por si acaso".

**Tranquilidad para el usuario:** antes de empezar, propón guardar el estado actual (un
commit o una rama en git, con su sí). Si la migracion sale mal, se vuelve atras sin perder
nada; Claude Code ademas deshace los cambios de archivos con `/rewind`. Díselo: baja
mucho la ansiedad de aceptar un cambio grande.

---

## Fase 0 — Diagnostico (no escribas codigo todavia)

### 0.1 Confirmar que ES un proyecto viejo

```bash
grep -c '"@tanstack/react-start"' package.json   # 0 = proyecto viejo, 1+ = YA es Start
ls index.html src/main.tsx                        # los dos existen = SPA vieja
```

Si `@tanstack/react-start` ya esta en `package.json`, **el proyecto ya es del stack nuevo**.
Díselo al usuario ("este proyecto ya esta en TanStack Start, no hay nada que migrar") y
**no toques un solo archivo**. Una "migracion" sobre un proyecto ya migrado solo puede
romperlo.

### 0.2 ¿Hay router?

```bash
grep -rn "react-router" package.json src/
```

- **Sin resultados** (el caso mas comun en proyectos Believable): una sola pantalla. La
  Fase 2 es un archivo movido.
- **Con resultados**: hay varias paginas. La Fase 2 crece: un archivo de ruta por cada
  `<Route>`. Anota cuantas rutas son y sus paths, los vas a necesitar.

### 0.3 Inventario de SSR-safety (el paso que se saltea todo el mundo)

El prerender ejecuta tus componentes **en el servidor**, donde no existen `window`,
`document`, `localStorage` ni `matchMedia`. Tocarlos durante el render tumba el build
entero (`failOnError: true`, a proposito).

```bash
grep -rnE '\b(window|document|localStorage|sessionStorage|matchMedia|navigator)\b' src/
```

Para **cada** resultado, clasifícalo leyendo el archivo. No alcanza con contar:

| Donde aparece | ¿Corre en el servidor? | Accion |
|---|---|---|
| Dentro de `useEffect` / `useLayoutEffect` | No | **Nada.** Es seguro |
| Dentro de un handler (`onClick`, `onSubmit`…) | No | **Nada.** Es seguro |
| En el cuerpo del componente (durante el render) | **Si** | `<ClientOnly>` en Fase 3 |
| En el cuerpo del modulo (fuera de toda funcion) | **Si**, al importar | `<ClientOnly>` + mover la lectura adentro |
| `useState(() => localStorage.getItem(...))` (inicializador) | **Si** | `<ClientOnly>` |

Ojo tambien con lo que no matchea ese grep pero mide el DOM al render: `getBoundingClientRect`,
`IntersectionObserver` / `ResizeObserver` construidos fuera de un efecto, canvas/WebGL,
Three.js y React Three Fiber.

Anota la lista. **Esa lista es el trabajo real de la migracion**; el resto es mecanico.

### 0.4 Guardar el `<head>` viejo

Abre `index.html` y copia aparte: `<title>`, `description`, todos los `og:*` y `twitter:*`,
`<link rel="canonical">`, `<link rel="icon">`, las fuentes (`preconnect` + el `<link>` de
Google Fonts) y cualquier `<script type="application/ld+json">`. **Todo eso se muda al
`head()` de `__root.tsx` en la Fase 1.** Si lo pierdes, el sitio migrado sale sin titulo, sin
tipografia y sin datos estructurados, y nada falla: simplemente queda peor que antes.

Ve tambien a `src/index.css` (o como se llame la hoja) y anota si el proyecto la importa
desde algun lugar ademas de `main.tsx`.

### 0.5 Cuéntale el plan al usuario

Antes de escribir: un parrafo con qué vas a hacer, cuantas rutas van a salir, cuantos
componentes hay que envolver en `<ClientOnly>` (la lista del 0.3), y que el punto de
retorno lo cubre. Recien ahi arranca.

---

## Fase 1 — El esqueleto mecanico

### 1.1 Dependencias: pide la aprobacion UNA sola vez

Instalar un paquete dispara un pedido de permiso en el chat. Pedir tres veces seguidas es
una mala experiencia y ademas invita al usuario a rechazar. Hazlo en **un solo comando**,
con la lista completa:

```bash
npm install @tanstack/react-router @tanstack/react-start
```

Son las dos unicas dependencias nuevas. Todo lo demas que necesita el stack (`vite`,
`@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `typescript`, los `@types/*`)
**ya esta** en cualquier proyecto Believable viejo. Verifícalo antes de agregar nada:

```bash
grep -E '"(vite|@vitejs/plugin-react|@tailwindcss/vite|tailwindcss|typescript)"' package.json
```

Acláralo en el mismo mensaje: son dos paquetes, para que sea el framework, y
que despues no le vas a pedir nada mas.

### 1.2 `vite.config.ts` — reemplazo completo

El del proyecto viejo tiene `react()` y `tailwindcss()` y nada mas. Reemplázalo **entero**
por este. No es una version "adaptada": es el archivo del template actual, y el orden de
los plugins y el bloque de prerender son contrato, no preferencia.

```ts
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
```

### 1.3 `blv-loc-plugin.cjs` — hay que reemplazarlo (no es opcional)

El `blv-loc-plugin.cjs` del proyecto viejo es una version anterior y **rompe dos cosas bajo
Start**:

1. **Hydration mismatch en cada pagina.** Con Start el mismo archivo se compila dos veces
   (bundle de servidor y de cliente) con preambulos distintos: las lineas se corren y el
   atributo sale con valores diferentes en cada lado. El plugin nuevo acompana cada atributo
   con `suppressHydrationWarning`; el viejo no lo hace, y el usuario ve el warning de React
   en todas las paginas del preview.
2. **Fuga de la estructura de archivos en las vistas previas compartibles.** El
   `vite.config.ts` de arriba le pasa `{ mode: 'id' }` al plugin cuando Believable compila
   un link para el cliente. El plugin viejo ignora ese parametro y sigue inyectando
   `data-blv-loc="src/components/Hero.tsx:42:6"` en el HTML que se sube a R2 — o sea, la
   ruta real de cada archivo del proyecto, visible para cualquiera que abra el link.

Copia el archivo de este skill sobre el del proyecto. Esta en `plantillas/` de la
carpeta de este skill (Claude Code te la muestra al cargarlo, como "Base directory for this
skill"):

```bash
cp "<carpeta de este skill>/plantillas/blv-loc-plugin.cjs" ./blv-loc-plugin.cjs
```

(Si por lo que sea la plantilla no esta, avisale al usuario en vez de dejar el viejo: es un
problema silencioso, de los que no se ven hasta que ya se compartio el link.)

### 1.4 `package.json` — los scripts

```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "typecheck": "tsc --noEmit",
  "preview": "vite preview"
}
```

Dos cambios que importan: `dev` pasa de `vite` a **`vite dev`** (Start necesita el
subcomando), y `build` deja de ser `tsc -b && vite build` para ser **`vite build`** a secas
(el chequeo de tipos se corre aparte con `npm run typecheck`; mezclarlos hace que un error
de tipos parezca un error de build). Si quedo un `tsconfig.tsbuildinfo` del `tsc -b` viejo,
bórralo.

### 1.5 `tsconfig.json` — una linea

Agrega `"types": ["vite/client"]` en `compilerOptions`. Sin eso, TypeScript no conoce los
imports con sufijo (`?url`) y el `typecheck` falla en `__root.tsx`.

### 1.6 `.gitignore` — tres lineas

```
.tanstack
.nitro
.output
```

Son carpetas de trabajo del build de Start. Sin esto terminan versionadas.

### 1.7 La hoja de estilos: renombrar a `src/styles.css`

```bash
git mv src/index.css src/styles.css   # o mv, si el proyecto no esta en git
```

El contenido **no se toca**: los `@theme`, los tokens, todo queda igual. Es solo el nombre
que el stack nuevo espera (y del que hablan `CLAUDE.md` y el skill `tanstack-start`).

Despues del renombre, `grep -rn "index.css" src/` deberia devolver **un solo** resultado: el
`import './index.css'` de `src/main.tsx`, que se borra en el paso 1.11. Cualquier otro
resultado es una referencia que hay que actualizar a mano.

### 1.8 `src/site.ts`

```ts
// Identidad del sitio en UN solo lugar. `routes/__root.tsx` la usa para el <title> y los
// metadatos sociales; cualquier pantalla puede importarla para mostrar el nombre.
export const SITE_NAME = 'Nombre del sitio'

export const SITE_DESCRIPTION = 'La description que estaba en el index.html viejo.'
```

Los dos valores salen del `<title>` y del `<meta name="description">` que guardaste en 0.4.

### 1.9 `src/routes/__root.tsx` — aca se muda el `<head>` viejo

Este archivo reemplaza al `index.html`. **El documento entero lo renderiza React**,
`<html>` y `<body>` incluidos.

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

// El CSS entra como URL y se declara en `links`. Es el patron correcto en Start: un
// `import '../styles.css'` a secas anda en dev y deja la pagina SIN estilos en el HTML
// del prerender.
import appCss from '../styles.css?url'
import { SITE_DESCRIPTION, SITE_NAME } from '../site'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_NAME },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:title', content: SITE_NAME },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' }
      // …el resto de los og:* / twitter:* que tenia el index.html viejo
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // El favicon, el canonical y las fuentes del index.html viejo van ACA:
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=…&display=swap' }
    ],
    // El <script type="application/ld+json"> del index.html viejo se muda asi:
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization' })
      }
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
```

Detalles que se pasan por alto y cuestan una vuelta:

- El `lang` del `<html>` sale del `index.html` viejo, no lo inventes.
- En JSX los atributos van en camelCase: `crossorigin` → **`crossOrigin`**,
  `charset` → **`charSet`**.
- El JSON-LD va en `scripts`, con el objeto en `children` como string. No es un `meta` ni un
  `link`.
- Los archivos de `public/` (favicon, imagenes, `llms.txt`) **no se tocan**: se siguen
  sirviendo desde la raiz igual que antes.

### 1.10 `src/router.tsx`

```tsx
import { Link, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

// 404 por defecto de todo el sitio. Sin esto, cualquier ruta inexistente deja la vista
// vacia con solo un warning en consola.
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
```

Ajusta el texto y las clases del `NotFound` al tono y a la paleta del proyecto — es una
pagina del sitio, no un componente de sistema. Lo que **no** se saca es
`defaultNotFoundComponent`.

`src/routeTree.gen.ts` no existe todavia y **no lo escribas a mano**: lo genera el plugin en
el primer `vite build` o `vite dev`. Hasta ese momento el `typecheck` va a fallar con
"cannot find module './routeTree.gen'". Es esperado — por eso el orden de la Fase 4 es
build primero, typecheck despues.

### 1.11 Borrar los dos archivos del stack viejo

```bash
rm index.html src/main.tsx
```

Solo despues de haber mudado el `<head>`. `index.html` ya no existe en este stack y crear
uno nuevo no hace nada (el documento lo arma `__root.tsx`).

---

## Fase 2 — El contenido

### 2.1 Sin router (una sola pantalla)

`src/App.tsx` se convierte en `src/routes/index.tsx`. El componente no cambia: cambia el
envoltorio.

```tsx
import { createFileRoute } from '@tanstack/react-router'

// …los mismos imports de secciones que tenia App.tsx

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Titulo de esta pagina' }] }),
  component: Inicio
})

function Inicio() {
  // el cuerpo exacto que devolvia App()
}
```

Cambios concretos: `export default function App()` pasa a ser una funcion normal referenciada
en `component`, y se agrega el `export const Route`. Todo lo de adentro queda igual. Despues,
`rm src/App.tsx`.

El alias `@` sigue funcionando (esta en el `vite.config.ts` nuevo y en el `tsconfig.json`),
asi que los `import { Hero } from '@/components/Hero'` no se tocan.

### 2.2 Con react-router (varias paginas)

Una ruta por archivo. El nombre del archivo **es** la URL:

| Antes | Ahora |
|---|---|
| `<Route path="/" element={<Home/>}/>` | `src/routes/index.tsx` → `createFileRoute('/')` |
| `<Route path="/precios" element={<Precios/>}/>` | `src/routes/precios.tsx` → `createFileRoute('/precios')` |
| `<Route path="/blog/:slug" .../>` | `src/routes/blog/$slug.tsx` → `createFileRoute('/blog/$slug')` |
| `<Route path="*" element={<NotFound/>}/>` | `defaultNotFoundComponent` en `router.tsx` |

Lo que estaba en el layout (`<BrowserRouter>`, el header/footer que envolvia a todas las
paginas) se muda al `RootDocument` de `__root.tsx`, alrededor del `<Outlet />`.

Y en cada pagina, cambia el import de los links:

```diff
- import { Link, useNavigate } from 'react-router-dom'
+ import { Link, useNavigate } from '@tanstack/react-router'

- <Link to="/precios">Precios</Link>   ← la sintaxis es la misma
```

`useParams` y `useSearch` cambian de forma; para eso esta
`oficial/migrate-from-react-router.md` en el skill `tanstack-start`. Léelo antes de
improvisar.

Cuando no quede ni un import de `react-router`, quítalo de las dependencias:

```bash
grep -rn "react-router" src/          # tiene que devolver vacio
npm uninstall react-router-dom react-router
```

### 2.2b Con router casero (`window.location` + history API)

El tercer caso, y el mas comun en proyectos Believable viejos que crecieron: no usan
`react-router` pero tienen su PROPIO router hecho a mano (un `useRoute.ts` que lee
`window.location.pathname`, un `route-context.tsx` con `{ path, navigate }`, y un `Link.tsx`
propio con prop `href`). **El `grep` del paso 0.2 da vacio y engana**: no es "sin router",
es "router invisible al grep". Detectalo buscando `window.location.pathname`,
`history.pushState` o un `Link.tsx` en `src/components/`.

La migracion NO es reescribir los ~15 componentes que consumen ese router. El movimiento
quirurgico es convertir **los dos archivos del router casero en adaptadores delgados** sobre
el router de TanStack, conservando su API vieja. Asi Nav, Footer, secciones y paginas no se
tocan:

```tsx
// route-context.tsx — mismo `{ path, navigate }`, ahora leido de TanStack
import { useCallback } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

export function useRouteContext() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const nav = useNavigate()
  // `as never`: unico punto sin type-check del `to` (las rutas dinamicas se arman de datos)
  const navigate = useCallback((to: string) => { void nav({ to: to as never }) }, [nav])
  return { path, navigate }
}
```

```tsx
// Link.tsx — conserva el prop `href`; externos/anclas a <a>, internos a <Link to>
import { type AnchorHTMLAttributes } from 'react'
import { Link as RouterLink } from '@tanstack/react-router'

export function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const isInternal = href.startsWith('/') && !href.startsWith('//')
  if (!isInternal) return <a href={href} {...props} />
  const [path, hash] = href.split('#')          // `/#precios` no pierde el scroll a la seccion
  return <RouterLink to={(path || '/') as never} hash={hash || undefined} {...props} />
}
```

El `App.tsx` de estos proyectos suele traer un shell condicional (overlay leido de la URL,
modos de vista, header/footer que envuelven segun el path). Eso va a `__root.tsx` alrededor
del `<Outlet />`; lo que lee `window.location.search` se mueve a un `useEffect` (si queda en
el render, corre en el servidor y tumba el build). Los distintos "chrome" por grupo de rutas
(unas con Nav/Footer, otras standalone) se modelan con un **layout pathless**
(`src/routes/_shell.tsx` + `_shell.<pagina>.tsx`), que ademas mantiene Nav/Footer montados
entre navegaciones igual que hacia el router casero.

Confirmado en `web-believable` (router casero, ~25 rutas, 2 grupos dinamicos): 24 paginas
horneadas con contenido real, sin tocar un solo componente de seccion.

### 2.3 La regla que decide si el prerender encuentra tus paginas

**Toda navegacion interna va con `<Link to="…">` de `@tanstack/react-router`, nunca con
`<a href="/precios">`.** El prerender descubre que paginas generar siguiendo los `<Link>`
(`crawlLinks: true`). Una pagina a la que solo se llega por `<a href>` puede quedar sin
generar, y nadie se entera hasta que alguien abre esa URL.

```bash
grep -rnE '<a [^>]*href="/' src/     # cada resultado es un <Link> que falta
```

Los `<a href>` a sitios externos (`https://…`), a anclas de la misma pagina (`#precios`) y
los `mailto:` se quedan como estan.

---

## Fase 3 — SSR-safety

Aca se paga la lista del paso 0.3. Para cada componente que toca `window`/`document`
**durante el render** o en el cuerpo del modulo:

```tsx
import { ClientOnly } from '@tanstack/react-router'

<ClientOnly fallback={<div className="h-64" />}>
  <MapaConWebGL />
</ClientOnly>
```

- El `fallback` **tiene que ocupar el mismo espacio** que el contenido real (misma altura,
  mismo ancho). Un `fallback={null}` hace que la pagina salte al hidratar, y eso el usuario
  lo ve.
- Se envuelve en el **punto de uso** (donde el padre lo renderiza), no adentro del propio
  componente.
- Lo que esta dentro de `useEffect` o de un handler **no se envuelve**. Envolver de mas
  tiene costo real: ese contenido desaparece del HTML prerenderizado, que es justamente lo
  que fuimos a buscar.

Cuando la lista este vacia:

```bash
npm run build
```

E itera. `failOnError: true` frena el build ante la primera ruta que revienta, y el error
dice el archivo. Cada vuelta arregla uno. Errores tipicos y su traduccion:

| Error del build | Que pasa realmente |
|---|---|
| `window is not defined` / `document is not defined` | Un componente lee el DOM al render. Falto un `<ClientOnly>` |
| `Cannot find module './routeTree.gen'` | Todavia no corrio el generador. Corre `vite build` una vez mas |
| `matchMedia is not a function` | Idem `window`: `<ClientOnly>` o mover la lectura a un `useEffect` |
| El build pasa pero la pagina sale sin estilos | El CSS se importo sin `?url`. Revisa `__root.tsx` |

---

## Fase 4 — Verificacion honesta

No declares la migracion terminada porque el build salio verde. Verde solo dice que
compilo.

### 4.0 El cambio de stack exige reiniciar el dev server

Cuando reescribes `vite.config.ts` para meter `tanstackStart()`, el proyecto pasa de
**SPA a SSR**. El restart in-place de Vite no re-inicializa su middleware al cambiar el
*tipo* de servidor: el proceso queda **vivo pero sirviendo 0 bytes** (pagina en blanco),
aunque el build y el typecheck pasen. El codigo esta bien; es el **proceso** el que quedo
colgado.

Si hay un `npm run dev` corriendo (tuyo o de la persona), **detenlo y vuelve a lanzarlo**
despues de guardar el `vite.config.ts` nuevo. Si lo lanzo la persona en su terminal,
pídeselo en una linea: no mates un proceso que no arrancaste tú.

Para confirmar que el sitio migrado renderiza, no te fies de una pestaña que ya estaba
abierta:

- `curl -s http://127.0.0.1:<puerto>/ | grep -a "<frase del hero>"`, o
- el navegador que tenga esta sesion (un MCP de navegador, como Chrome DevTools o
  Playwright): abre `http://127.0.0.1:<puerto>` y saca una captura.

### 4.1 El build y los tipos

```bash
npm run build && npm run typecheck
```

En ese orden: el build genera `routeTree.gen.ts`, que el typecheck necesita.

### 4.2 El contenido esta REALMENTE en el HTML

Esta es la unica prueba de que la migracion sirvio para algo:

```bash
ls dist/client/                                        # index.html + una carpeta por ruta
grep -ac "" dist/client/index.html                     # que exista
grep -a "una frase del hero" dist/client/index.html    # el texto real, con -a
```

**El `-a` no es opcional.** El HTML del prerender contiene bytes NUL dentro del payload de
hidratacion; `grep` sin `-a` los detecta y cae a modo binario. Medido sobre una pagina
migrada real: `grep -c "Directorio" index.html` **no imprime nada y sale con codigo 1** —
exactamente igual que si el texto no estuviera. Con `-a`, el mismo comando imprime `1`. Un
`grep` que "no encuentra nada" sin `-a` no prueba absolutamente nada.

Repítelo por cada ruta secundaria (`dist/client/precios/index.html`, etc.). Que exista la
carpeta ya dice que `crawlLinks` la encontro; que el texto este adentro dice que se
renderizo.

Detalle util para no perder tiempo: React separa nodos de texto adyacentes con `<!-- -->`,
asi que `Elegir Plan` puede aparecer como `Elegir <!-- -->Plan`. El contenido esta; busca
frases de una sola palabra o pedazos cortos.

### 4.3 Paridad visual

Con el dev server reiniciado (4.0), abre la pagina en el navegador de la sesion, saca
una captura y compárala contra como se veia antes. Si la sesion no tiene navegador, pídele
a la persona que la abra y dilo en el informe: esa parte no la verificaste tú. Lo que hay que mirar puntualmente:

- **Tipografia**: si las fuentes de Google no se mudaron bien, la pagina cae a la fuente del
  sistema. Es el sintoma mas comun y el mas facil de no ver si no lo buscas.
- **Favicon y `<title>`** en la pestana.
- Que no aparezca un warning de hidratacion en la consola.

### 4.4 Navegacion

Si hay mas de una pagina, entra a cada una **por su URL directa** y ademas **navegando con
los links**. Los dos caminos, siempre: una server function olvidada, o un loader que
depende de algo del cliente, se ve perfecto en la carga directa y revienta al navegar.

### 4.5 Recien ahi, ofrecer republicar

Cuando las cuatro cosas de arriba estan, cuéntale al usuario qué cambio (ahora cada pagina
viaja como HTML escrito) y ofrece publicar de nuevo para que la version nueva quede en
linea. No republiques por tu cuenta.

---

## Fase 5 — SEO por ruta (el premio de verdad)

El prerender ya hornea el contenido; falta que cada pagina tenga SU `<head>` propio en el
HTML, no el global del sitio. Sin esto todas las paginas salen con el mismo titulo,
description y og del root, y comparten un `canonical` — el peor caso: le dice a Google que
todas son la home. Los proyectos viejos ponian el titulo por pagina **client-side** (un
`useDocumentMeta` que toca `document.title` en un efecto); eso NO viaja en el HTML del
prerender, el agente/buscador ve el titulo generico. La migracion completa lo mueve al
`head()` de cada ruta.

### 5.1 Un helper para no repetir og/twitter/canonical en cada ruta

```ts
// src/lib/head.ts
export const SITE_URL = 'https://tu-dominio.com'

export function pageHead({ title, description, canonicalPath }: {
  title: string; description: string; canonicalPath: string
}) {
  const url = `${SITE_URL}${canonicalPath}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description }
    ],
    links: [{ rel: 'canonical', href: url }]
  }
}
```

Cada ruta: `head: () => pageHead({ title, description, canonicalPath: '/precios' })`. Las
dinamicas leen el dato en `head`, que recibe `{ params }`:

```tsx
head: ({ params }) => {
  const p = PRODUCTS[params.id]
  return pageHead({ title: p.name, description: p.tagline, canonicalPath: `/p/${params.id}` })
}
```

### 5.2 El `canonical` va SIEMPRE por pagina, nunca en el root

TanStack dedupe los `meta` por `name`/`property` (la hoja pisa al root), asi que og:title y
description por ruta funcionan aunque el root tenga los suyos. Pero **no confies en el dedupe
para el `<link rel="canonical">`**: quitalo del `head()` del root y ponlo SOLO por pagina con
`pageHead`. Dejarlo en los dos arriesga dos `<link rel=canonical>` en la misma pagina.
Verifica: `grep -aoc '<link rel="canonical"' dist/client/<ruta>/index.html` tiene que dar `1`.

El `canonicalPath` es la palanca para **consolidar alias**: dos rutas que sirven el mismo
contenido (un `/crea` que es la home, un `/negocio` que es `/lanzalo`) apuntan su canonica a
la ruta principal, para no competir como duplicados en SEO.

### 5.3 Borra el `useDocumentMeta` viejo

Con `head()` cubriendo prerender Y navegacion client-side (TanStack actualiza el `<title>` al
navegar), el `useDocumentMeta` de las paginas queda como segunda fuente de verdad. Quitalo de
cada pagina (y borra el util si nadie mas lo usa): una sola fuente, y evita el parpadeo del
`<title>` al navegar. `grep -rn "useDocumentMeta" src/` tiene que quedar vacio.

---

## Trampas conocidas (medidas, no supuestas)

| Trampa | Que pasa |
|---|---|
| **`createServerFn`** para traer datos | **Prohibido en este stack.** No hay servidor en runtime: el build hornea el resultado, la primera carga se ve bien y la navegacion de cliente pega contra `/_serverFn/…`, recibe 404 y cae en el error boundary. Sin error en consola, sin aviso en el build. Todo lo server-side va a Edge Functions |
| `grep` sin `-a` contra `dist/client/*.html` | Falsos negativos silenciosos (bytes NUL). Verificar asi es peor que no verificar |
| `<a href="/ruta">` interno | El prerender no descubre esa pagina. Siempre `<Link to>` |
| `react()` antes de `tanstackStart()` | Rompe la transformacion de rutas. El orden es MUST |
| `import '../styles.css'` sin `?url` | Anda en dev, deja el HTML del prerender **sin estilos**. Se descubre despues de publicar |
| Dejar el `blv-loc-plugin.cjs` viejo | Hydration mismatch en cada pagina + la ruta real de cada archivo del proyecto visible en las vistas previas compartibles |
| Olvidar `<Scripts />` en `__root.tsx` | La pagina se ve perfecta y no responde a nada: nunca hidrata |
| Crear un `index.html` nuevo | En este stack no existe. Lo que pongas ahi no llega a ninguna parte |
| Crear `src/client.tsx` / `src/ssr.tsx` | No existen en la version actual de Start. Archivos muertos |
| `app.config.ts` | Es la API vieja del propio Start (Vinxi). No la lee nadie: build muerto |
| Buscar la salida en `dist/index.html` | Es `dist/client/index.html`. `dist/server/` nunca se publica |
| Router casero invisible al `grep` de `react-router` (paso 0.2) | El grep da vacio pero hay un router propio (`window.location.pathname`). No es "sin router": es el caso 2.2b |
| Matar un dev server que no arrancaste tú | Si la persona lo lanzo en su terminal, matarlo le corta su sesion sin aviso. Pídele que lo reinicie (4.0), o arranca uno propio en otro puerto y apágalo al terminar |
| `<link rel="canonical">` en el `head()` del root | Fuerza la misma canonica (la home) a TODAS las paginas horneadas: soft-404 masivo, Google las dedupe a la home. La canonica va por pagina, nunca global (Fase 5.2) |
| El preview queda en blanco tras reescribir `vite.config.ts` (SPA -> SSR) | El restart in-place de Vite no re-inicializa el middleware SSR: el proceso queda vivo sirviendo 0 bytes. Hay que detener el `npm run dev` y lanzarlo de nuevo. Ver 4.0 |
| `npm`/`node` no estan en el PATH del Bash | En este Mac node vive keg-only en Homebrew. Ubicarlo (`find /opt/homebrew/Cellar/node* -name node -type f`) y anteponerlo: `export PATH="/opt/homebrew/Cellar/node@22/<ver>/bin:$PATH"` antes de cada `npm`/`node` |
| Instalar el framework con `npm` cuando el scaffold trae `pnpm-lock.yaml` | Queda un lockfile pnpm desactualizado (sin `@tanstack/*`) que puede romper el **publish**. Alinear el `pnpm-lock.yaml` (o confirmar que el deploy usa `npm`) ANTES de publicar. Ver `deploy-believable` |
