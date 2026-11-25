---
name: modern-web-guidance
description: Guías oficiales de Google Chrome sobre APIs nativas del navegador (dialog, popover, anchor positioning, select personalizable, validación y autofill de formularios, view transitions, container queries, accesibilidad, LCP/INP/CLS, seguridad). Úsalo al construir o cambiar componentes, formularios, modales, menús, tooltips, layout, animaciones, accesibilidad o rendimiento, antes de resolverlo a mano o sumar una dependencia. No hace falta para cambiar un texto, un color o una imagen, ni para backend. Es de plataforma (qué API usar y con qué fallback); cómo se ve lo deciden los skills de diseño.
---

# Modern Web Guidance

Origen: GoogleChrome/modern-web-guidance@64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65 (Apache-2.0).
Las 210 guías de `guides/` están vendorizadas con versión fija: todo es local, sin red y sin
instalar nada. Este `SKILL.md` es una adaptación de Believable del original (ver
`../ATRIBUCIONES.md`). Para refrescar: `scripts/vendor-modern-web-guidance.mjs` en el repo de
Believable.

## Cuándo

Al construir o cambiar: modales y diálogos, popovers, tooltips, menús y dropdowns, selects,
formularios (validación, autofill, OTP, passkeys), tablas, carruseles, tabs, layout responsive
y container queries, transiciones de vista y animaciones de entrada y salida, scroll,
accesibilidad, rendimiento (LCP, INP, CLS, imágenes, carga de scripts) y seguridad del lado del
cliente (sanitizar HTML, Trusted Types).

No para cambiar un texto, un color, una imagen o un espaciado puntual.

## Cómo buscar

1. Busca con la herramienta Grep en `.claude/skills/modern-web-guidance/INDEX.md`, sin
   distinguir mayúsculas, con una o dos palabras clave **en inglés** del primitivo de UI o de
   la API: `dialog`, `popover`, `tooltip`, `select`, `valid`, `autofill`, `transition`,
   `scroll`, `container`, `table`, `LCP`, `INP`, `image`. Traduce la intención a su primitivo:
   "confirmar antes de borrar" es `dialog`; "elegir una opción con imágenes" es `select`.
2. Sin resultados útiles, prueba un sinónimo una vez. Para una revisión amplia (auditar la
   accesibilidad de la app), lee el `INDEX.md` entero.
3. Abre con Read la guía que aplica (las rutas del índice son relativas a la carpeta de este
   skill) y, si la tarea lo pide, la general de su categoría: `guides/css/css.md`,
   `guides/forms/forms.md`, `guides/accessibility/accessibility.md`,
   `guides/performance/performance.md`, `guides/html/html.md`, `guides/js/js.md`,
   `guides/security/security.md`. Las guías se citan entre sí con rutas `guides/...`: abre
   esas solo si hacen falta.
4. Antes de dar el trabajo por terminado, contrasta el código con la guía: el patrón moderno
   y el fallback que pide, sin meter funciones que nadie pidió.

Si ninguna guía cubre el tema, sigue sin ellas.

## Compatibilidad: Baseline por defecto

Las apps de Believable las ven clientes en Safari (macOS e iOS) y en celulares viejos. Por
defecto usa solo funciones **Baseline ampliamente disponibles** (Widely available). Para
cualquier función que no lo sea, aplica **siempre** el fallback o la detección de soporte que
indica su guía (`@supports`, `if ('x' in ...)`), de modo que la app siga funcionando sin ella.
Si el `CLAUDE.md` del proyecto fija otra política de navegadores, manda esa.

Las APIs que solo existen en Chrome (IA integrada como Summarizer, Translator o Prompt API;
WebMCP) no se usan salvo que el usuario las pida, y nunca sin detección y alternativa.

## Adaptar al stack del proyecto

Las guías están en HTML, CSS y JS sin framework. Llévalas a React sin perder la función
moderna:

- Atributos nuevos que React no tipa (`popover`, `commandfor`, `interestfor`, `switch`): pásalos
  con spread, `{...({ popover: 'auto' } as Record<string, string>)}`, en vez de quitarlos.
- `showModal()` y compañía por `ref`; ids e `anchor-name` únicos por instancia con `useId()`.
- Todo lo que toque `window` o `document` va en un efecto o en `<ClientOnly>`: el prerender
  ejecuta los componentes en el servidor. Un polyfill se carga con `import()` dentro del efecto.
- `:root` y `@starting-style` van en el nivel superior del CSS, sin anidar.
- Animación: la regla del proyecto manda (`motion` para estado de UI, GSAP para scroll y
  timelines). Las guías de animación sirven cuando basta CSS nativo, sin librería.

## Qué no hacer

- No corras comandos para buscar guías ni descargues nada: todo está en esta carpeta.
- No agregues a tu respuesta una sección sobre qué guías consultaste. El usuario no la
  necesita; explica una decisión técnica solo si te la preguntan.
- No reemplaza al skill de diseño del turno: este dice qué API y con qué fallback, el otro
  decide la estética.
- No modernices el proyecto entero si te pidieron un componente.
