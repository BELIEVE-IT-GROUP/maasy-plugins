# Maasy Feed: tu Instagram orgánico

`maasy-feed` planea tu semana de Instagram y escribe las piezas con tu voz de marca. Claude propone cada pieza como borrador; el servidor revisa que cumpla tu voz; tú apruebas y programas desde la web de Maasy.

> `PRÓXIMAMENTE`. El diseño está aprobado y el plugin todavía no está en la tienda. Este capítulo describe cómo va a funcionar.

## Para qué sirve

- Armar el plan de una semana: qué publicar cada día, en qué formato y con qué gancho.
- Escribir las piezas (reels, carruseles, imágenes e historias) con el método de contenido y tu voz.
- Revisar cada pieza con un chequeo de voz que hace el servidor, no Claude.
- Programar y publicar en tu cuenta de Instagram, siempre con tu aprobación.
- Aprender de cada semana: lo que apruebas y lo que descartas vuelve a tu cerebro.

## Cómo se instalará

```
/plugin install maasy-feed@maasy
```

Necesita `maasy` con una marca creada y el plan Pro. La cuenta de Instagram se conecta en la web de Maasy.

## Paso a paso

**1. Planear la semana.** `/maasy-feed:semana` y el tema: `/maasy-feed:semana armemos la semana del 30 de noviembre`. Antes de escribir, Claude lee el método de contenido, el cierre de la semana anterior, tu marca y tus métricas de los últimos 28 días. Te cuenta qué repetir y qué soltar.

**2. Elegir qué debe mover la semana.** Una tarjeta te pregunta qué acción importa más: guardados, pedidos de una auditoría, visitas al perfil. Con eso Claude arma la semana.

![Diseño aprobado: Claude arma la semana de ejemplo y la deja como borrador en la pestaña Feed.](img/capturas/feed-semana.png)

**3. Escribir cada pieza.** Claude escribe una pieza y la guarda. El servidor corre el chequeo de voz y devuelve su veredicto: palabras prohibidas de tu marca, rayas en el texto, tono que no corresponde. Si marca algo, Claude lo corrige y lo vuelve a revisar antes de guardar. Claude no puede declarar una pieza "limpia": lo decide el servidor.

**4. Aprobar y programar.** La pieza queda en estado de guion hasta que alguien de tu equipo la aprueba en la web de Maasy. Claude puede proponer horarios; programar y publicar los haces tú.

**5. Cerrar la semana.** El cierre de cada semana queda guardado y Claude lo lee al planear la siguiente.

## Qué herramientas usa Claude

Las que leen contexto (método, cierre de la semana anterior, marca, métricas), las que crean la semana y las piezas, la revisión de voz y la propuesta de horario. Quedan fuera del canal de Claude las que gastan IA de Believe: generar la semana entera, pedir un reel y ver un video con puntaje. Ahí la IA es la tuya.

## Qué ves en pantalla

La pestaña **Feed** del panel muestra la semana en curso: un cuadro con día, formato y pieza, el estado "Borrador de Claude" y el hilo de cada pieza. En la web de Maasy, la sección Feed muestra el calendario y las aprobaciones.

## Límites

- Instagram. Otras redes no están en este plugin.
- Nada se publica ni se programa solo: cada publicación pasa por una persona.
- Para un reel, Feed escribe el guion y la pieza. El video lo produces aparte, por ejemplo con Maasy Motion.
- La conexión con Meta depende de que la cuenta de Instagram esté conectada y vigente en tu sección de conexiones.

## Preguntas frecuentes

**¿Puede Claude publicar por mí?** No. Claude deja borradores. Publicar y programar se hace en la web de Maasy, con tu sesión.

**¿Por qué el servidor revisa mi voz y no Claude?** Porque Claude puede equivocarse al revisarse a sí mismo. El servidor aplica las mismas reglas siempre, con las palabras prohibidas y el tono de tu ADN.

**¿Se conecta con Reply?** Sí. Una pieza puede terminar con una palabra clave (por ejemplo AUDIT) que ya tiene su campaña en Reply (capítulo 13).
