# Instrucciones para el agente

Este proyecto fue creado con **Believable**. Estas instrucciones gobiernan todo el trabajo dentro de esta carpeta.

## Stack

- **TanStack Start** (Vite 7 + React 19) + **TypeScript** + **Tailwind CSS v4**.
- **No es una SPA.** El build **prerenderiza**: cada ruta se convierte en un HTML con el contenido ya escrito. Un buscador o un agente de IA lee la página completa sin ejecutar una línea de JavaScript. Ese HTML es el producto.
- Rutas **file-based** en `src/routes/`. Un archivo = una ruta.
- Tailwind v4 es **CSS-first**: NO existe `tailwind.config.*` y no debes crearlo. Los tokens de diseño viven en `src/styles.css` dentro del bloque `@theme`.
- Alias `@` → `src/` (ej. `import { cn } from '@/lib/utils'`).

**Ante cualquier duda de routing, `<head>`, carga de datos o build: usa el skill `tanstack-start`.** Está bundleado en este proyecto e incluye los skills oficiales de TanStack. Tu memoria de este framework está desactualizada; el skill no.

## Estructura

```
src/
├── routes/
│   ├── __root.tsx        el documento completo (<html>, <head>, <body>) + metadatos base
│   └── index.tsx         la ruta "/"
├── router.tsx            getRouter() — el nombre es contrato con el plugin
├── site.ts               nombre y descripción del sitio, en un solo lugar
├── styles.css            Tailwind v4 + tokens de diseño en @theme
├── components/ui/        primitivas estilo shadcn
└── lib/utils.ts          cn()
```

- Una ruta nueva es un archivo nuevo en `src/routes/`: `precios.tsx` → `/precios`, `blog/$slug.tsx` → `/blog/:slug`. `src/routeTree.gen.ts` lo genera el plugin solo — **no lo edites a mano**.
- Componentes reutilizables en `src/components/`.
- Primitivas de UI estilo shadcn en `src/components/ui/`. Sigue el patrón de `button.tsx` existente: **sin cva**, mapas de clases por variante y tamaño combinados con `cn()` de `@/lib/utils`, `forwardRef`, props tipadas con `ComponentPropsWithoutRef`.
- Navegación interna **siempre** con `<Link to="/precios">` de `@tanstack/react-router`, nunca con `<a href>`: el prerender sigue los `<Link>` para descubrir qué páginas generar. Una página a la que solo se llega por `<a href>` puede quedar sin generar.

## Reglas duras

- **NO tocar** `vite.config.ts`, `tsconfig.json` ni los scripts de `package.json`. Son el contrato que garantiza el preview y la publicación.
- **NO correr el dev server ni hacer `git commit`** — Believable maneja ambos: el preview se recarga solo con cada edición y cada turno genera un checkpoint automático.
- **Dependencias nuevas requieren aprobación del usuario**: instalar un paquete dispara un pedido de permiso en el chat. Agrega dependencias solo cuando aporten valor real; prefiere resolver con React, Tailwind y las primitivas existentes.

### `createServerFn` está PROHIBIDO en este proyecto

Este proyecto se publica **estático**: no hay servidor en runtime. Una server function que alimente un loader parece funcionar (el build la ejecuta y hornea el resultado en el HTML) y después **se rompe cuando el visitante navega**: el loader corre en el navegador, pega contra `/_serverFn/…`, recibe 404 y la ruta cae en el error boundary con `Something went wrong!`. Sin error en consola, sin aviso en el build. Está medido, no es una precaución teórica.

Lo mismo aplica a `createMiddleware`, server routes y cualquier API de `@tanstack/react-start` que necesite un proceso vivo del lado servidor.

**Todo lo server-side va a Edge Functions** (ver la sección de abajo). Es donde ya viven los secretos, el service role y el aislamiento por tenant.

### Componentes que tocan `window` o `document`: `<ClientOnly>`

El prerender ejecuta tus componentes **en el servidor**, donde no existen `window`, `document`, `localStorage` ni `matchMedia`. Tocarlos durante el render tumba el build entero.

