// Inbox de notificaciones de la app (la campanita): Novu de Believe en modo headless, sin la UI ni
// la marca de Novu. Tú dibujas la campanita con los componentes de la app.
//
// Requisitos:
// - Notificaciones activadas (Cloud → Notificaciones). Believable deja VITE_NOVU_APP_ID,
//   VITE_NOVU_API_URL y VITE_NOVU_SOCKET_URL en el .env (preview) y en el .env.production.
// - La dependencia: `npm i @novu/js@3.19.2` (el core; NUNCA `@novu/js/ui`, trae "Powered by Novu").
// - Una Edge Function que entregue el hash del usuario logueado. El hash se calcula SIEMPRE en el
//   servidor (con él nadie puede leer el Inbox de otro adivinando su id). Ejemplo,
//   supabase/functions/novu-session/index.ts:
//
//     Deno.serve(async (req) => {
//       const auth = req.headers.get('Authorization') ?? ''
//       const r = await fetch(Deno.env.get('SUPABASE_URL') + '/auth/v1/user', {
//         headers: { Authorization: auth, apikey: Deno.env.get('SUPABASE_ANON_KEY')! }
//       })
//       if (!r.ok) return new Response('No autorizado', { status: 401 })
//       const user = await r.json()
//       return Response.json({ subscriberId: user.id, subscriberHash: await novuSubscriberHash(user.id) })
//     })
//
//   (`novuSubscriberHash` y `novuTrigger` ya vienen inyectados en cada Edge Function.)
//
// Copia este archivo a src/ (ej. src/lib/novu.ts) y úsalo desde la campanita.

import { Novu } from '@novu/js'

const applicationIdentifier = import.meta.env.VITE_NOVU_APP_ID as string
const apiUrl = (import.meta.env.VITE_NOVU_API_URL as string) || 'https://api.notify.believe-global.com'
const socketUrl = (import.meta.env.VITE_NOVU_SOCKET_URL as string) || 'wss://ws.notify.believe-global.com'

/** Cliente del Inbox de un usuario. `subscriberId` y `subscriberHash` salen de la Edge Function. */
export function createInbox(session: { subscriberId: string; subscriberHash: string }): Novu {
  if (!applicationIdentifier) throw new Error('Faltan las notificaciones: actívalas en Cloud → Notificaciones.')
  return new Novu({ applicationIdentifier, subscriberId: session.subscriberId, subscriberHash: session.subscriberHash, apiUrl, socketUrl })
}

/** Últimas notificaciones y cuántas faltan por leer. */
export async function loadInbox(inbox: Novu, limit = 20) {
  const [list, unread] = await Promise.all([inbox.notifications.list({ limit }), inbox.notifications.count({ read: false })])
  if (list.error) throw new Error(list.error.message)
  return { notifications: list.data?.notifications ?? [], unread: unread.data?.count ?? 0 }
}

/** Avisa cuando llega una notificación nueva (por websocket). Devuelve cómo dejar de escuchar. */
export function onNewNotification(inbox: Novu, cb: () => void): () => void {
  return inbox.on('notifications.notification_received', cb)
}

// Marcar como leída: `await notification.read()` sobre un elemento de `notifications`, o
// `await inbox.notifications.readAll()` para todas.
