---
name: importar-repo
description: >-
  Trae a Believable un proyecto que ya existe en Git o en Lovable: lo clona, lo deja corriendo igual y lo adapta al
  template v2. Úsalo cuando la persona pegue la URL de un repositorio, diga "importa mi proyecto de Lovable",
  "tengo el código en GitHub" o "quiero seguir este proyecto con Believable".
---

# Importar desde Git o Lovable

Este skill es el esqueleto. Los pasos los entrega el servidor de Believable tras el login.

1. Llama `vibe_modo` con `modo` = `importar` y sigue lo que diga. Sin sesión, `vibe_login` primero.
2. La tool del modo es `vibe_importar`: clona con el acceso a git de este equipo, detecta Lovable, instala
   dependencias y deja `.claude/launch.json` para el preview. No hace commit: el repositorio es de la persona.
