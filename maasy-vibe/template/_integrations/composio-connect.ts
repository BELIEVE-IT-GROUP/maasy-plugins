// =============================================================================
// Cliente (NAVEGADOR) para las integraciones per-usuario vía Composio.
// =============================================================================
//
// Cada usuario final conecta SU propia cuenta (Gmail, Stripe, Slack…). Este
// helper habla con la Edge Function proxy que Believable despliega en el box de
// Supabase; la Composio key vive en esa function (server-side), nunca acá.
//
// Requiere:
//   - El usuario logueado con Supabase (ver AUTH.md): la conexión se ata a su id.
//   - VITE_SUPABASE_URL y VITE_SUPABASE_FN: Believable las inyecta al deployar
//     cuando el proyecto tiene integraciones.

import { supabase } from '@/lib/supabase'

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${import.meta.env.VITE_SUPABASE_FN}`

async function callProxy(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Manda el access token del usuario logueado: la function lo usa para atar la
  // conexión (y para asignar el tenant server-side en assign_tenant).
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(FN_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })
  try {
    return await res.json()
  } catch {
    return {}
  }
}

async function currentUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id
}

// ¿El usuario logueado ya conectó estos toolkits? Devuelve { slug: boolean }.
export async function composioStatus(toolkits: string[]): Promise<Record<string, boolean>> {
  const userId = await currentUserId()
  const out = await callProxy({ action: 'status', toolkits, userId })
  return (out.connected as Record<string, boolean>) || {}
}

// Inicia el OAuth del toolkit para el usuario logueado; devuelve la URL a abrir.
// Ábrela (window.open o redirect); al volver, vuelve a consultar el status.
export async function composioConnectUrl(toolkit: string): Promise<string> {
  const userId = await currentUserId()
  const out = await callProxy({ action: 'connect', toolkit, userId })
  const url = out.redirect_url as string | undefined
  if (!url) throw new Error((out.error as string) || 'No pude iniciar la conexión')
  return url
}

// Ejecuta un tool de Composio (server-side, la key vive en la function).
export async function executeComposioTool(
  toolSlug: string,
  args: Record<string, unknown>,
  opts?: { userId?: string }
): Promise<unknown> {
  return callProxy({ action: 'execute', toolSlug, arguments: args, userId: opts?.userId })
}

// Asigna el tenant del usuario logueado del lado servidor (llamar UNA vez tras
// signUp / retorno del OAuth). El tenant está horneado en la function: el cliente
// no puede elegir otro. Idempotente.
export async function claimTenant(): Promise<void> {
  await callProxy({ action: 'assign_tenant' })
}
