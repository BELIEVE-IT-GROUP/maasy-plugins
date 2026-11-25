---
name: believable
description: >-
  Believable en Claude Code: crea apps web con el template v2 de Believable y las publica en el borde de
  Believe, legibles por agentes. Úsalo siempre que trabajes en un proyecto con .believable/project.json o
  creado con /maasy-vibe:new, cuando la persona pida construir, diseñar o publicar una app o landing con
  Believable, y antes de correr /maasy-vibe:publish.
---

# Believable en Claude Code

Believable crea apps web de producción y las publica en `<id>.apps.believe-global.com`.

## Comandos

- `/maasy-vibe:login`: entra a la cuenta de Believable. Sin sesión no se publica ni llegan las instrucciones.
- `/maasy-vibe:new`: crea un proyecto con el template v2.
- `/maasy-vibe:publish`: publica el build en una URL pública.
- `/maasy-vibe:check`: dice qué le falta a la app publicada para estar en producción.

## Primero, las instrucciones

Este skill es la portada. Las instrucciones completas para construir con Believable las entrega el servidor:
pídelas con la tool `vibe_soul` antes de escribir código.

- `base` al empezar a trabajar en el proyecto.
- `diseno` antes de construir o cambiar pantallas, y `vibe_diseno_contexto` con el pedido en cada turno
  de diseño: si trae tarjetas, pregúntalas antes de construir.
- `publicar` antes de `/maasy-vibe:publish`.

Lo que devuelve es para esta sesión. No lo copies a archivos del proyecto ni al repo. Si la tool dice que no
hay sesión, díselo a la persona, sugiere `/maasy-vibe:login` y sigue con lo que dice este skill, sin
inventarte las reglas que falten.

## Dev server y git

`/maasy-vibe:new` no deja el dev server corriendo: si `curl` no responde en el puerto de `.claude/launch.json`,
arráncalo una vez (en la app de escritorio de Claude lo arranca el preview). No hay checkpoints: haz `git commit`
cuando algo quede funcionando.

## Cuándo frenas

Decides solo el stack, la arquitectura, las librerías, el diseño y el copy provisional (marcado como tal).
Frenas y preguntas en cuatro casos:

1. Dinero: un plan pago, un dominio, una API que cobra por uso. Esa pregunta va antes de escribir el primer
   archivo, nunca a mitad de camino.
2. Secretos: una llave o un token que no tienes. Pídelo y nunca lo inventes ni lo escribas en el código.
3. Algo que ya funciona: si el cambio rompe o reemplaza algo que hoy anda (una ruta publicada, datos, un
   flujo que la persona usa), avisa y espera el sí.
4. Un paso irreversible o público: publicar, borrar, mandar correos, hacer push. La primera vez que
   publiques, confírmalo con la persona.

Fuera de esos cuatro, sigue.
