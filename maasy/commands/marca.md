---
description: "Abre una marca: su carpeta, lo que ya hay en tu Canvas y qué mover ahora / Open a brand: its folder, your Canvas and what to do next"
argument-hint: "[marca]"
allowed-tools: mcp__plugin_maasy_maasy__authenticate, mcp__plugin_maasy_maasy__maasy_list_brands, mcp__plugin_maasy_maasy__maasy_get_brand_context, mcp__plugin_maasy_maasy__maasy_canvas_list, mcp__plugin_maasy_maasy__maasy_get_recipe, mcp__claude_ai_Maasy_MCP__*, mcp__claude_ai_Maasy__*, AskUserQuestion, Read, Write, Edit, Bash(pwd), Bash(ls:*), Bash(mkdir -p:*), Bash(git init:*)
---

Abres una marca de Maasy para trabajar con ella en esta sesión. Conversa en el idioma de la persona. El ADN, el método y lo que hay en el Canvas llegan del servidor de Maasy: no los inventes.

Las tools de Maasy llegan por el servidor del plugin (`mcp__plugin_maasy_maasy__*`) o por el conector de Maasy de tu cuenta de Claude (`mcp__claude_ai_Maasy_MCP__*`): cuando el conector apunta a la misma URL, Claude Code descarta el del plugin y deja el del conector. Es la misma cuenta: usa el que exista y no importa el prefijo. Si aparecen tools `maasy_*` bajo otro nombre de servidor, no las uses sin preguntar. Si Claude Code pide permiso para una tool de Maasy, es lo normal cuando viene del conector: pídeselo a la persona y sigue cuando lo dé.

1. **Sesión.** Llama `maasy_list_brands`. Si Maasy no está conectado, llama `authenticate` del servidor de Maasy (el del plugin o el del conector, el que exista) y dile a la persona que termine en el navegador; si no hay esa tool, que escriba `/mcp`, elija el servidor de Maasy (se llama maasy o Maasy MCP, según si viene del plugin o de tu cuenta) y "Authenticate", y vuelva a escribir `/maasy:marca`. Sin sesión no sigas. Si la cuenta no tiene marcas, dilo y manda a `/maasy:start`.
2. **Cuál marca.** En este orden, sin preguntar de más: la que nombre "$ARGUMENTS"; si no, la de la carpeta actual (mira `pwd`: si estás en `~/Maasy/<carpeta>/` o más adentro y su `CLAUDE.md` trae una línea `maasy_project_id:`, es esa); si la cuenta tiene una sola, esa; si no, pregunta con `AskUserQuestion`.
3. **Su carpeta.** Solo si tienes herramientas de archivos (si no, salta al paso 4 y aplica el paso 7). La carpeta es `~/Maasy/<nombre-de-la-marca-en-minúsculas-con-guiones>/`. Si ya existe con su `CLAUDE.md`, léelo y sigue. Si no existe, pregunta una vez con `AskUserQuestion` si la creas, diciendo la ruta. Solo con un sí:
   - `mkdir -p` de la carpeta. Si `~/Maasy/` no es un repositorio, `git init` ahí: es local, sin remoto, para tener historial.
   - Si falta `~/Maasy/CLAUDE.md`, escríbelo con tres líneas: cada carpeta es una marca de Maasy; abre la sesión dentro de la carpeta de la marca con la que vas a trabajar; `/maasy:marca` la pone al día.
   - Si falta `~/Maasy/.gitignore`, escríbelo con `*.mp4`, `*.mov`, `*.wav`, `node_modules/` y `dist/`.
   - Escribe el `CLAUDE.md` de la marca con esta forma y nada más:
     ```
     # <Nombre de la marca> · Maasy en Claude
     maasy_project_id: <id de la marca>

     ## Cómo trabajar aquí
     - El ADN y el cerebro de la marca se piden a Maasy cada vez (`maasy_get_brand_context`). Aquí no hay copia.
     - El método llega de Maasy cuando se va a usar (`maasy_get_recipe`). No se guarda en archivos.
     - Cada pieza se muestra primero y va al Canvas solo con un sí. Aprobar y descartar los hace la persona en la web.

     ## Preferencias
     (lo que la persona pida recordar sobre cómo le gusta trabajar)

     ## Bitácora
     (fecha · qué se hizo · referencia · enlace al Canvas · veredicto y motivo)
     ```
   Si dice que no, no crees nada y no vuelvas a preguntar en esta sesión.
   En esa carpeta nunca escribas: el método o las recetas, una copia del ADN, llaves o tokens, ni datos de clientes finales (contactos, leads, conversaciones).
4. **Lo que hay.** Llama `maasy_get_brand_context` de esa marca y `maasy_canvas_list` con `status: "all"`. Si hay carpeta, pon al día la Bitácora con lo que cambió desde la última vez: piezas nuevas y, de las ya anotadas, su veredicto con el motivo que escribió la persona. Una línea por pieza.
5. **Saludo.** Breve, como alguien que ya conoce la marca:
   - una línea con el nombre de la marca;
   - una frase con lo que ya hay: cuántas piezas esperan su decisión, qué aprobó hace poco y, si descartó algo, por qué;
   - tres o cuatro movimientos concretos para hoy, elegidos por lo que falta. Sácalos del índice que devuelve `maasy_get_recipe` sin argumentos y dilos con palabras de negocio, no con el nombre del comando;
   - cierra con "Dime cuál y arranco." y espera.
   No ejecutes nada por tu cuenta. Si `maasy_get_recipe` no existe todavía, propón con lo que sepas de la marca y dilo sin tecnicismos.
6. **Mientras trabajan.** Cuando la persona elija algo, pide su receta con `maasy_get_recipe` y síguela. Puedes sugerir un paso que mejore la pieza (por ejemplo, medirla antes de publicarla): una sugerencia por pieza, en una línea, y si dice que no, no la repitas en esta sesión. Si pide que no se lo vuelvas a sugerir, anótalo en Preferencias. Al terminar cada pieza, suma su línea a la Bitácora.
7. **Dónde está todo el poder.** Si en esta sesión no tienes herramientas de archivos ni el panel de Maasy, dilo una sola vez, sin insistir: "Aquí puedes pedir piezas y dejarlas en tu Canvas. El panel con pestañas, la carpeta de tu marca y Motion, Lens y Vibe están en la pestaña Code de la app de Claude."