La convención de este proyecto es el mecanismo idiomático de Start:

```tsx
import { ClientOnly } from '@tanstack/react-router'

<ClientOnly fallback={<div className="h-64" />}>
  <MapaConWebGL />
</ClientOnly>
```

- Leer `window` dentro de un `useEffect` o de un handler de evento **es seguro**: no corre en el servidor, no necesita `<ClientOnly>`.
- Leerlo **durante el render** (o en el cuerpo del módulo) sí lo necesita.
- El `fallback` debe ocupar el mismo espacio que el contenido real, o la página salta al hidratar.
- Todo lo que sea canvas/WebGL/3D (Three.js, React Three Fiber), lectores de tamaño de ventana o de `localStorage` al render, va envuelto en `<ClientOnly>`.

### Dónde va cada cosa del `<head>`

- Metadatos de todo el sitio (charset, viewport, Open Graph base): en el `head()` de `src/routes/__root.tsx`.
- `<title>` y `description` **por página**: en el `head()` de esa ruta.
- El componente que imprime todo eso es **`<HeadContent />`**, no `<Meta />`.
- `public/favicon.svg` y `public/og.png` (1200×630) son neutros de relleno: reemplázalos por los de la marca con el mismo nombre. El `sitemap.xml` lo genera el build con todas las rutas prerenderizadas.
- **No existe `index.html`** y no debes crear uno: el documento lo arma React en `__root.tsx`.

### El CSS entra con `?url`

`src/routes/__root.tsx` ya trae el patrón correcto:

```tsx
import appCss from '../styles.css?url'
// …
links: [{ rel: 'stylesheet', href: appCss }]
```

Un `import '../styles.css'` a secas funciona en dev y deja la página **sin estilos en el HTML del prerender**. No lo cambies.

## Cómo se compila y qué se publica

`npm run build` deja el sitio en **`dist/client/`** — esa carpeta, no `dist`, es la raíz de
lo que se publica:

```
dist/
├── client/     ← EL SITIO. Es lo único que se publica.
│   ├── index.html            (la ruta /)
│   ├── precios/index.html    (un index.html por ruta, en su carpeta)
│   └── assets/…
└── server/     ← bundle de servidor. NUNCA se publica.
```

Si necesitas revisar el HTML de salida, **no uses `grep` a secas**: el HTML del prerender contiene bytes NUL dentro del payload de hidratación, `grep` cae a modo binario y devuelve falsos negativos en silencio. Usa `grep -a` o lee el archivo desde código.

Si tu app declara `frame-ancestors` en `public/_headers.json`, la lista debe incluir `https://vibe.maasy.ai` (además de `'self'`): sin ese origen la vista previa del Canvas de Maasy sale en blanco.

`npm run typecheck` corre TypeScript aparte del build. Úsalo antes de dar algo por terminado.

## Diseño

- UI moderna y pulida: jerarquía tipográfica clara, espaciado generoso, estados `hover`/`focus` en todo lo interactivo, responsive por defecto.
- Define y evoluciona la **paleta del proyecto en el `@theme` de `src/styles.css`** en lugar de hardcodear los mismos colores repetidos en clases. Los tokens son la fuente de verdad visual.
- `design.md` es el lock de marca de este proyecto: leelo ANTES de construir cualquier UI y respetalo en toda pantalla. Si está vacío o incompleto, entrevista breve al usuario y llenalo primero — nunca arranques a construir con la paleta/tipografía por defecto sin haberlo llenado.

### Reglas duras anti-"se nota que lo hizo una IA"

Rompé cualquiera de estas y la pantalla se va a ver genérica, aunque el código esté prolijo:

