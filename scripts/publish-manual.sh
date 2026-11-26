#!/usr/bin/env bash
#
# Publica el Manual de Maasy en Claude a sus tres destinos desde una sola fuente (docs/manual/*.md):
#   1. repo     el Markdown, versionado en git (acá solo se comprueba que esté commiteado)
#   2. R2       la página con marca: files.believe-global.com/maasy/manual/index.html
#   3. BeNotes  la nota "Manual de Maasy en Claude" (scripts/manual/benotes.mjs)
#
# Sin --publish es un ENSAYO: construye y dice exactamente qué subiría y a dónde. No toca nada.
#
# Reglas del versionado (las hace cumplir este script):
#   - mismo contenido que lo publicado            → no sube nada
#   - contenido distinto con la misma versión     → se niega: sube docs/manual/MANUAL-VERSION y
#     agrega la entrada en docs/manual/CHANGELOG.md (o --force si de verdad es lo que quieres)
#
# Ningún secreto vive en este script. Se leen del entorno (ver scripts/manual/.env.example): corre el script con tus
# secretos ya cargados, y PUBLISH_R2_BIN apunta a tu herramienta de subida a R2 (por defecto `publish-r2` del PATH).
#
# Uso:  scripts/publish-manual.sh [--publish] [--only r2|benotes] [--force]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${ROOT}/docs/manual/dist"
PUBLISH=0; ONLY=""; FORCE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --publish) PUBLISH=1 ;;
    --force) FORCE=1 ;;
    --only) ONLY="${2:-}"; shift ;;
    *) echo "Uso: scripts/publish-manual.sh [--publish] [--only r2|benotes] [--force]" >&2; exit 2 ;;
  esac
  shift
done
[[ -z "$ONLY" || "$ONLY" == "r2" || "$ONLY" == "benotes" ]] || { echo "--only acepta r2 o benotes" >&2; exit 2; }

