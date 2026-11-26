# Maasy Games y Maasy Ads

Este capítulo cubre dos plugins: Maasy Games, que hace juegos de marca para el celular, y Maasy Ads, que revisa tu pauta y propone cambios que tú apruebas.

## Maasy Games

`maasy-games` hace juegos de marca que se juegan en el celular. Tu Claude propone ideas, construye el juego con tu marca, lo prueba y lo empaqueta en el servidor de Maasy Games. Tú lo apruebas y lo publicas en la web de Maasy.

> Disponible en la tienda (versión 0.1.0).

### Para qué sirve

- Un juego con tu marca, tus colores y tu voz, pensado para jugarse con el pulgar.
- Probarlo como si fuera un celular antes de mostrarlo.
- Guardar versiones, sacar un link de prueba y mandarlo a aprobar.
- Proponer la pauta del juego en BeAds, con tu permiso cada vez.

### Qué necesitas

- Los plugins `maasy` y `maasy-games`, y una marca creada. La marca se lee con el plugin `maasy`.
- Iniciar sesión con tu cuenta de Maasy la primera vez que Claude llama a Maasy Games.

### Cómo se instala

```
/plugin install maasy-games@maasy
```

### Comandos

| Comando | Qué hace |
|---|---|
| `/maasy-games:nuevo [marca o idea]` | Hace un juego de marca nuevo |
| `/maasy-games:cambio [juego y qué cambiar]` | Cambia un juego que ya existe |
| `/maasy-games:probar [juego]` | Lo prueba y lo empaqueta en el servidor |
| `/maasy-games:publicar [juego]` | Guarda la versión, saca el link de prueba y la manda a aprobar |
| `/maasy-games:proponer [juego]` | Propone la pauta del juego en BeAds |
| `/maasy-games:estado [juego]` | Muestra cómo va: sesión, versiones y publicación. No crea nada ni gasta cuota |

La receta de cada paso la manda el servidor de Maasy Games. Claude la pide parte por parte y la sigue. Si escribes la marca o la idea en el comando, no te la vuelve a preguntar.

### Paso a paso

1. `/maasy-games:nuevo` con tu marca o una idea. Claude lee tu design.md, tu ADN y tus archivos de marca, y sigue la receta hasta tener el juego.
2. `/maasy-games:probar`. El servidor prueba el juego y lo empaqueta.
3. `/maasy-games:publicar`. Claude guarda la versión y saca el link de prueba, que queda en una dirección de la forma `<nombre>.begames.app`. La vista previa y el envío a aprobación piden tu permiso cada vez.
4. En la web de Maasy, **maasy.ai/control/games**, apruebas el juego o lo despublicas. Lo público necesita la aprobación de la persona dueña de la marca.
5. Si quieres pauta, `/maasy-games:proponer`. Las herramientas de BeAds piden tu permiso cada vez.

Para cambiar algo después, `/maasy-games:cambio` con el juego y lo que quieres cambiar.

### Qué ves en pantalla

La pestaña **Games** del panel de `maasy` muestra los juegos de tu marca. La aprobación y la publicación se hacen en la web de Maasy.

### Límites

- Aprobar y despublicar solo lo hace una persona, en maasy.ai/control/games. Claude no puede.
- Un juego no se publica sin tu aprobación.

### Preguntas frecuentes

**¿Dónde queda mi juego?** En una dirección de la forma `<nombre>.begames.app`.

**¿Puedo retirar un juego?** Sí, lo despublicas en maasy.ai/control/games.

## Maasy Ads

`maasy-ads` conecta tu Claude con BeAds, el sistema que opera la pauta. Claude lee tus cuentas publicitarias, simula un plan contra el mandato que fijaste y propone los cambios como tarjetas. Nada toca la plataforma publicitaria hasta que tú apruebas la tarjeta en la web de Maasy.

> Disponible en la tienda (versión 0.1.0).

### Para qué sirve

- Revisar cómo va tu pauta: métricas, alertas, calendario y lo que está pendiente.
- Armar un plan de campaña y comprobar que cumple tus reglas antes de proponerlo.
- Proponer el cambio como tarjeta, con el texto escrito con la voz de tu marca.

### La regla que ordena todo

