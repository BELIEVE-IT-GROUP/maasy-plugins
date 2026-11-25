#!/bin/sh
# Arranca el servidor MCP del plugin con un Node 20+ de la máquina.
# Por qué Node del sistema y no un binario: docs/specs/plugin-claude-code/spike-runtime.md.
# Claude Code no trae Node propio y la app de escritorio no hereda el PATH de la terminal, así que
# además del PATH se miran las rutas típicas de Homebrew, Volta, asdf y nvm.
here=$(dirname "$0")
for n in $(command -v node) /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.volta/bin/node" \
  "$HOME/.asdf/shims/node" "$HOME"/.nvm/versions/node/*/bin/node; do
  [ -x "$n" ] || continue
  v=$("$n" --version 2>/dev/null); v=${v#v}; v=${v%%.*}
  [ "${v:-0}" -ge 20 ] 2>/dev/null || continue
  [ "$1" = "--check" ] && exit 0
  # La ruta tal como se encontró (/opt/homebrew/bin/node), no la real del Cellar: launch.json la guarda.
  BELIEVABLE_NODE="$n" exec "$n" "$here/index.js"
done
msg="El plugin maasy-vibe necesita Node 20 o más nuevo y no lo encontró: sus herramientas no van a estar. Dile a la persona que instale Node (https://nodejs.org) y reinicie Claude Code."
# --check lo usa el hook SessionStart: lo que imprime entra al contexto, así el modelo sabe por qué falta el servidor
# (Claude Code solo muestra CONNECTION_CLOSED).
[ "$1" = "--check" ] && { echo "$msg"; exit 0; }
echo "$msg" >&2
exit 1
