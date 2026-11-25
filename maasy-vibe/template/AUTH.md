# Autenticación (opcional)

Login con **Google** y **email/contraseña** vía Supabase self-hosted de Believe. Esta
capacidad es **opt-in**: solo la usan las apps con una zona privada. Si tu app es pública
(formularios, listas, contenido sin cuentas), ignora este archivo y usa `supabaseAnon`.

## Cuándo usarla

Cuando la app necesita distinguir usuarios: dashboard privado, datos por cuenta, cualquier
pantalla detrás de login.

## Cómo activarla

1. El SDK ya está: `@supabase/supabase-js` viene en `package.json`. No instales nada más.

2. Copia `_backend/supabase.ts` a `src/lib/supabase.ts`. Trae los helpers de auth:
   - `signInWithGoogle(redirectTo?)` — login con Google (OAuth).
   - `signUp(email, password)` / `signIn(email, password)` — email/contraseña.
   - `signOut()` y `currentUser()`.

3. Construye una `LoginPage` de nivel SaaS pro (Linear, Vercel, Stripe como referencia
   de vocabulario) — nunca un formulario neutro de 3 inputs sueltos en el centro de una
   pantalla vacía. Usa los tokens del `@theme` del proyecto (nunca colores hardcodeados):

   - **Layout de dos columnas en desktop** (colapsa a una en mobile): a un lado el
     formulario, al otro un panel de marca (logo grande, headline corto, y opcionalmente
     un detalle visual — gradiente, imagen de producto, o una cita/testimonio). Si el
     proyecto no tiene assets de marca, usa un panel de color sólido con el logo/wordmark
     centrado en vez de dejarlo vacío.
   - **Jerarquía clara en el formulario:** logo/wordmark arriba, título ("Bienvenido de
     vuelta" / "Crea tu cuenta"), botón de Google como acción primaria con su ícono real
     (no un botón genérico), separador "o continúa con email", inputs de email/password
     con labels, y el submit como botón primario del tema.
   - **Estados que un login real necesita:** loading en el submit (spinner + disabled),
     mensajes de error legibles (credenciales inválidas, email ya registrado), link para
     alternar entre login/registro, y "¿Olvidaste tu contraseña?" si el flujo lo amerita.
   - **Detalle fino:** foco visible en inputs, `autoFocus` en el primer campo, submit con
     Enter, y el botón de Google respeta el brand real de Google (fondo blanco, logo a
     color, texto gris oscuro) aun en un proyecto de tema oscuro — es la única excepción
     al `@theme` del proyecto, por convención de marca de terceros.

   ```tsx
   import { signInWithGoogle, signIn, signUp } from '@/lib/supabase'

   // Google (vuelve a la raíz; o pasa la ruta de vuelta: signInWithGoogle('/panel')):
   <button onClick={() => signInWithGoogle()}>Entrar con Google</button>
   // Email:
   await signIn(email, password)   // o signUp(email, password) para registro
   ```

### Dominio propio y vuelta del login

Nunca llames `supabase.auth.signInWithOAuth` directo ni armes el `redirectTo` a mano: usa
`signInWithGoogle`. El backend solo vuelve a direcciones de su lista, y el dominio propio de
la app no está en ella. El helper pasa la vuelta por el puente de Believe
(`https://auth.apps.believe-global.com/callback?to=<url de vuelta>`), que la reenvía a tu app
con el `code` intacto, así el login funciona igual en `<id>.apps.believe-global.com` y en el
dominio propio. En el preview local (127.0.0.1/localhost) vuelve directo, como siempre.

## Cómo proteger rutas

Consulta `currentUser()` y redirige a `/login` si es `null`.

```tsx
import { useEffect, useState } from 'react'
import { currentUser, supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuthGuard() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    currentUser().then((u) => {
      if (!u) window.location.href = '/login'
      setUser(u ?? null)
    })
    // Reacciona a login/logout (incl. el retorno del OAuth de Google).
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return user // undefined = cargando, User = ok, null = sin sesión
}
```

Envuelve la zona privada con ese guard y muestra un estado de carga mientras
`user === undefined`.

## Aislamiento por tenant (lo garantiza el servidor)

Cada app es un tenant. El backend estampa a qué tenant pertenece cada usuario **del lado
servidor** y el RLS lo aísla: un usuario solo ve los datos de su tenant.

- **Apps internas de Believe (confiables):** el registro por email pasa el tenant en
  metadata y un trigger lo mapea. Funciona out-of-the-box.
- **Apps de terceros / usuarios no confiables:** la asignación server-side va por una
  **edge function per-app** con service_role (tenant horneado), que la app llama tras el
  signUp/OAuth. Ver `INTEGRATIONS.md`. Believable la deploya al publicar full-stack.

## Aprovisionamiento (lo hace Believable)

Al publicar como full-stack, Believable crea el tenant, inyecta `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_TENANT_KEY` y `VITE_SUPABASE_SCHEMA`, y el provider
Google ya está configurado en el backend (el redirect de Google Cloud Console se registra
una sola vez para todas las apps). No tienes que tocar el backend.
