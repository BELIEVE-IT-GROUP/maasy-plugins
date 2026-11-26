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

1. Cuando una función es del plan Pro, Claude te lo dice y te da el enlace a los planes. No intenta cobrarte ni lo hace por su cuenta.
2. Abres **Cuenta y plan** en la web de Maasy y eliges **Mejorar plan**.
3. Pagas en el checkout de Maasy. Nada de tarjetas ni datos de pago pasan por el chat.
4. Vuelves a Claude y sigues. Tu marca ya sirve a tus plugins.

> **Pendiente de confirmar con el equipo:** la pantalla exacta de confirmación con tarjeta antes del primer cobro no está descrita en los documentos de diseño que respaldan este manual. Se completa cuando esté en producción.

## Cuántas marcas

El cupo de marcas depende del plan. El plan gratis tiene una. Cuando intentas crear una más allá de tu cupo, Claude muestra el mensaje del servidor y el enlace a los planes. No se cobra nada ni se crea nada hasta que subes de plan.

## Borrar una marca

Hay dos maneras, según el caso.

- **Marca del plan gratis, creada desde Claude:** `/maasy:borrar`. Libera tu cupo al instante (ver capítulo 3).
- **Cualquier otra marca:** desde la web de Maasy.

Como el plan Pro es por marca, el cobro sigue a las marcas que tienes. Cómo se refleja un borrado en la factura (si se prorratea y desde qué fecha) todavía no está definido en los documentos de diseño.

## Cancelar o dejar de pagar

> **Pendiente de confirmar con el equipo:** qué pasa exactamente al cancelar un plan Pro (fecha de corte, qué se apaga y qué pasa con las marcas que superen el cupo gratis) no está definido en los documentos que respaldan este manual.

## Preguntas frecuentes

**¿Por qué no hay créditos?** Porque la IA es la de tu Claude. Pagas a Anthropic por tu modelo y a Maasy por el servicio.

**¿Qué plan necesito para probar?** Ninguno. La entrevista, el ADN y la vista de tu marca son gratis y no vencen.

**¿Qué pasa con los clientes de la web de Maasy de antes?** Siguen con sus planes y sus créditos en la web. Este capítulo es para quien llega desde Claude.

**¿Y si soy agencia?** El plan de Agencia todavía no tiene precio ni fecha.
