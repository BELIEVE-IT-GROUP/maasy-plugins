#!/usr/bin/env bash
# Mantiene el Manual de Maasy en Claude al día. Lo dispara launchd una vez al día
# (com.believe.maasy-manual-autoupdate).
#
# Clona el repo (una vez) en ~/.cache/maasy-plugins, lo deja en origin/main y compara las versiones de los plugins
# contra manual.config.json. Si algo cambió, sube la rama manual/autoupdate-<sha> con los capítulos marcados y abre el
# PR. No publica ni toca main: eso lo decide quien revisa.
# Las variables (GH_TOKEN, ver scripts/manual/.env.example) se leen de ~/.config/maasy-manual/env si existe.
set -euo pipefail
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:${PATH:-}"
ENV_FILE="${HOME}/.config/maasy-manual/env"
if [ -f "$ENV_FILE" ]; then set -a; . "$ENV_FILE"; set +a; fi
CACHE="${HOME}/.cache/maasy-plugins"
mkdir -p "$(dirname "$CACHE")"
[ -d "$CACHE/.git" ] || git clone -q git@github.com:BELIEVE-IT-GROUP/maasy-plugins.git "$CACHE"
git -C "$CACHE" fetch -q origin
git -C "$CACHE" checkout -q --detach origin/main
cd "$CACHE"
echo "--- $(date '+%Y-%m-%d %H:%M') ---"
exec node scripts/manual/autoupdate.mjs --apply --pr --ref origin/main
