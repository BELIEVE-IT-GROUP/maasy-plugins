---
name: desde-diseno
description: >-
  Construye una app de Believable a partir de un diseño de Figma o Penpot, o de una imagen o un SVG exportado.
  Úsalo cuando la persona diga "tengo el diseño en Figma", "pásalo de Penpot", "constrúyelo como este frame",
  pegue un enlace de figma.com o de Penpot, o deje una captura del diseño en la carpeta.
---

# Desde un diseño

Este skill es el esqueleto. Los pasos los entrega el servidor de Believable tras el login.

1. Llama `vibe_modo` con `modo` = `diseno` y sigue lo que diga. Sin sesión, `vibe_login` primero.
2. Las tools del modo: `vibe_diseno_token` (conecta Figma o Penpot en una página local del navegador) y
   `vibe_diseno` (lee el diseño con sus colores, tipografías e imagen).
3. El token de Figma y la contraseña de Penpot nunca se piden ni se escriben en el chat: van al llavero del equipo
   desde la página local.
