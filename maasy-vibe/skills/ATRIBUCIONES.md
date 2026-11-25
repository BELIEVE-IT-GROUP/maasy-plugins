# Atribuciones de los skills bundleados

## Skills de Emil Kowalski

Ocho de los skills incluidos en este template provienen de
**[emilkowalski/skills](https://github.com/emilkowalski/skills)**, de Emil Kowalski
(creador de Sonner y Vaul, ex Vercel y Linear), publicados bajo **licencia MIT**:

| Skill | Para qué sirve |
|---|---|
| `emil-design-eng` | El principal: animación y criterio de diseño |
| `review-animations` | Revisa animaciones existentes con reglas estrictas |
| `improve-animations` | Audita las animaciones del proyecto y propone planes ejecutables |
| `find-animation-opportunities` | Encuentra dónde el movimiento aporta, y dónde no animar |
| `animation-vocabulary` | Vocabulario preciso para pedirle animaciones a un agente |
| `pick-ui-library` | Elige la librería correcta en vez de improvisar componentes |
| `prototype` | Genera varias versiones de una pieza de UI y las compara |
| `apple-motion` | Principios de movimiento fluido de Apple, llevados a la web |

**Nota:** `apple-motion` se llama `apple-design` en el repositorio original. Se renombró aquí
cuando el template traía otro `apple-design`, que se quitó el 2026-11-24. El contenido no se modificó.

El texto de la licencia está en `LICENSE-emilkowalski-skills`, junto a este archivo, tal como
exige la licencia MIT. Si actualizás estos skills desde el repositorio original, mantené ese
archivo.

## Skills de GSAP (GreenSock)

Ocho skills provienen de **[greensock/gsap-skills](https://github.com/greensock/gsap-skills)**,
el repositorio oficial de GreenSock (autores de GSAP, 12.5k stars), publicados bajo
**licencia MIT**:

| Skill | Para qué sirve |
|---|---|
| `gsap-core` | API central: `gsap.to()`, `from()`, `fromTo()`, easing, stagger, `matchMedia` |
| `gsap-scrolltrigger` | Animación atada al scroll: pin, parallax, scrubbing |
| `gsap-timeline` | Secuencias y timelines encadenados |
| `gsap-plugins` | SplitText, MorphSVG, Flip, Draggable y demás plugins |
| `gsap-react` | Integración con React (`useGSAP`, cleanup, refs) |
| `gsap-performance` | Rendimiento: `will-change`, GPU, evitar layout thrashing |
| `gsap-utils` | Helpers: `clamp`, `mapRange`, `interpolate`, etc. |
| `gsap-frameworks` | Uso de GSAP en Vue, Svelte, vanilla JS y otros frameworks |

Copiados literales del repositorio oficial, sin modificar. El texto de la licencia está en
`LICENSE-greensock-gsap-skills`, junto a este archivo.

## Skill de TanStack Start / Router

El skill `tanstack-start` es propio de Believable, pero su carpeta `oficial/` contiene 20
archivos copiados literales del monorepo
**[TanStack/router](https://github.com/TanStack/router)**, de Tanner Linsley y
colaboradores, publicados bajo **licencia MIT**. En ese repositorio los skills viven
dentro de cada paquete (`packages/*/skills/`), no en un repo aparte.

| Archivo en `oficial/` | Origen en TanStack/router |
|---|---|
| `react-start.md` | `packages/react-start/skills/react-start/SKILL.md` |
| `migrate-from-nextjs.md` | `packages/react-start/skills/lifecycle/migrate-from-nextjs/SKILL.md` |
| `react-router.md` | `packages/react-router/skills/react-router/SKILL.md` |
| `migrate-from-react-router.md` | `packages/react-router/skills/lifecycle/migrate-from-react-router/SKILL.md` |
| `start-core*.md` (3) | `packages/start-client-core/skills/start-core/**/SKILL.md` |
| `router-core*.md` (11) | `packages/router-core/skills/router-core/**/SKILL.md` |
| `router-plugin.md` | `packages/router-plugin/skills/router-plugin/SKILL.md` |
| `virtual-file-routes.md` | `packages/virtual-file-routes/skills/virtual-file-routes/SKILL.md` |

Se bundleó el subconjunto de **React**: los de Solid y Vue no aplican, y los de servidor
(`server-functions`, `middleware`, `server-routes`, `auth-server-primitives`,
`start-server-core`, `server-components`) se dejaron afuera **a propósito** — describen un
runtime de servidor que las apps de Believable no tienen, y tenerlos a mano lleva a
escribir código que compila y se rompe al navegar. La regla está escrita en el `SKILL.md`.

El `SKILL.md` de la raíz del skill es material propio de Believable: tapa los dos huecos
que el skill oficial no cubre (CSS/Tailwind y dónde cae la salida del prerender) y fija las
reglas de este proyecto.

Para refrescar los archivos oficiales: `scripts/vendor-tanstack-skill.sh`.

El texto de la licencia está en `LICENSE-tanstack-router`, junto a este archivo.

## Skill de Three.js / React Three Fiber (genjutsu)

`threejs-r3f` proviene del sub-skill `threejs-r3f` de
**[AThevon/genjutsu](https://github.com/AThevon/genjutsu)**, de Adrien Thevon, publicado bajo
**licencia MIT**. Cubre escenas 3D, shaders y postprocessing con Three.js y React Three Fiber —
un hueco que ningún skill bundleado cubría antes.

De los 17 skills de genjutsu se bundleó únicamente este: los demás sub-skills de UI/motion se
descartaron por solaparse con skills ya bundleados (`ui-ux-pro-max`, `design-review`, y los de
Emil Kowalski para principios de movimiento) o por ser orquestadores (`cast`, `paint`) que solo
tienen sentido dentro del plugin completo de genjutsu, no como skill suelto.

El texto de la licencia está en `LICENSE-athevon-genjutsu`, junto a este archivo.

## Skills de Jakub Krehel

Nueve de los skills incluidos en este template provienen de
**[jakubkrehel/skills](https://github.com/jakubkrehel/skills)**, de Jakub Krehel
(interfaces.dev), publicados bajo **licencia MIT**. Cinco son auto-invocables (el agente
los usa cuando corresponde) y cuatro se invocan a mano (slash command).

Auto-invocables:

| Skill | Para qué sirve |
|---|---|
| `better-accessibility` | Cumplimiento de accesibilidad: teclado, foco visible, screen readers, ARIA mínima |
| `better-colors` | Sistema de color por roles, contraste medido (no estimado), tokens semánticos |
| `better-typography` | Escala tipográfica, spacing, variable fonts, OpenType, wrapping (con cheat-sheet Tailwind) |
| `better-layout` | Agrupación, alineación, orden de lectura y RTL |
| `better-writing` | Copy de producto / microcopy claro y consistente |

Invocables a mano (`disable-model-invocation`):

| Skill | Para qué sirve |
|---|---|
| `interface-review` | Revisa un cambio (diff / rama / PR) contra las categorías de las `better-*` |
| `break` | Renderiza un componente en todos sus estados en una página temporal y lo estresa |
| `variant` | Arma tres variantes de una pieza de UI tras un picker para iterar y elegir |
| `explain-interface` | Explica cómo se construyó una animación o pieza de UI en la web |

El texto de la licencia está en `LICENSE-jakubkrehel-skills`, junto a este archivo, tal como
exige la licencia MIT. Si actualizás estos skills desde el repositorio original, mantené ese archivo.

## Skill propio con motor de terceros: video-de-marca

`video-de-marca` es de Believe (la receta de la capa motion-video-believe). El motor que usa
NO viaja con el skill: lo sirve Believable desde sus recursos, y su origen es
**[Bae-ChangHyun/code-video](https://github.com/Bae-ChangHyun/code-video)** (licencia MIT;
el texto y las demás atribuciones del motor están en `resources/motion/engine/` de
Believable). `referencia-motor.md` resume esa API en español con palabras propias.

## Skill de Dioramas (blendi-remade/dioramas)

`dioramas` adapta el método de **[blendi-remade/dioramas](https://github.com/blendi-remade/dioramas)**,
de Blendi (brief → build → review → revise, la vara de calidad de `docs/ENGINE.md` y el formato de
`docs/briefs/`), publicado bajo **licencia MIT**. El texto está reescrito en español para el
componente `diorama-hero` del pack `believe-dioramas`, que trae el engine portado.

Los modelos 3D que el pack sirve desde el R2 de Believe son de ese repo bajo **CC BY 4.0**: piden
crédito visible en la app (la skill lo exige).

El texto de la licencia MIT está en `LICENSE-blendi-dioramas`, junto a este archivo.

## Skill awesome-design-md (VoltAgent/awesome-design-md)

`awesome-design-md` es un índice escrito por Believe sobre las 73 fichas `DESIGN.md` de
**[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)**, publicadas bajo
**licencia MIT**. Las fichas no viajan en el template: las instala el pack `believe-referencias`
en `.referencias-diseno/marcas/` cuando el usuario pide el estilo de una marca, cada una sin
cambios y con su LICENSE al lado. Describen el estilo público de cada marca como referencia; las
marcas siguen siendo de sus dueños.

El texto de la licencia MIT está en `LICENSE-voltagent-awesome-design-md`, junto a este archivo.

## Skill de diseño de logos (kaankiziltug/logo-design-skill)

`logo-design` proviene de la carpeta `skills/logo-design` de
**[kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill)**, de Kaan
Kiziltug, publicado bajo **licencia MIT**. Cubre el método completo de un logo: brief, conceptos,
construcción en SVG, pruebas (16 px, una tinta, invertido, estante), presentación y kit de entrega,
con scripts Python sin dependencias (`svg_audit.py`, `export_variants.py`, `concept_sheet.py`...).
Be lo usa en cualquier proyecto que pida un logo, favicon o icono de app, y el MAAS Incubator lo
usa en la fase de la marca (su `svg_audit.py` es un check del gate).

**Qué se dejó afuera, a propósito:** los 1.432 SVG de `assets/library/svg/`, `gallery.html` y
`classifications.json`. Los SVG son logos de marcas registradas de terceros: la MIT cubre el
código y el texto del autor, no las marcas, y no se redistribuyen en un producto comercial. Se
conservan `catalog.json` y `stats.json` (solo metadatos: clasificación, colores, complejidad),
que bastan para buscar y para la auditoría de complejidad. `search_library.py` y
`preview_sheet.py` se ajustaron para avisar que los archivos no vienen, y `SKILL.md` y
`references/library-guide.md` llevan una nota de adaptación. Tampoco se copiaron
`TRADEMARKS.md`, `docs/`, `evals/`, `tests/` ni `build_catalog.py` (herramienta de mantenimiento
que necesita los SVG).

El texto de la licencia está en `LICENSE-kaankiziltug-logo-design`, junto a este archivo.

## Skill de APIs nativas del navegador (GoogleChrome/modern-web-guidance)

Las 210 guías de `modern-web-guidance/guides/` provienen de la carpeta
`skills/modern-web-guidance/guides` de
**[GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)**, del
equipo de Google Chrome, publicadas bajo **licencia Apache-2.0**. Versión fija: commit
`64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65`. Cubren las APIs modernas del navegador (dialog,
popover, anchor positioning, select personalizable, formularios, view transitions, accesibilidad,
LCP/INP/CLS, seguridad) con su compatibilidad y el fallback de cada una.

**Cambios respecto del original:** el `SKILL.md` es una adaptación propia de Believable. El
original manda correr `npx modern-web-guidance@latest` en cada uso; aquí las guías viajan con el
proyecto y Be busca en `INDEX.md` (generado desde las guías) sin red ni código de npm. Se quitó la
sección que el original agrega al final de cada respuesta, se acotó el disparo a componentes,
formularios, layout, animación, accesibilidad y rendimiento, y se fijó Baseline ampliamente
disponible como política por defecto. Dentro de las guías, las referencias cruzadas
`npx ... retrieve "id"` se reemplazaron por la ruta local de la guía; cada archivo tocado lleva una
nota al final. El resto del texto no se modificó. No se copiaron el skill `chrome-extensions` ni
los archivos de plugin (`plugin.json`, `gemini-extension.json`, `kimi.plugin.json`, `policies/`).

Para refrescar: `scripts/vendor-modern-web-guidance.mjs` (instrucciones al tope del archivo), y
actualizar el commit de arriba. El texto de la licencia está en
`LICENSE-googlechrome-modern-web-guidance`, junto a este archivo.

## Skills de diseño de fábrica (verificados el 2026-11-24)

Siete skills de diseño llegaron al template el 2026-07-24 desde la instalación personal de skills, sin su
licencia al lado. El 2026-11-24 se rastreó el origen de cada uno en GitHub y se agregó el texto de su licencia,
porque el plugin de Believable para Claude Code los redistribuye en un repo público. El contenido de los skills
no se tocó; las versiones bundleadas son anteriores a las que hoy están en cada repo.

| Skill | Origen | Licencia | Texto |
|---|---|---|---|
| `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark), `skills/hallmark` | MIT | `LICENSE-nutlope-hallmark` |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), `skills/taste-skill` | MIT | `LICENSE-leonxlnx-taste-skill` |
| `high-end-visual-design` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), `skills/soft-skill` (borrado del repo el 2026-10-19) | MIT | `LICENSE-leonxlnx-taste-skill` |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT | `LICENSE-nextlevelbuilder-ui-ux-pro-max` |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | `LICENSE-pbakaus-impeccable` y `NOTICE-pbakaus-impeccable.md` |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 | `frontend-design/LICENSE.txt` |
| `apple-bento-grid` | [hubeiqiao/apple-bento-grid](https://github.com/hubeiqiao/apple-bento-grid) | MIT | `apple-bento-grid/LICENSE` |

Apache-2.0 pide conservar el NOTICE del autor: por eso `impeccable` viaja con el suyo.

La lista de qué viaja en el plugin y con qué archivo está en `plugin/skills-licencias.mjs`; el build del plugin
falla si una carpeta de skills no aparece ahí o le falta su licencia. Un skill sin licencia publicada no entra al
template: por eso se quitó `apple-design` (dickwu/apple-design-skill) el 2026-11-24.
