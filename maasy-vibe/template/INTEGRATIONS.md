# Integraciones (Composio)

Conecta tu app con servicios externos (voces, pagos, email, etc.) sin cablear cada API a
mano. **Believable despliega el proxy server-side por ti** — tú solo lo invocas desde el
front.

## Cómo funciona

Cuando publicas un proyecto **full-stack** con integraciones declaradas, Believable crea
automáticamente una **Edge Function** (Deno) en el box de Supabase, llamada `app-<slug>`,
que:

- Tiene la `COMPOSIO_API_KEY` **server-side** (horneada en la function, nunca en el cliente
  ni en el bundle).
- Recibe `{ toolSlug, arguments, userId? }`, ejecuta el tool de Composio y devuelve el
  resultado. También resuelve el flujo de conexión per-usuario y la asignación de tenant.

El front nunca ve la key: solo invoca la function en `{VITE_SUPABASE_URL}/functions/v1/{VITE_SUPABASE_FN}`.
Composio ya trae los 1000+ conectores (ElevenLabs, Stripe, Resend, Slack…), así que no
escribes un cliente por servicio.

## Activarla (2 pasos)

1. En **Believable** → config del proyecto → **Integraciones**: declara el toolkit
   (ej. `elevenlabs`). Publica como **full-stack**.
2. En **Composio** (una vez por toolkit): conecta la cuenta del servicio (la API key de
   ElevenLabs o el OAuth) para que el tool tenga una conexión.

Listo. Believable despliega la function con la key al publicar.

## Llamarla desde el front

Copia **`_integrations/composio-connect.ts`** a `src/lib/` y usa sus helpers (ya resuelven
la URL de la function y el token del usuario logueado):

```ts
import { executeComposioTool } from '@/lib/composio-connect'

const result = await executeComposioTool('ELEVENLABS_TEXT_TO_SPEECH', { text, voice_id })
```

El `toolSlug` y la forma de `arguments` dependen del toolkit — búscalos con
`composio search "text to speech"` o en el dashboard de Composio.

## Conexión per-usuario (cada usuario final conecta SU cuenta)

Por defecto la conexión del toolkit la hace **el builder una vez** (en Believable →
Integraciones → Conectar), y todos los usuarios de la app comparten esa cuenta. Para apps
donde **cada usuario final conecta lo suyo** (ej. su propio Gmail o Stripe), marca la
integración como **"Cada usuario"** en Believable. Requiere que la app tenga **login**
(Supabase, ver `AUTH.md`): la conexión se ata al id del usuario logueado.

La function ya soporta este flujo con dos acciones (las envuelve `composio-connect.ts`):

- `composioStatus(['gmail'])` → `{ gmail: true }`
- `composioConnectUrl('gmail')` → URL del OAuth para abrir

Monta el componente de referencia **`_integrations/ComposioConnect.tsx`**:

```tsx
import { ComposioConnect } from '@/components/ComposioConnect'

// En la pantalla de ajustes del usuario:
<ComposioConnect toolkit="gmail" label="Gmail" />
```

El botón muestra "Conectar", abre el OAuth de Composio para ESE usuario, y al volver refleja
el estado conectado. `VITE_SUPABASE_FN` la inyecta Believable al publicar. La Composio key
sigue server-side: el cliente solo habla con la function.

## Believable también usa esta conexión (Cloud → SEO y agentes)

La conexión owner-level de arriba no es solo teórica para tu app publicada: **Believable
la reutiliza directo**, sin pasar por tu Edge Function. Ejemplo real: si conectas
**Google Search Console** (`google_search_console`) desde Believable → Integraciones, la
pestaña **Cloud → SEO y agentes** ejecuta las tools de GSC server-side (desde el proceso
principal de Believable, con la misma Composio key y la misma entity `believable-<projectId>`)
y te muestra el estado real de indexación de tu dominio publicado — sin que tú escribas
código ni despliegues nada. Es el mismo flujo `composio:connect` / conexión owner-level de
siempre; ningún toolkit necesita un caso especial para esto.

## Asignación de tenant server-side

La misma function expone `claimTenant()` (acción `assign_tenant`): llámala UNA vez tras el
`signUp` o el retorno del OAuth para que el servidor mapee al usuario a su tenant con
service_role (el tenant está horneado en la function; el cliente no puede elegir otro). Es
el camino robusto para apps de terceros; para apps internas de Believe el trigger de
metadata ya lo cubre. Ver `AUTH.md`.

## Regla de oro

La Composio API key es secreta y vive server-side (en la Edge Function). Nunca en React,
nunca en el navegador, nunca en el build del cliente.
