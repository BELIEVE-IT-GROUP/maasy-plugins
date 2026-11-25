// Cliente Supabase de la app. Believable inyecta las variables al deployar como
// full-stack (VITE_SUPABASE_*). El backend es el Supabase self-hosted de Believe con
// aislamiento por tenant: esta anon key ya viene scopeada a TU tenant, así que todo lo
// que hagas contra `supabase` queda automáticamente aislado del resto de las apps.
//
// Copia este archivo a src/ (ej. src/lib/supabase.ts) y úsalo desde tus componentes.
// Requiere la dependencia @supabase/supabase-js (ya está en package.json).

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
// anonKey (compartida): va como header `apikey`, lo exige el gateway. tenantKey: JWT
// scopeado a TU tenant, para acceso SIN login.
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const tenantKey = import.meta.env.VITE_SUPABASE_TENANT_KEY as string
// El schema del tenant (tenant_<slug>). supabase-js manda Accept-Profile/Content-Profile
// solo, y todas tus tablas viven en tu espacio aislado.
const schema = (import.meta.env.VITE_SUPABASE_SCHEMA as string) || 'public'

// Cliente con LOGIN de usuarios: usa la anon key + supabase.auth. Tras loguearse, el
// token del usuario trae el claim de tenant (lo estampa el servidor) y el RLS lo aísla.
export const supabase = createClient(url, anonKey, {
  db: { schema },
  auth: { persistSession: true, autoRefreshToken: true }
})

// Cliente SIN login (apps de datos públicas: formularios, listas, contenido). Manda la
// tenantKey como Bearer para que el RLS lo deje leer/escribir SU tenant sin usuario.
// No uses supabase.auth con este cliente.
export const supabaseAnon = createClient(url, anonKey, {
  db: { schema },
  accessToken: async () => tenantKey
})

// El slug del tenant (para el signUp de abajo). Es el schema sin el prefijo tenant_.
const TENANT = schema.replace(/^tenant_/, '')

// --- Helpers de auth (solo si tu app tiene login de usuarios) ---
// El backend estampa a qué tenant pertenece cada usuario del lado servidor. Por eso el
// signUp manda el tenant en metadata: NO es la fuente de verdad (el servidor la valida),
// es la señal para que el trigger de asignación sepa a qué marca mapear al usuario nuevo.

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { tenant: TENANT } }
  })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Puente de OAuth de Believe. El backend solo vuelve a direcciones de su lista, y el dominio
// propio de tu app no está en ella: el puente sí, y rebota a tu URL de vuelta con el ?code= (o
// el #access_token) intacto. Solo acepta https a *.apps.believe-global.com o al dominio propio
// que Believable registró al publicar. En local (el preview, 127.0.0.1/localhost) se vuelve
// directo, como siempre: el puente rechaza http.
const OAUTH_BRIDGE = 'https://auth.apps.believe-global.com/callback'

function oauthReturnUrl(dest: string): string {
  const { hostname } = new URL(dest)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return dest
  return `${OAUTH_BRIDGE}?to=${encodeURIComponent(dest)}`
}

// Login con Google (OAuth). Redirige al proveedor y vuelve a `redirectTo` (una ruta como
// '/panel' o una URL de tu app; por defecto la raíz). Tras volver, hay sesión y supabase.auth
// la persiste sola. No armes el redirectTo a mano: pasa siempre por este helper.
// La asignación de tenant del usuario OAuth la hace el servidor (hook + trigger para apps
// internas; edge function per-app con service_role para apps de terceros, ver AUTH.md).
export async function signInWithGoogle(redirectTo?: string) {
  const dest = new URL(redirectTo ?? '/', window.location.origin).href
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthReturnUrl(dest) }
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function currentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}
