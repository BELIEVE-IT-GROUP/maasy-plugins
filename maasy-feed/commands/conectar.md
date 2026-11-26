---
description: Da de alta una marca de Maasy en BeFeed para operarla desde Claude
argument-hint: [marca de Maasy]
---

Vas a conectar una marca de Maasy con BeFeed.

1. Con el servidor `maasy`, busca la marca $ARGUMENTS entre las marcas de la persona y toma su id. Si hay más de una parecida, pregunta cuál.
2. Llama `alta_marca` con `project_id`. Desde Claude no se proponen horas ni se publica: eso lo hace la persona en la web de Maasy. Si la marca ya estaba, esto renueva el permiso.
3. Dile a la persona hasta qué fecha dura el permiso. Si `instagram_conectado` es falso, dile que conecte Instagram en la web de Maasy, con su propio login: tú no puedes hacerlo por ella.

Si `alta_marca` responde que falta acceso o plan pago, explícale eso tal cual y no insistas.
