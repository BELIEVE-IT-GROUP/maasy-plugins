---
description: Revisa que Maasy Lens esté instalado en este Mac y lo instala si falta
allowed-tools: mcp__plugin_maasy-lens_belens__estado, AskUserQuestion
---

1. Llama `estado`. Si devuelve las herramientas (yt-dlp, ffmpeg, whisper-cli, deno, modelo, OCR de Apple y una muestra de TikTok, YouTube e Instagram), muestra una línea por parte con "listo" o lo que falló, y termina. Si una muestra falla y lo demás está listo, lo más probable es que la red cambió algo: dilo así.
2. Si `estado` dice que Lens todavía no está instalado, corre con Bash `"${CLAUDE_PLUGIN_ROOT}/bin/instalar" tamaño` y muestra el desglose y el total tal como salen, con el tiempo aproximado. No instales nada en este paso.
3. Pregunta con `AskUserQuestion` si instala ahora. En la tarjeta di, corto: cuánto ocupa en total y que cada archivo se verifica por sha256 antes de usarse, así que si uno solo no coincide no se instala nada. Di también que nunca lee cookies ni sesiones de ninguna red y que en un Mac Intel los binarios salen de Homebrew (`brew install ffmpeg whisper-cpp deno`). Opciones: "Instalar" y "Ahora no".
4. Si dice "Ahora no", termina sin instalar nada.
5. Si acepta, corre con Bash `"${CLAUDE_PLUGIN_ROOT}/bin/instalar" --si` y muestra cómo terminó, con el mensaje final tal como sale. Si salió con código 2, muestra lo que falta de Homebrew y para.
6. No pidas reconectar: mientras faltaba la instalación el servidor MCP ya estaba arriba, y cuando termina le pasa el stdio al de verdad y avisa `tools/list_changed`. Vuelve al paso 1 y llama `estado`. Solo si después de un minuto `estado` sigue diciendo que falta, pide `/mcp`, elige `belens` y Reconectar: Claude guarda el fallo de conexión en caché 15 minutos y ahí no alcanza con reiniciar la conversación.