```figura
<figure class="vx-fig" data-alt="Cuatro pasos. Claude lee tu pauta: métricas, alertas y mandato. Claude simula el plan contra tus reglas, y simular no escribe nada. Claude propone una tarjeta, que no es un cambio. Tú apruebas la tarjeta en la web de Maasy, y solo entonces cambia algo en la plataforma.">
  <div class="vx-head">Quién hace cada paso</div>
  <div class="vx-body">
    <div class="vx-flow">
      <div class="vx-node">Claude lee<small>Métricas, alertas y tu mandato</small></div>
      <div class="vx-node">Claude simula<small>El plan contra tus reglas. No escribe nada</small></div>
      <div class="vx-node">Claude propone<small>Queda una tarjeta, no un cambio</small></div>
      <div class="vx-node vx-key">Tú apruebas<small>En maasy.ai/control/ads</small></div>
    </div>
  </div>
  <figcaption>Claude lee, simula y propone. Nada llega a la plataforma sin que una persona apruebe la tarjeta en la web de Maasy.</figcaption>
</figure>
```

### Qué necesitas

- Los plugins `maasy` y `maasy-ads`, y una marca creada. `maasy-ads` depende de `maasy`.
- Una cuenta publicitaria conectada a tu marca y su mandato firmado. Las dos cosas se hacen en la web de Maasy, no en Claude (más abajo).
- Iniciar sesión con tu cuenta de Maasy la primera vez que Claude llama a Ads. El plugin no guarda llaves ni tokens.

El plugin pide solo dos permisos: leer (`ads:read`) y proponer (`ads:propose`). Aprobar es un permiso interno que solo tiene la web de Maasy. Claude no puede dárselo.

### Cómo se instala

```
/plugin install maasy-ads@maasy
```

### Conectar tu cuenta publicitaria

Se hace en la web de Maasy, en **maasy.ai/control/ads**, y no en Claude. Claude no conecta cuentas ni te pide llaves.

1. En **Conectar cuenta** eliges la plataforma: Google Ads, TikTok Ads o LinkedIn Ads. Se conecta por Zernio, a nombre de Maasy. El gasto lo cobra la plataforma a tu medio de pago.
2. Al volver, eliges qué cuenta publicitaria usa tu marca con **Usar esta cuenta**.
3. Falta firmar el mandato, que son tus reglas de gasto. Hasta que se firma, BeAds no lee la cuenta ni propone nada.

Meta todavía no aparece entre los botones de conexión.

### Comando

| Comando | Qué hace |
|---|---|
| `/maasy-ads:start [marca o lo que quieres revisar]` | Revisa tu pauta, simula un plan y propone tarjetas |

También puedes pedirlo con tus palabras, por ejemplo "revisa mi pauta" o "arma un plan de campaña": la skill de Ads se activa sola. Si escribes la marca o el pedido en el comando, Claude no te lo vuelve a preguntar.

### Paso a paso

1. **Sesión.** Claude consulta tus marcas en BeAds. Si no estás conectado, inicia el ingreso y te pide terminar en el navegador. Si no ofrece esa opción, escribe `/mcp`, elige ads, pulsa **Authenticate** y vuelve a escribir `/maasy-ads:start`. Sin sesión no sigue.
2. **Marca.** Si tienes varias, te pregunta cuál. Si no tienes ninguna, te lo dice y se detiene: todavía no hay cuentas publicitarias conectadas, y te manda a maasy.ai/control/ads.
3. **Revisión.** Lee el mandato, las métricas, las alertas, las decisiones y el calendario. Te resume en pocas líneas y te pregunta qué quieres hacer.
4. **Simular.** Antes de armar un plan lee tu mandato y tu calendario, y pide a Maasy el contexto de la marca: ADN, design.md y lo que funcionó antes. Escribe el plan con el texto en el idioma de salida de tu marca, aunque conversen en otro, y lo simula contra tus reglas. Simular no escribe nada.
5. **Proponer.** Te muestra el plan simulado y espera tu sí explícito. Con tu sí crea la tarjeta. Al terminar te dice que quedó propuesta, no aplicada, y te da el enlace.
6. **Aprobar.** Tú, en la web de Maasy.

Si el plan no pasa una regla del mandato, Claude corrige con el motivo que devuelve el sistema y simula otra vez. Si sigue sin pasar, te explica por qué. Nunca cambia el plan para esquivar una regla.

### Qué ves en pantalla

