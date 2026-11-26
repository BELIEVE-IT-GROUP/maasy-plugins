# Maasy Games y lo que viene

`maasy-games` hace juegos de marca que se juegan en el celular. Tu Claude propone ideas, construye el juego con tu marca, lo prueba y lo empaqueta en el servidor de Maasy Games. Tú lo apruebas y lo publicas en la web de Maasy.

> Disponible en la tienda (versión 0.1.0).

## Para qué sirve

- Un juego con tu marca, tus colores y tu voz, pensado para jugarse con el pulgar.
- Probarlo como si fuera un celular antes de mostrarlo.
- Guardar versiones, sacar un link de prueba y mandarlo a aprobar.
- Proponer la pauta del juego en BeAds, con tu permiso cada vez.

## Qué necesitas

- Los plugins `maasy` y `maasy-games`, y una marca creada. La marca se lee con el plugin `maasy`.
- Iniciar sesión con tu cuenta de Maasy la primera vez que Claude llama a Maasy Games.

## Cómo se instala

```
/plugin install maasy-games@maasy
```

## Comandos

| Comando | Qué hace |
|---|---|
| `/maasy-games:nuevo [marca o idea]` | Hace un juego de marca nuevo |
| `/maasy-games:cambio [juego y qué cambiar]` | Cambia un juego que ya existe |
| `/maasy-games:probar [juego]` | Lo prueba y lo empaqueta en el servidor |
| `/maasy-games:publicar [juego]` | Guarda la versión, saca el link de prueba y la manda a aprobar |
| `/maasy-games:proponer [juego]` | Propone la pauta del juego en BeAds |
| `/maasy-games:estado [juego]` | Muestra cómo va: sesión, versiones y publicación. No crea nada ni gasta cuota |

La receta de cada paso la manda el servidor de Maasy Games. Claude la pide parte por parte y la sigue. Si escribes la marca o la idea en el comando, no te la vuelve a preguntar.

## Paso a paso

1. `/maasy-games:nuevo` con tu marca o una idea. Claude lee tu design.md, tu ADN y tus archivos de marca, y sigue la receta hasta tener el juego.
2. `/maasy-games:probar`. El servidor prueba el juego y lo empaqueta.
3. `/maasy-games:publicar`. Claude guarda la versión y saca el link de prueba, que queda en una dirección de la forma `<nombre>.begames.app`. La vista previa y el envío a aprobación piden tu permiso cada vez.
4. En la web de Maasy, **maasy.ai/control/games**, apruebas el juego o lo despublicas. Lo público necesita la aprobación de la persona dueña de la marca.
5. Si quieres pauta, `/maasy-games:proponer`. Las herramientas de BeAds piden tu permiso cada vez.

Para cambiar algo después, `/maasy-games:cambio` con el juego y lo que quieres cambiar.

## Qué ves en pantalla

La pestaña **Games** del panel de `maasy` muestra los juegos de tu marca. La aprobación y la publicación se hacen en la web de Maasy.

## Límites

- Aprobar y despublicar solo lo hace una persona, en maasy.ai/control/games. Claude no puede.
- Un juego no se publica sin tu aprobación.

## Preguntas frecuentes

**¿Dónde queda mi juego?** En una dirección de la forma `<nombre>.begames.app`.

**¿Puedo retirar un juego?** Sí, lo despublicas en maasy.ai/control/games.

## Lo que viene

### Maasy Ads

`PRÓXIMAMENTE`. Campañas de pauta con tu cerebro de marca. Tu Claude lee tus cuentas, simula un plan contra el mandato que fijaste y propone cambios como tarjetas. Tú las apruebas en la web de Maasy, y solo tú. Ni el plugin ni Believe pueden aprobar un gasto.

- Cuentas de Google, LinkedIn y TikTok, conectadas por Zernio. Meta entra después, cuando pase su prueba de paridad.
- Todo cambio es una tarjeta que espera tu aprobación. Lo aprobado corre una sola vez, en pausa, con su reverso guardado.
- Se puede deshacer durante 7 días.
- El costo de la conexión con Zernio se traslada al plan. Los números se definen al lanzar.
- El plugin pide solo permisos de lectura y de propuesta. Conectar una cuenta y aprobar se hacen en la web de Maasy.

### Qué no viene

Maasy no va a generar con llaves de Believe en el canal de Claude. Por eso los productos que hoy dependen de IA de Believe llegan con una de dos formas: Claude hace el trabajo y Maasy guarda el resultado, o el producto usa tus llaves.