- **Nunca el azul índigo/violeta por defecto** (`#4F46E5`, `#5E6AD2` y parecidos) ni ningún color sin elegir a propósito — el acento sale de `design.md`, siempre. Coherente-pero-genérico también es una falla.
- **Un solo foco por pantalla.** Una grilla pareja de cards del mismo peso, centradas y repartidas iguales, es la marca #1 de "esto lo compuso una máquina". Algo tiene que dominar visualmente.
- **Sin emoji como ícono de UI** (🚗🧺⭐) — un solo set de íconos de línea en `currentColor`. El emoji mete colores random que ni controlás y se ve distinto en cada sistema operativo.
- **Sin el combo "ícono dentro de un chip" arriba de cada card de feature** — es el cliché #1 de "gen-1 AI", decoración que finge ser información.
- **Color = significado, no decoración.** Un estado normal/neutral va en gris, no coloreado; el color se reserva para lo que necesita atención. Mismo valor, mismo color siempre — nada de "lista arcoíris".
- **Tokens semánticos, nunca hex hardcodeado** en componentes — todo pasa por el `@theme` de `src/styles.css`.
- **Tamaños de fuente de una sola escala fija**, no adivinados al tuntún — el drift de tamaños es la razón #1 por la que una pantalla "se ve rara" sin poder explicar por qué.
- **Elevación en un solo lenguaje**: sombras suaves apiladas (≤8% opacidad) en modo claro, o superficies con rampa tonal + borde hairline en modo oscuro — nunca mezclados, nunca negro puro (`#000`).
- **Toda superficie con datos necesita estado vacío, cargando y de error** — no solo el estado feliz. Un mockup estático sin datos reales queda exento.

Antes de dar por terminada cualquier pantalla nueva o con cambios grandes de UI, auto-revisate contra esta lista y contra `design.md`, arreglá lo que falle, y recién ahí mostrale el resultado al usuario.

## Animación: `motion` vs GSAP

Este proyecto tiene disponibles **dos** librerías de animación. Cada una tiene su terreno — **nunca las mezcles en el mismo componente**, es la forma más rápida de terminar con dos motores de animación peleando por el mismo elemento.

- **`motion`** — estado de UI y micro-interacciones: hover de un botón, fade/slide de entrada de un elemento, transición entre estados (abierto/cerrado, activo/inactivo), un modal o dropdown que aparece. Si la animación describe un cambio de estado de un componente, es `motion`.
- **GSAP** — scroll y timelines complejos: pin de una sección mientras se anima su contenido, parallax, cualquier animación atada al progreso del scroll, secuencias encadenadas con varios elementos y tiempos relativos entre sí. Si la animación depende del scroll o coordina varios elementos en una secuencia, es GSAP.

Ejemplos concretos:
- Un botón que crece al hover → `motion`.
- Una card que aparece con fade al entrar en el viewport (una sola vez, sin scrub) → `motion` (`whileInView`).
- Un hero cuyo texto y fondo se mueven a distinta velocidad mientras el usuario scrollea (parallax) → GSAP + ScrollTrigger.
- Una sección que se queda fija (pin) mientras dentro se reproduce una secuencia de pasos → GSAP + ScrollTrigger.
- Un menú que se abre y cierra → `motion`.
- Una landing con 5 elementos que entran en cascada coordinada, con timing relativo entre ellos → GSAP timeline.

Si la app no toca scroll ni secuencias encadenadas, es muy probable que nunca necesites instalar GSAP — `motion` sola cubre casi toda la UI. Antes de escribir algo con GSAP, consulta el skill correspondiente (`/gsap-core`, `/gsap-scrolltrigger`, `/gsap-timeline`, `/gsap-plugins`, `/gsap-react`, `/gsap-performance`, `/gsap-utils`, `/gsap-frameworks`) en vez de improvisar la API de memoria.

**Ojo con el prerender:** GSAP con ScrollTrigger y cualquier animación que mida el DOM se inicializan en `useEffect`, nunca durante el render. Si un componente de animación necesita `window` al render, va dentro de `<ClientOnly>`.

## Backend: base de datos, auth y storage (Supabase)

