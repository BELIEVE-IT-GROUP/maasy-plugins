#!/usr/bin/env bash
# Mantiene el Manual de Maasy en Claude al día. Lo dispara launchd una vez al día
# (com.believe.maasy-manual-autoupdate). Se instala en ~/.believe/bin/.
#
# Clona el repo (una vez) en ~/.believe/cache/maasy-plugins, lo deja en origin/main y compara las versiones de los
# plugins contra manual.config.json. Si algo cambió, sube la rama manual/autoupdate-<sha> con los capítulos marcados y
# abre el PR. No publica ni toca main: eso lo decide quien revisa.
# Corre bajo `~/.believe/bin/infra` para tener GIT_FULL_ACCESS_TOKEN (solo para abrir el PR); acá no pasa ningún secreto.
set -euo pipefail
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:${PATH:-}"
CACHE="${HOME}/.believe/cache/maasy-plugins"
mkdir -p "$(dirname "$CACHE")"
[ -d "$CACHE/.git" ] || git clone -q git@github.com:BELIEVE-IT-GROUP/maasy-plugins.git "$CACHE"
git -C "$CACHE" fetch -q origin
git -C "$CACHE" checkout -q --detach origin/main
cd "$CACHE"
echo "--- $(date '+%Y-%m-%d %H:%M') ---"
exec "${HOME}/.believe/bin/infra" node scripts/manual/autoupdate.mjs --apply --pr --ref origin/main
