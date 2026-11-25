---
name: awesome-design-md
description: "Aplica el sistema de diseño (tipografía, color, espaciado, motion, voz, principios) de 73 marcas reconocidas como referencia para generar o auditar UIs. Usa cuando el usuario pida 'estilo X', 'look de X', 'diseño tipo X', 'haz esto como X', 'aplica el design system de X', donde X es una marca como Apple, Linear, Cursor, Claude, Vercel, Stripe, Notion, Figma, Linear, Supabase, Raycast, Framer, Webflow, Sanity, Sentry, Posthog, Resend, Superhuman, BMW, Ferrari, Tesla, Nike, Spotify, Airbnb, Pinterest, Slack, Shopify, Stripe, Uber, Wise, Revolut, Zapier, Anthropic/Claude, OpenAI, Mistral, Cohere, ElevenLabs, RunwayML, Replicate, MongoDB, ClickHouse, HashiCorp, Hugging Face equivalentes. También activa con frases como 'hazlo más [marca]', 'inspírate en [marca]', 'qué haría [marca]', 'design system de [marca]'."
version: 2.0.0
---

<!-- Versión del plugin de Claude Code. La de la app de escritorio vive en
template/.claude/skills/awesome-design-md/ y usa las tools de packs de la app; esta no las nombra. -->

# Awesome Design MD

Colección de 73 design specs extraídas del repo [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT). No viene en el proyecto: llega con el pack `believe-referencias` y queda en `.referencias-diseno/marcas/<brand>/DESIGN.md`.

## Cómo usar

1. Identifica la marca pedida por el usuario.
2. Si no existe `.referencias-diseno/marcas/`, bájala del catálogo de Believable con el sha256 del índice verificado. Un solo comando: si el sha256 no coincide o el pack trae algo que no es archivo ni carpeta, se detiene y no copia nada (dilo). Sin red, dilo y trabaja con lo que sepas de la marca, sin fingir que leíste la ficha.
   ```bash
   grep -qxF 'raw/' .gitignore 2>/dev/null || printf '\nraw/\n' >> .gitignore
   B=https://files.believe-global.com/packs; P=raw/.pack; rm -rf $P && mkdir -p $P/x
   curl -fsSL $B/index.json -o $P/index.json \
     && read T S < <(node -e 'const p=require(process.argv[1]).packs.find(p=>p.id==="believe-referencias");console.log(p.tarball,p.sha256)' "$PWD/$P/index.json") \
     && curl -fsSL "$B/$T" -o $P/pack.tgz && echo "$S  $P/pack.tgz" | shasum -a 256 -c - \
     && ! tar -tvzf $P/pack.tgz | grep -v '^[-d]' && tar -xzf $P/pack.tgz -C $P/x \
     && node -e 'const fs=require("fs"),path=require("path");const [dir,...names]=process.argv.slice(1);const pk=JSON.parse(fs.readFileSync(path.join(dir,"pack.json"),"utf8"));for(const n of names){const c=pk.components.find(c=>c.name===n);if(!c)throw new Error("el pack no trae "+n);for(const f of c.files){if(path.isAbsolute(f.target)||f.target.split("/").includes(".."))throw new Error("destino raro: "+f.target);fs.mkdirSync(path.dirname(f.target),{recursive:true});fs.copyFileSync(path.join(dir,f.path),f.target)}console.log(n+": "+c.dependencies.join(" "))}' $P/x marcas
   rm -rf $P
   ```
3. Lee `.referencias-diseno/marcas/<brand>/DESIGN.md` (o variantes como `linear.app`, `x.ai`, `bmw-m`, `dell-1996`, `theverge`, `mistral.ai`, `opencode.ai`, `together.ai`).
4. Extrae principios, tokens (color/tipografía/espaciado), voz/tono y patrones.
5. Aplícalos al trabajo actual (UI, copy, layout, motion).

## Marcas disponibles (73)

**Tech/SaaS:** airbnb, airtable, apple, cal, claude, clay, clickhouse, cohere, coinbase, composio, cursor, elevenlabs, expo, figma, framer, hashicorp, intercom, linear.app, lovable, meta, minimax, mintlify, miro, mistral.ai, mongodb, notion, nvidia, ollama, opencode.ai, pinterest, posthog, raycast, replicate, resend, sanity, sentry, shopify, slack, spotify, stripe, supabase, superhuman, together.ai, uber, vercel, voltagent, warp, webflow, wise, x.ai, zapier

**Fintech:** binance, kraken, mastercard, revolut

**Auto/lujo:** bmw, bmw-m, bugatti, ferrari, lamborghini, renault, tesla

**Retail/lifestyle:** nike, starbucks, playstation

**Telecom/hardware:** dell-1996, hp, ibm, spacex, vodafone

**Media:** theverge, wired, runwayml

## Ejemplos de triggers

- "Hazme esta landing tipo Linear"
- "Aplica el design system de Apple a este componente"
- "Inspírate en Stripe para el pricing"
- "Qué haría Raycast con este onboarding"

## Sin marca pedida

Si el usuario no especifica marca pero pide un estilo (premium, minimal, brutalist, etc.), sugiere 2-3 marcas del catálogo que encajen y pregunta cuál usar.
