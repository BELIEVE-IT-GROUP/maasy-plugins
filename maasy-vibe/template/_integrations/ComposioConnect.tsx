// =============================================================================
// Componente de REFERENCIA: botón "Conectar <toolkit>" para el usuario final.
// =============================================================================
//
// Copia este archivo a src/components/ cuando una integración la conecta cada
// usuario final (no el builder). Adáptalo a la marca de la app (estilos, textos).
// El usuario debe estar logueado con Supabase (ver AUTH.md); la conexión queda
// atada a su cuenta.
//
// Uso:
//   <ComposioConnect toolkit="gmail" label="Gmail" />

import { useCallback, useEffect, useState } from 'react'
import { composioStatus, composioConnectUrl } from '../_integrations/composio-connect'

export function ComposioConnect({
  toolkit,
  label
}: {
  toolkit: string
  label?: string
}): React.JSX.Element {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const name = label || toolkit

  const refresh = useCallback(async () => {
    try {
      const status = await composioStatus([toolkit])
      setConnected(status[toolkit.toLowerCase()] === true)
    } catch {
      setConnected(false)
    }
  }, [toolkit])

  useEffect(() => {
    void refresh()
    // Al volver del OAuth (la pestaña recupera el foco), vuelve a chequear.
    const onFocus = (): void => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const connect = async (): Promise<void> => {
    setBusy(true)
    try {
      const url = await composioConnectUrl(toolkit)
      window.open(url, '_blank', 'noopener')
    } finally {
      setBusy(false)
    }
  }

  if (connected === null) return <span className="text-sm text-neutral-500">Cargando…</span>
  if (connected) return <span className="text-sm text-green-600">{name} conectado</span>
  return (
    <button
      onClick={() => void connect()}
      disabled={busy}
      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {busy ? 'Abriendo…' : `Conectar ${name}`}
    </button>
  )
}