# launchd y algunos shells no traen node en el PATH.
NODE="$(command -v node || true)"
[[ -x "$NODE" ]] || NODE="/opt/homebrew/bin/node"
[[ -x "$NODE" ]] || NODE="$(ls -d "${HOME}"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -1)"
[[ -x "$NODE" ]] || { echo "ERROR: no encuentro node." >&2; exit 1; }
field() { "$NODE" -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(m[process.argv[2]]??"")' "$1" "$2"; }
config_field() { "$NODE" -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(process.argv[2].split(".").reduce((o,k)=>o?.[k],c)??"")' "${ROOT}/docs/manual/manual.config.json" "$1"; }

[[ $PUBLISH -eq 1 ]] && echo "==> PUBLICANDO el Manual de Maasy en Claude" || echo "==> ENSAYO (no se sube nada; con --publish se publica)"
"$NODE" "${ROOT}/scripts/manual/build.mjs"
VERSION="$(field "${DIST}/manual.json" manual_version)"
HASH="$(field "${DIST}/manual.json" content_sha256)"
URL="$(field "${DIST}/manual.json" url)"
URL_BASE="$(field "${DIST}/manual.json" url_base)"
PREFIX="$(config_field r2.prefix)"
HERO="$(config_field hero)"
PUBLIC_BASE="${URL_BASE%/${PREFIX}}"

echo
echo "==> 1. Repo"
DIRTY="$(git -C "$ROOT" status --porcelain -- docs/manual scripts/manual scripts/publish-manual.sh)"
if [[ -n "$DIRTY" ]]; then
  echo "    Hay cambios sin commitear:"; sed 's/^/      /' <<<"$DIRTY"
  [[ $PUBLISH -eq 0 ]] || { echo "ERROR: se publica solo lo que está en git. Haz commit primero." >&2; exit 1; }
else
  echo "    docs/manual/ está commiteado ($(git -C "$ROOT" rev-parse --short HEAD)). El Markdown ya es el destino 1."
fi

if [[ -z "$ONLY" || "$ONLY" == "r2" ]]; then
  echo
  echo "==> 2. R2 (${URL})"
  REMOTE="${DIST}/.publicado.json"; rm -f "$REMOTE"
  CODE="$(curl -sS -m 20 -o "$REMOTE" -w '%{http_code}' "${URL_BASE}/manual.json?t=$(date +%s)" 2>/dev/null || true)"
  UPLOAD=1
  case "$CODE" in
    200)
      RVERSION="$(field "$REMOTE" manual_version)"; RHASH="$(field "$REMOTE" content_sha256)"
      if [[ "$RHASH" == "$HASH" ]]; then
        echo "    Publicado: v${RVERSION} con este mismo contenido. Nada que subir."; UPLOAD=0
      elif [[ "$RVERSION" == "$VERSION" && $FORCE -eq 0 ]]; then
        echo "    BLOQUEADO: el contenido cambió y MANUAL-VERSION sigue en ${VERSION}."
        echo "    Sube docs/manual/MANUAL-VERSION y agrega la entrada en docs/manual/CHANGELOG.md."
        [[ $PUBLISH -eq 0 ]] || exit 1
      else
        echo "    Publicado: v${RVERSION}. Se reemplaza por v${VERSION}."
      fi ;;
    404) echo "    Todavía no hay nada publicado: primera publicación (v${VERSION})." ;;
    *)
      echo "    No pude consultar lo publicado (respuesta: ${CODE:-sin red})."
      [[ $PUBLISH -eq 0 || $FORCE -eq 1 ]] || { echo "ERROR: sin saber qué hay publicado no subo nada (--force para subir igual)." >&2; exit 1; } ;;
  esac
  if [[ $UPLOAD -eq 1 ]]; then
    # El plan ya viene en orden: imágenes, Markdown, la página y al final el marcador de versión.
    while IFS=$'\t' read -r file key; do
      if [[ $PUBLISH -eq 1 ]]; then
        "${PUBLISH_R2_BIN:-publish-r2}" "${DIST}/${file}" --key "$key"
      else
        printf '    subiría  %-30s %8s bytes  →  %s/%s\n' "$file" "$(wc -c < "${DIST}/${file}" | tr -d ' ')" "$PUBLIC_BASE" "$key"
      fi
    done < "${DIST}/publish-plan.tsv"
    if [[ $PUBLISH -eq 1 ]]; then
      # Cloudflare cachea por URL: sin purgar, la copia vieja (o un 404 de antes) sigue saliendo.
      echo "    Purgando la caché de Cloudflare"
      "$NODE" "${ROOT}/scripts/manual/purge-cache.mjs"
      # Un 200 no prueba que renderice: se baja la página y se busca la versión adentro, y después
      # una captura que la página pide (Cloudflare cachea por URL: el ?t= salta esa caché).
      PAGE="$(curl -fsS -m 20 "${URL}?t=$(date +%s)")"
      grep -q "maasy-manual-version\" content=\"${VERSION}\"" <<<"$PAGE" || { echo "ERROR: ${URL} no trae la versión ${VERSION}." >&2; exit 1; }
      grep -q "assets/${HERO}" <<<"$PAGE" || { echo "ERROR: la página no referencia su captura principal (${HERO})." >&2; exit 1; }
      IMG_TYPE="$(curl -fsS -m 20 -o /dev/null -w '%{content_type}' "${URL_BASE}/assets/${HERO}?t=$(date +%s)")" || { echo "ERROR: la página quedó sin su captura principal." >&2; exit 1; }
      [[ "$IMG_TYPE" == image/* ]] || { echo "ERROR: assets/${HERO} no responde como imagen (${IMG_TYPE})." >&2; exit 1; }
      echo "    Verificado: ${URL} sirve la v${VERSION} con su captura principal (${IMG_TYPE})."
    else
      echo "    con: ${PUBLISH_R2_BIN:-publish-r2} <archivo> --key <key>"
    fi
  fi
fi

if [[ -z "$ONLY" || "$ONLY" == "benotes" ]]; then
  echo
  echo "==> 3. BeNotes"
  if [[ $PUBLISH -eq 0 ]]; then
    "$NODE" "${ROOT}/scripts/manual/benotes.mjs" plan
  elif [[ -n "${BENOTES_MAASY_MANUAL_OAUTH:-}" ]]; then
    "$NODE" "${ROOT}/scripts/manual/benotes.mjs" push
  else
    echo "    PENDIENTE: BeNotes todavía no está conectado (falta BENOTES_MAASY_MANUAL_OAUTH en el entorno)."
    echo "    Una vez, quien administra Cuadernos, en su Mac:  node scripts/manual/benotes.mjs connect"
    echo "    Mientras tanto, a mano con el conector BeNotes: notes_create/notes_update con docs/manual/dist/benotes-resumen.json"
  fi
fi

echo
[[ $PUBLISH -eq 1 ]] && echo "==> Listo: Manual de Maasy en Claude v${VERSION}" || echo "==> Ensayo terminado: Manual de Maasy en Claude v${VERSION} (nada se publicó)"