El backend es **Supabase self-hosted** de Believe. Believable lo aprovisiona al
deployar como full-stack: crea el tenant, mina la anon key e inyecta
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_SCHEMA`.

- **Cliente:** copia `_backend/supabase.ts` a `src/lib/supabase.ts` y usa `supabase`
  desde tus componentes. La anon key ya viene **scopeada a tu tenant**, así que todo
  queda aislado del resto de las apps automáticamente.
- **Tablas:** las creas con SQL (schema de tu tenant). El servidor activa RLS por
  tenant en toda tabla nueva sola. Para el día a día, `supabase.from('tabla').select()`
  / `.insert()` etc.
- **Datos sin login:** funcionan directo con la anon key del tenant. Ideal para apps
  simples (formularios, listas, contenido).
- **Login de usuarios (opcional):** usa `signUp` / `signIn` de `_backend/supabase.ts`.
  El backend estampa el tenant del usuario server-side. Adapta la UI del login a la
  marca del proyecto (no dejes el estilo neutral).
- **NUNCA** pongas la service role key en el cliente. Solo la anon key (que es pública
  por diseño).
- **Datos en el prerender:** una consulta a Supabase dentro de un `loader` corre en el
  build y hornea el resultado en el HTML — sirve para contenido que cambia poco
  (catálogo, artículos). Para datos que tienen que estar frescos en cada visita,
  consulta desde el cliente (`useEffect` o al interactuar), no desde el loader.

## Lógica server-side propia (Edge Functions)

Cuando necesites código en el servidor (firmar un request, hablar con un webhook como
n8n, procesar datos, cualquier cosa con un secreto que NO puede ir al cliente):

- Escríbelo como una **Supabase Edge Function (Deno)** en `supabase/functions/<nombre>/index.ts`.
  Believable la **despliega sola** al publicar full-stack (una por carpeta).
- La function corre en el box de Believe con `Deno.env` inyectado: `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (para escribir en tu tenant saltando RLS).
- **Llámala desde el cliente** con el prefijo namespaceado por tenant:
  ```ts
  const FN = (name: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${import.meta.env.VITE_SUPABASE_FN_PREFIX}${name}`
  await fetch(FN('submit-lead'), { method: 'POST', body: JSON.stringify(data) })
  ```
  Believable namespacea la función en el box (`<slug>_<nombre>`) para que no choque con otras
  apps; el prefijo lo hace transparente. Usa SIEMPRE el prefijo, nunca el nombre pelado.
- Secretos (URL de webhook, signing key): NO los hornees en el código. El usuario los guarda en
  **Cloud → Secrets** y tu function los lee con `await getBelieveSecret('CLAVE')` (helper ya
  inyectado en cada function; lee la tabla `_app_secrets` con service_role, nunca llega al cliente).
  Si un secreto hace falta, díselo al usuario para que lo agregue en Cloud → Secrets.
- Notificaciones a los usuarios de la app (correo + campanita in-app): crea el workflow con la
  herramienta `notificaciones_workflow` y dispáralo desde una Edge Function con
  `await novuTrigger('<workflowId>', { subscriberId, email }, payload)` (helper ya inyectado, igual
  que `novuSubscriberHash`). La campanita: `_backend/novu.ts` (Inbox headless con `@novu/js`, el
  hash siempre desde una Edge Function). Nunca llames a Novu directo ni pidas sus llaves.
- Alternativa sin función: para captura simple de leads, el form puede escribir directo a una
  tabla (`supabase.from('leads').insert(...)`, RLS por tenant) y que n8n lea de Supabase.

## Integraciones (Composio)

Si el usuario pide un **servicio externo conectado por CADA usuario** (su Gmail, Stripe, etc.):

- **Usa Composio** vía los helpers de `_integrations/` (ver INTEGRATIONS.md); no cablees la API a mano.
- Corre server-side en la Edge Function proxy que Believable despliega. **Nunca** la Composio key en el cliente.
- Requiere **deployType full-stack**.

## Idioma

- El contenido de la app va en el idioma que pida el usuario. Identificadores de código en inglés.
