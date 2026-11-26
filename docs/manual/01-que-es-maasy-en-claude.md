# Qué es Maasy en Claude

Maasy en Claude son los plugins de Maasy para Claude Desktop y Claude Code. Con ellos Claude conoce tu marca de verdad: su voz, su público, sus colores, sus referencias y lo que ya funcionó. Con ese contexto escribe, diseña, planea y mide en tu nombre, y tú decides qué sale.

La idea es sencilla. Tu marca y su memoria viven en Maasy. Claude es la interfaz con la que trabajas. Lo que hace una pieza (un video, una landing, una semana de contenido) lo pone tu Claude, con tu cuenta. Maasy guarda el método, la memoria y la infraestructura.

## Cómo está armado

Hay un plugin núcleo, `maasy`, y un plugin por cada producto. Todos dependen del núcleo: usan su sesión, su marca y su panel. No hay que iniciar sesión otra vez en cada uno.

```figura
<figure class="vx-fig" data-alt="Un plugin núcleo, maasy, en el centro. Arriba, un plugin por producto: Vibe, Motion, Lens, Feed, Reply y AOS. Abajo, el cerebro de tu marca en Maasy.">
  <div class="vx-head">Cómo encajan las piezas</div>
  <div class="vx-body">
    <div class="vx-grid vx-c3">
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-vibe<small>Apps y landings</small></div>
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-motion<small>Videos</small></div>
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-lens<small>Desarmar videos</small></div>
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-feed<small>Instagram orgánico</small></div>
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-reply<small>Respuestas</small></div>
      <div class="vx-node"><span class="vx-tag">Plugin</span>maasy-aos<small>Cómo te ven las IA</small></div>
    </div>
    <span class="vx-down" aria-hidden="true">&darr;</span>
    <div class="vx-node vx-key"><span class="vx-tag">Núcleo</span>maasy<small>Tu cuenta, tu sesión, la entrevista y el panel. Todos los plugins se apoyan aquí.</small></div>
    <span class="vx-down" aria-hidden="true">&darr;</span>
    <div class="vx-node"><span class="vx-tag">En Maasy</span>El cerebro de tu marca<small>ADN, design.md, archivos, piezas aprobadas y descartadas.</small></div>
  </div>
  <figcaption>Instalas el núcleo una vez. Cada producto que sumas llega con tu marca ya cargada.</figcaption>
</figure>
```

Los plugins que hay hoy y su estado:

| Plugin | Para qué | Estado |
|---|---|---|
| `maasy` | Cuenta, marca con su ADN, panel, CRM en lectura | Disponible |
| `maasy-vibe` | Apps y landings con tu marca, publicadas | Disponible |
| `maasy-motion` | Videos con tu marca, en tu Mac | `PRÓXIMAMENTE` (en revisión) |
| `maasy-lens` | Desarmar un video a partir de un link | `PRÓXIMAMENTE` (en revisión) |
| `maasy-feed` | Planear y escribir tu Instagram orgánico | `PRÓXIMAMENTE` |
| `maasy-reply` | Borradores de respuesta a comentarios y mensajes | `PRÓXIMAMENTE` |
| `maasy-aos` | Qué tan bien te leen y te recomiendan las IA | `PRÓXIMAMENTE` |
| Ads, Games e Incubator | Pauta, juegos de marca y creación de negocio | `PRÓXIMAMENTE` |

## Qué hace Claude y qué haces tú

Esta es la regla que ordena todo el manual. Claude lee, redacta y propone. Tú decides en la web de Maasy lo que sale al mundo, lo que gasta plata o lo que toca una cuenta tuya.

```figura
<figure class="vx-fig" data-alt="Dos columnas. En Claude: leer, redactar, proponer, dejar borradores. En la web de Maasy, tú: aprobar, publicar, enviar, conectar cuentas y poner llaves.">
  <div class="vx-head">Quién hace qué</div>
  <div class="vx-body">
    <div class="vx-grid vx-c2">
      <div class="vx-stack">
        <p class="vx-col-title">Claude, en el chat</p>
        <div class="vx-node">Lee tu marca y tu cerebro</div>
        <div class="vx-node">Redacta, diseña y planea</div>
        <div class="vx-node">Mide y analiza</div>
        <div class="vx-node">Deja borradores y propuestas<small>Siempre como borrador. Nada se envía desde Claude.</small></div>
      </div>
      <div class="vx-stack">
        <p class="vx-col-title">Tú, en la web de Maasy</p>
        <div class="vx-node vx-key">Apruebas o descartas<small>Cada pieza espera tu decisión</small></div>
        <div class="vx-node">Publicas y programas</div>
        <div class="vx-node">Conectas tus cuentas</div>
        <div class="vx-node">Pones tus llaves y tu plan</div>
      </div>
    </div>
  </div>
  <figcaption>Si nadie entra a la web de Maasy, lo que Claude preparó se queda en borrador. Es a propósito.</figcaption>
</figure>
```

Tres cosas que Claude nunca hace por sí solo: enviar un mensaje a un cliente tuyo, publicar en una red y conectar o aprobar una cuenta publicitaria. Para esas, el plugin te manda a la web de Maasy.

## Cómo se usa, en una vuelta

1. Instalas el plugin `maasy` y creas tu cuenta gratis con `/maasy:start`.
2. Claude te hace una entrevista en tarjetas y crea tu marca con su ADN.
3. Ves tu marca en la web de Maasy (maasy.ai).
4. Cuando quieres que tus plugins trabajen con tu marca, pasas al plan Pro.
5. Cada plugin crea piezas. Llegan al canvas de Maasy como tarjetas y tú las apruebas o las descartas.
6. Lo que apruebas y lo que descartas enseña a tu cerebro qué te gusta.

## Qué necesitas

- Una cuenta de Claude Pro o superior, en la app de Claude (pestaña Code) o en Claude Code. La IA la pone tu Claude: Maasy no revende IA ni cobra tokens.
- Para Motion y Lens, un Mac con chip Apple (M1 o más nuevo) y macOS 13 o superior. El resto funciona en cualquier computador con Claude.

## Preguntas frecuentes

**¿Maasy usa mi cuenta de Claude para todo?** Sí. La entrevista, las piezas y los análisis los genera tu Claude. Maasy pone la memoria de la marca, el método y los servidores. Por eso el plan de Maasy no incluye créditos de IA.

**¿Qué pasa con la web de Maasy de antes?** Sigue existiendo, ahora como el panel de control de tu cuenta (ver el capítulo 7). Las herramientas que generan con IA de Believe (el chat de Vibe, el Copilot y las generaciones en la web) no aparecen para quien llega desde Claude.

**¿Puedo usar solo un plugin?** Puedes instalar los que quieras, pero todos necesitan el núcleo `maasy` y una marca creada.