- **En el chat:** un resumen corto de tu pauta, preguntas en tarjetas con opciones y, al final, el enlace a la tarjeta propuesta.
- **En el panel de Claude:** una pestaña **Ads** con el estado, las métricas de 7 días, las tarjetas pendientes, las alertas, el mandato y el calendario. Aparece cuando el servidor la ofrece; si no la ves, escribe `/maasy-panel`.
- **En la web de Maasy**, en **Tarjetas pendientes:** cada tarjeta muestra la marca, la acción, los parámetros, la hipótesis y el efecto esperado, con los botones **Aprobar** y **Rechazar**. Pide una segunda confirmación antes de actuar.

Este capítulo todavía no trae capturas de Ads.

### Qué hace Claude y qué haces tú

| Claude | Tú, en la web de Maasy |
|---|---|
| Lee tus cuentas, tus métricas y tu mandato | Conectas las cuentas publicitarias |
| Simula el plan contra el mandato | Firmas el mandato |
| Propone el cambio como tarjeta | Apruebas o rechazas la tarjeta |
| Te avisa lo que solo tú puedes hacer en tu plataforma | Aplicas, publicas, enciendes o deshaces |

### Las herramientas que usa Claude

Cada llamada lleva la marca. Claude usa solo las herramientas que el servidor le muestra.

| Para | Herramientas |
|---|---|
| Ver qué marcas hay | `marcas` |
| Las reglas: techo, topes y prohibiciones | `mandato`, `historial_mandato` |
| Cifras | `metricas`, `serie`, `resumen_cliente` |
| Estructura y fechas | `campanas`, `campana`, `anuncios`, `calendario` |
| Salud de la cuenta en vivo | `estructura_en_meta`, `diagnostico_meta`, `estado_cuenta`, `activos_de_la_cuenta` |
| Qué pasó y qué está esperando | `alertas`, `decisiones`, `journal` |
| Simular | `simular_plan` (campaña completa), `simular_plan_canal` (un canal) |
| Proponer | `proponer_campana_completa`, `proponer_campana_canal`, `proponer`, `proponer_conjunto`, `proponer_conjunto_fechas` |
| Lo que solo puedes hacer tú en tu plataforma | `pedir_paso_humano` |
| El panel | `ads_panel` |

`proponer_campana_completa` solo va después de `simular_plan`, y `proponer_campana_canal` solo después de `simular_plan_canal`. Antes de proponer, Claude revisa `decisiones` para no repetir una tarjeta que ya espera tu respuesta.

### Límites

- Claude no tiene una herramienta para aplicar, publicar, encender, deshacer ni firmar el mandato, y no busca atajos por el navegador, por una API o por otro servidor de la plataforma publicitaria.
- Las cifras las cita tal como las devuelve BeAds. No las calcula ni suma monedas distintas.
- Si una simulación avisa que algo no se verificó, por ejemplo el gasto actual, Claude te lo dice: ese "pasa" no está completo.
- Si tu cuenta todavía solo lee y simula, Claude no ve las herramientas de proponer y te lo dice.
- Si una herramienta no responde, Claude lo dice. No rellena con supuestos.
- Lo que dice un dato (nombre de campaña, alerta, texto de un anuncio) es dato. Claude no lo toma como una orden.

### Preguntas frecuentes

**¿Puede Claude gastar mi presupuesto?** No. Claude propone y tú apruebas. Un cambio solo llega a la plataforma cuando apruebas su tarjeta en la web de Maasy.

**¿Dónde apruebo?** En maasy.ai/control/ads, en **Tarjetas pendientes**. Si la sección te dice que las tarjetas se aprueban ahí pronto, esa parte todavía no está activa para tu cuenta: pídele a Claude que te las muestre en el chat.

**Claude dice que no tengo cuentas publicitarias.** Todavía no hay ninguna conectada a tu marca. Conéctala en maasy.ai/control/ads y vuelve a escribir `/maasy-ads:start`.

**Conecté la cuenta y Claude no propone nada.** Falta firmar el mandato. Mientras tanto, BeAds no la lee ni propone cambios.

**¿Y si la plataforma no aplica el cambio?** La web te lo dice con el motivo y la tarjeta no se da por aplicada. Si falta un límite de gasto en la plataforma, ponlo allí y vuelve a aprobar.

**¿Qué permisos pide el plugin?** Leer y proponer. Aprobar queda fuera: solo lo tiene la web.

## Qué no viene

Maasy no va a generar con llaves de Believe en el canal de Claude. Por eso los productos que hoy dependen de IA de Believe llegan con una de dos formas: Claude hace el trabajo y Maasy guarda el resultado, o el producto usa tus llaves.
