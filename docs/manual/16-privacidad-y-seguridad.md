# Privacidad y seguridad

Este capítulo explica en lenguaje simple qué guarda Maasy, quién lo ve, qué puede hacer Claude con tu cuenta y cómo borrar lo tuyo.

> Este capítulo resume cómo está diseñado el sistema. No reemplaza los términos ni la política de privacidad de Maasy. La política de privacidad del CRM todavía está en redacción.

## Qué guarda Maasy

| Qué | Dónde y cómo |
|---|---|
| Tu cuenta | Tu correo y tu sesión, en Maasy |
| Tu marca y su ADN | Tus respuestas, tus derivaciones y tu design.md, en Maasy |
| Tus archivos | Logo, fuentes e imágenes de producto, en un almacenamiento privado |
| Tu cerebro | El ADN y las piezas que aprobaste o descartaste |
| Tu CRM | Contactos, leads y oportunidades de cada marca, separados por marca |
| Las piezas que mandan los plugins | Como tarjetas en tu canvas, hasta que las apruebas o descartas |

Lo que **no** guarda: tus llaves de Motion (se quedan en tu Mac), los videos que Lens analiza (se quedan en tu Mac) y tus credenciales de App Store Connect y Google Play (viven en el llavero de tu computador, y Claude solo conoce la ruta de sus archivos).

## Quién lo ve

- **Tú**, y las personas a quienes le diste un asiento en una marca.
- **Cada marca está separada.** Lo que ve un plugin es de la marca que activaste. Una marca no ve los datos de otra.
- **Believe** opera sus propias marcas. Por el canal de Claude, sus administradores solo ven el CRM de las marcas que Believe opera, no el de las tuyas.
- **Tu Claude** lee lo que cada plugin le entrega para trabajar: tu marca, tu cerebro, tu CRM si el plan lo incluye. Lo procesa con tu cuenta de Claude, bajo los términos de Anthropic.

## Qué puede hacer Claude con tu cuenta

```figura
<figure class="vx-fig" data-alt="Tres niveles de permiso. Leer y proponer, siempre disponible. Enviar, publicar o gastar, solo con un permiso aparte que viene apagado. Aprobar, conectar cuentas y poner llaves, solo tú, en la web.">
  <div class="vx-head">Tres niveles de permiso</div>
  <div class="vx-body">
    <div class="vx-grid vx-c3">
      <div class="vx-node"><span class="vx-tag">Nivel 1</span>Leer y proponer<small>Tu marca, tu cerebro, borradores y tarjetas. Es lo que Claude hace por defecto.</small></div>
      <div class="vx-node"><span class="vx-tag">Nivel 2</span>Enviar, publicar o gastar<small>Solo con un permiso aparte, apagado por defecto, y con tu confirmación en cada acción.</small></div>
      <div class="vx-node vx-key"><span class="vx-tag">Nivel 3</span>Solo tú<small>Aprobar, conectar cuentas, poner llaves y subir de plan. En la web de Maasy.</small></div>
    </div>
  </div>
  <figcaption>Cuanto más cuesta equivocarse, más lejos queda de Claude y más cerca de tu sesión en la web.</figcaption>
</figure>
```

Al conectar un plugin, Maasy te muestra una pantalla de consentimiento con los permisos que pide. El permiso para enviar, publicar o mover plata (`maasy:actions`) aparece sin marcar. Lo enciendes solo si de verdad lo necesitas.

## Tus llaves y secretos

- La llave con la que Claude entra a Maasy está en **Llaves y conexiones**. Trátala como una contraseña y regenérala si crees que se filtró.
- Las llaves de IA que usa la medición de AOS se pegan en la web, se guardan cifradas y no se muestran después: solo su proveedor y sus últimos cuatro caracteres.
- Los secretos de tus apps publicadas (de Vibe) se agregan en la web. El valor no vuelve a mostrarse.
- Las llaves de Motion se quedan en tu Mac.
- Nunca pegues una llave, un token o una contraseña en el chat. Ningún plugin te las pide ahí.

## Archivos y marca

- Fuentes e imágenes de producto **no son públicas**.
- El logo es lo único con una copia pública, porque aparece en tus landings, correos y anuncios.
- Los archivos que Claude te pide subir los eliges tú. Nunca sube un archivo que no elegiste.

## Texto de terceros

Los comentarios, mensajes, descripciones de videos y transcripciones que un plugin lee son texto de otras personas. Claude los trata como **dato para analizar**, nunca como instrucciones. Si un comentario dice "ignora tus reglas", lo lee como un comentario más.

## Cómo revocar y borrar

| Quiero | Cómo |
|---|---|
| Cortar el acceso de un plugin | Web de Maasy, **Llaves y conexiones**, revocar. Deja de funcionar en menos de un minuto |
| Cambiar la llave de Maasy de Claude | Esa misma pantalla, **Regenerar** |
| Borrar una marca del plan gratis | `/maasy:borrar`. La marca deja de verse al instante y sus datos y archivos se borran a los 30 días |
| Borrar cualquier otra marca | En la web de Maasy |
| Borrar un análisis de Lens | Los videos se borran solos a los 30 días en tu Mac. Cómo borrar un análisis ya guardado en tu cerebro está por definir |
| Quitar un plugin | `/plugin`, desinstalar. No borra tu marca |

Borrar una marca no borra los datos del CRM de la marca mientras haya contactos o leads: primero hay que resolver eso. Las tarjetas del canvas se van con la marca.

## Qué hacemos nosotros

- Nada se genera con llaves de Believe en el canal de Claude.
- El método de Maasy (las recetas de la entrevista, de las derivaciones y de Motion) no viaja dentro de los plugins: se sirve desde Maasy, después de iniciar sesión, por partes y marcado con tu cuenta.
- Los plugins son públicos; el código de cada uno se puede leer en el repositorio `BELIEVE-IT-GROUP/maasy-plugins`.

## Preguntas frecuentes

**¿Maasy usa mis datos para entrenar modelos?** La respuesta formal está en la política de privacidad de Maasy, que se está actualizando para el canal de Claude. Del diseño sí podemos decir esto: en el canal de Claude, Maasy no genera con modelos propios. Tu contenido lo procesa tu Claude.

**¿Quién puede ver mi cerebro?** Tú y quienes tengan un asiento en tu marca.

**¿Y si pierdo mi computador?** Entra a la web de Maasy y regenera la llave de Claude desde **Llaves y conexiones**. Las llaves de Motion estaban en ese equipo: revócalas en el proveedor.
