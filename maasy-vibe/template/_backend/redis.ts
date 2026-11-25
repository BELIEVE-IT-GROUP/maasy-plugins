// Cliente Redis de la app. Believable inyecta VITE_REDIS_PROXY_URL al deployar como
// full-stack. Es un proxy compartido: valida tu VITE_SUPABASE_TENANT_KEY (el mismo que usa
// supabaseAnon) y aísla tus keys con un prefijo server-side, así que nunca chocas con otra app.
//
// Copia este archivo a src/ (ej. src/lib/redis.ts) y úsalo desde tus componentes o funciones.
// Úsalo para cache, contadores (rate limiting), y colas simples (lpush/rpop). NO para datos que
// necesiten sobrevivir un reinicio del box con garantía — para eso, Supabase.

const url = import.meta.env.VITE_REDIS_PROXY_URL as string
const tenantKey = import.meta.env.VITE_SUPABASE_TENANT_KEY as string

type RedisAction = 'get' | 'set' | 'del' | 'incr' | 'expire' | 'lpush' | 'rpop' | 'publish'

async function call(
  action: RedisAction,
  body: Record<string, unknown> = {}
): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `redis ${action} falló`)
  return json.result
}

export const redis = {
  get: (key: string): Promise<string | null> => call('get', { key }) as Promise<string | null>,
  // ttl en segundos (opcional).
  set: (key: string, value: string, ttl?: number): Promise<unknown> => call('set', { key, value, ttl }),
  del: (key: string): Promise<number> => call('del', { key }) as Promise<number>,
  incr: (key: string): Promise<number> => call('incr', { key }) as Promise<number>,
  expire: (key: string, ttl: number): Promise<number> => call('expire', { key, ttl }) as Promise<number>,
  // Cola simple: lpush para encolar, rpop para desencolar (FIFO).
  lpush: (key: string, value: string): Promise<number> => call('lpush', { key, value }) as Promise<number>,
  rpop: (key: string): Promise<string | null> => call('rpop', { key }) as Promise<string | null>,
  publish: (channel: string, message: string): Promise<number> =>
    call('publish', { channel, message }) as Promise<number>
}
