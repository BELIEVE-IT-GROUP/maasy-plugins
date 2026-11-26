---
description: Revisa que Maasy Lens esté instalado en este Mac y lo instala si falta
allowed-tools: mcp__plugin_maasy-lens_belens__estado
---

1. Llama `estado`. Si responde, muestra una línea por parte (yt-dlp, ffmpeg, whisper, deno, modelo, OCR de Apple y una muestra de TikTok, YouTube e Instagram) con "listo" o lo que falló. Si una muestra falla y lo demás está listo, lo más probable es que la red cambió algo: dilo así.
2. Si la tool no existe o el servidor no arranca, Lens no está instalado. Explica qué hace el instalador antes de correrlo:
   - Instala en `~/.maasy-lens`: uv, Python 3.12, las dependencias de Python, BeLens, el modelo de whisper (547 MB) y, en Mac con Apple Silicon, whisper-cli, deno, ffmpeg y ffprobe (unos 95 MB).
   - Cada archivo se verifica por sha256 antes de usarse; si uno no coincide, se detiene sin instalar nada.
   - En un Mac Intel no baja whisper-cli, deno ni ffmpeg: si faltan, dice cómo instalarlos (`brew install ffmpeg whisper-cpp deno`).
   - Lens nunca lee cookies ni sesiones de ninguna red.
3. Si la persona acepta, corre con Bash `"${CLAUDE_PLUGIN_ROOT}/bin/instalar"` y muestra cómo terminó. Si salió con código 2, muestra lo que falta y para.
4. Al terminar, pide primero `/mcp` → `belens` → Reconectar. Reiniciar Claude no alcanza: guarda el fallo de conexión en caché durante 15 minutos. Después de reconectar, vuelve al paso 1.
