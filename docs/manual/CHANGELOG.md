# Historial del Manual de Maasy en Claude

Cada edición del manual tiene su propio número (`MANUAL-VERSION`) y declara qué plugins y versiones describe (`plugins` en `manual.config.json`).

Cómo se numera:

- **Primer número**: se reorganizó el manual o cambió la forma de usar Maasy en Claude.
- **Segundo número**: un capítulo nuevo o una capacidad nueva documentada (por ejemplo, un plugin que llega a la tienda).
- **Tercer número**: correcciones, precisiones y pantallas rehechas.

## 1.2.2 (2026-11-26)

- **Feed y Reply**: todo lo que hace la persona (conectar Instagram, aprobar o descartar, programar y activar) es en la web de Maasy, en `maasy.ai/control/llaves`, `/control/feed` y `/control/reply`. Se quitan todas las menciones al panel de BeFeed y de BeReply. El capítulo 7 suma una tabla con esas direcciones.
- **Reply**: si la conexión solo trae "Proponer borradores", `/maasy-reply:campana` te pide el @usuario; si falta otro permiso, Claude dice cuál y dónde activarlo.
- **Games** pasa a disponible: `maasy-games` en la tienda, juegos en `<nombre>.begames.app`, aprobar y despublicar en `maasy.ai/control/games`. El capítulo 15 se reescribe como "Maasy Games y lo que viene" (con Ads).
- **Incubator**: `/maasy-vibe:incubadora` ya viene en `maasy-vibe` y se describe en el capítulo 9.
- **`maasy_forget_brand_brain_item`** ya está disponible: se quita `PRÓXIMAMENTE`.
- **Borrar una marca**: si recuperar una marca borrada sube tu cupo, primero ves cuánto cambia la factura y decides tú.
- Versiones al día: Vibe 0.1.0+6c360a26, Motion 0.2.3, Feed 1.0.2 y Reply 1.0.3.

## 1.2.1 (2026-11-26)

- Versiones al día: Motion 0.2.2 y Lens 0.2.3 (solo licencia, ícono y política de privacidad; el manual no cambia).
- **AOS** ya está en la tienda: pasa a `main` y a "Disponible" en el manual. Se quita la frase que decía que esperaba la aprobación de su PR.

## 1.2.0 (2026-11-26)

- **Feed, Reply y AOS pasan a disponibles.** Se reescriben los capítulos 12, 13 y 14 con lo que hacen los plugins publicados: comandos y herramientas reales de `maasy-feed` 1.0.0, `maasy-reply` 1.0.0 y `maasy-aos` 0.1.0 (este último entra a la tienda con su PR). Se quitan las etiquetas PRÓXIMAMENTE de esos tres. Las pantallas siguen siendo diseños aprobados, y el pie dice qué coincide.
- **Reply** se activa en el panel de BeReply, no en la web de Maasy; Feed y AOS ya no mencionan una pestaña propia en el panel.
- **Motion y Lens** pasan a disponibles (0.2.1 y 0.2.2). El ffmpeg de Motion ahora incluye subtítulos quemados y conversión HDR; se corrige el capítulo 10 y se agregan sus descargas y límites.
- Ads, Games e Incubator siguen como `PRÓXIMAMENTE`.

## 1.1.1 (2026-11-26)

- **Cancelar Pro**: se cancela desde el portal de pagos de Stripe, al final del período pagado y sin prorrateo. Sigues con Pro hasta entonces; después tus marcas vuelven al plan gratis sin perder datos, y las que pasen del cupo se siguen usando pero no puedes crear nuevas.
- **Vibe**: plan gratis de Maasy, 1 app publicada con el sello "Built with Maasy"; plan Pro, 5 apps sin sello. El plan es el del dueño de la marca, así que un colaborador en una marca Pro también publica sin sello.
- **Borrar un análisis de Lens del cerebro**: queda como `PRÓXIMAMENTE` (`maasy_forget_brand_brain_item`, en revisión) y no exigirá plan Pro, solo acceso a la marca.

## 1.1.0 (2026-11-26)

- **Tres capítulos nuevos.** "Lo que Maasy sabe de tu marca" (4): el ADN parte por parte, las ocho derivaciones y lo que produce cada una, el análisis de referencias con Anti-Look Maasy y el design.md. "El cerebro de tu marca" (5): el grafo, su compresión, el corpus vectorizado por capas, la memoria de aprobadas, ganadoras y descartadas, cómo lo consulta Claude y cómo aprende, con una figura del ciclo. "Qué puedes crear con tu marca" (6): textos, estrategias, anuncios, posts, artículos, emails, landings y videos, con ejemplos de pedidos.
- **Capítulo 3 reescrito.** La entrevista guiada construye el ADN completo (más de 40 campos y ocho derivaciones), no un resumen.
- Los capítulos siguientes se renumeran (del 4 al 15 pasan al 7 al 18) y se actualizan las referencias cruzadas.
- `maasy_forget_brand_brain_item` figura como `PRÓXIMAMENTE`: está en revisión y no en producción.

## 1.0.1 (2026-11-26)

- **Planes y cobro**: cada marca de pago se cobra solo con tu sí. Claude pide la marca, Maasy responde una cotización (monto y prorrateo de hoy) que vale 10 minutos y Claude te la muestra en una tarjeta; solo con esa cotización se crea la marca y se cobra. Borrar una marca Pro: solo el dueño, con la misma confirmación; la factura baja en el acto con prorrateo a favor, la purga llega a los 30 días y el borrado se frena con un aviso si hay algo vivo o pagos pendientes de la red de anuncios. Cancelar un Pro queda como pendiente: el código no define un flujo propio.
- **AOS**: los topes ya no son de ejemplo. El juez lo paga Believe, con un tope de 5 corridas y USD 10 por cuenta al día, y la medición usa solo las llaves de la persona.
- **Lens**: solo Mac con chip Apple y macOS 13 o superior. Se quitó la mención a Intel.
- **Si algo falla**: canal de soporte, soporte@maasy.ai (también en el pie de la página).
- **Scripts**: sin datos de infraestructura interna. Los secretos y rutas salen de variables de entorno (`scripts/manual/.env.example`).

## 1.0.0 (2026-11-25)

Primera edición. Describe `maasy` 0.2.0 y `maasy-vibe` 0.1.0, ya en la tienda, y `maasy-motion` 0.2.0 y `maasy-lens` 0.2.0, en revisión (PR 2 y 3 del repositorio).

- Quince capítulos: qué es y cómo se arma, instalación, la cuenta y la marca, la web de Maasy, planes y cobro, un capítulo por plugin (Vibe, Motion, Lens, Feed, Reply y AOS), lo que viene (Ads, Games e Incubator), privacidad y seguridad, qué hacer si algo falla y glosario.
- Feed, Reply y AOS se describen según su diseño aprobado, con la etiqueta `PRÓXIMAMENTE`: sus plugins todavía no están en la tienda.
- Cinco figuras explicativas y veinte pantallas. Las pantallas son los diseños aprobados con datos de ejemplo, salvo dos capturas reales del control plane. Cada pie lo dice.
