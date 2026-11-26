# Planes y cobro

Maasy en Claude tiene sus propios planes, distintos a los de la web de Maasy de antes. La regla de fondo es que Believe no revende IA. La IA la pone tu cuenta de Claude. Lo que Maasy cobra es el servicio: la memoria de tu marca, el método, los servidores y la operación de las mediciones.

> **Precio provisional.** Los números de este capítulo son los del lanzamiento y pueden cambiar. Después del lanzamiento se hará un modelado de precios completo.

## Los planes

| Plan | Qué incluye | Precio |
|---|---|---|
| `GRATIS` | Una marca, la entrevista completa, el ADN y su vista en la web de Maasy. No sirve el cerebro a los plugins de producto | USD 0, sin tarjeta, sin vencimiento |
| `PRO` | El cerebro por MCP para todos tus plugins, el CRM, el canvas, y Vibe, Motion, Lens, Feed, Reply y AOS con tu marca | USD 29 al mes por marca |
| Agencia | Varias marcas, cerebro compartido entre marcas e informes por cliente | A definir |

Dos aclaraciones sobre Pro:

- **El precio es por marca.** Si llevas tres marcas con plan Pro, son tres suscripciones.
- **No hay créditos de IA.** Ningún plan del canal de Claude incluye ni vende créditos. Si un producto necesita una llave de un proveedor (por ejemplo, las llaves de IA para medir en AOS o tu cuenta de fal en Motion), la pones tú.

Los colaboradores a quienes le des un asiento en una marca usan el plan del dueño de la marca. No necesitan su propia suscripción.

## Cómo se paga

El pago se hace en la web de Maasy, nunca dentro del chat de Claude.

```figura
<figure class="vx-fig" data-alt="Cuatro pasos para pasar a Pro: Claude te avisa que esa función es de Pro y te da un enlace, abres la sección de planes en la web de Maasy, pagas en el checkout, y vuelves a Claude con tu marca ya habilitada.">
  <div class="vx-head">Pasar a Pro</div>
  <div class="vx-body">
    <div class="vx-flow">
      <div class="vx-node">Claude te avisa<small>"Esto es del plan Pro" y te da el enlace</small></div>
      <div class="vx-node">Abres planes<small>maasy.ai, sección Cuenta y plan</small></div>
      <div class="vx-node vx-key">Pagas tú<small>Checkout de Maasy</small></div>
      <div class="vx-node">Vuelves a Claude<small>Tu marca ya sirve a los plugins</small></div>
    </div>
  </div>
  <figcaption>El cobro lo haces tú, en la web. Claude solo te lleva hasta ahí.</figcaption>
</figure>
```

1. Cuando una función es del plan Pro, Claude te lo dice y te da el enlace a los planes. No intenta cobrarte por su cuenta.
2. Abres **Cuenta y plan** en la web de Maasy y eliges **Mejorar plan**.
3. Pagas en el checkout de Maasy. Nada de tarjetas ni datos de pago pasan por el chat.
4. Vuelves a Claude y sigues. Tu marca ya sirve a tus plugins.

## Cada marca nueva se cobra solo con tu sí

Con el plan Pro, cada marca suma un cobro de USD 29 al mes. Por eso Claude nunca crea una marca de pago sin preguntarte antes.

```figura
<figure class="vx-fig" data-alt="Cinco pasos. Claude pide crear la marca. Maasy responde con una cotización: el monto mensual y el prorrateo de hoy, válida 10 minutos. Claude te la muestra en una tarjeta. Tú dices sí o no. Solo con el sí se crea la marca y se cobra.">
  <div class="vx-head">Crear una marca en el plan Pro</div>
  <div class="vx-body">
    <div class="vx-flow">
      <div class="vx-node">Claude pide crear la marca<small>Todavía no se crea nada</small></div>
      <div class="vx-node">Maasy cotiza<small>Monto mensual y prorrateo de hoy. Vale 10 minutos</small></div>
      <div class="vx-node">Tarjeta en el chat<small>Claude te la muestra tal cual</small></div>
      <div class="vx-node vx-key">Tú decides<small>Sí, agregarla, o No por ahora</small></div>
      <div class="vx-node">Se crea y se cobra<small>Solo con esa cotización</small></div>
    </div>
  </div>
  <figcaption>Sin tu sí a una cotización vigente no se crea la marca ni se cobra nada.</figcaption>
</figure>
```

- La cotización te dice cuánto cuesta la marca por mes, cuánto se suma hoy por lo que queda del período (prorrateo, en tu próxima factura) y cuánto pagarás por mes con todas tus marcas.
- Vale **10 minutos** y se usa una sola vez. Si vence, o si cambió algo (el monto, el nombre de la marca o tu suscripción), Claude pide otra y vuelve a preguntarte.
- Si el cobro falla en Stripe, la marca no se crea.
- Claude no puede responder el sí por ti.

## Borrar una marca

Hay tres casos.

- **Marca del plan gratis, creada desde Claude:** `/maasy:borrar`, con el nombre escrito por ti. Libera tu cupo al instante (capítulo 3).
- **Marca del plan Pro:** la puede borrar solo su dueño, y pide la misma confirmación por tarjeta. Antes de borrar, Maasy te dice qué se borra y cuánto baja tu factura, con el prorrateo a favor de hoy. La confirmación vale 10 minutos. Con tu sí, la marca deja de verse en todas partes y la factura baja en el acto. Sus datos, archivos, conversaciones, contactos y plantillas se eliminan del todo a los 30 días. Hasta entonces, soporte puede restaurarla.
- **Cualquier otra marca** (compartida con otras personas, operada por Believe): desde la web de Maasy.

El borrado se frena con un aviso si la marca tiene algo vivo: publicaciones o posts programados, redes conectadas, campañas o automatizaciones activas, landings o artículos publicados, o pagos pendientes de la red de anuncios que hay que cobrar antes. Primero resuelves eso y después borras.

## Cancelar tu plan Pro

Se cancela desde el portal de pagos de Stripe, el mismo donde ves tus facturas.

1. Abres el portal de pagos de Stripe de tu suscripción y eliges cancelar.
2. La cancelación vale **al final del período que ya pagaste**. No hay prorrateo ni reembolso de lo que queda.
3. Sigues con Pro hasta que termina ese período.
4. Después, tus marcas vuelven al plan gratis **sin perder datos**. Las que pasen del cupo gratis (una marca) se siguen usando, pero no puedes crear marcas nuevas hasta volver a Pro.

Lo que se apaga al volver al plan gratis es lo que es de Pro: el cerebro para los plugins, el CRM y el canvas.

## Preguntas frecuentes

**¿Por qué no hay créditos?** Porque la IA es la de tu Claude. Pagas a Anthropic por tu modelo y a Maasy por el servicio.

**¿Qué plan necesito para probar?** Ninguno. La entrevista, el ADN y la vista de tu marca son gratis y no vencen.

**¿Qué pasa con los clientes de la web de Maasy de antes?** Siguen con sus planes y sus créditos en la web. Este capítulo es para quien llega desde Claude.

**¿Y si soy agencia?** El plan de Agencia todavía no tiene precio ni fecha.
