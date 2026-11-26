# Plugin maasy-aos

BeAOS dentro de Claude, para cuentas de Maasy. Conecta el MCP remoto `https://beaos.believe-global.com/mcp` (login con tu
cuenta de Maasy, MEC-34) y trae tres comandos: `/maasy-aos:audit`, `/maasy-aos:measure` y `/maasy-aos:publish`.

Este directorio es público: la receta (cómo leer AOS y APS y qué recomendar) vive en el servidor
(`apps/web/src/server/mcp/recipe/aos-recipe.ts`) y llega por `get_aos_recipe`, marcada por cuenta. El test
`apps/web/src/server/mcp/__tests__/recipe-sentinel.test.ts` falla si una oración de la receta aparece aquí.
No hay HTML ni estilos en el plugin; si más adelante lleva UI, solo con clases de maasy-ui.

## Dependencia

`plugin.json` declara `"dependencies": ["maasy"]` (el plugin núcleo de Maasy). El nombre se resuelve en el mismo marketplace que
`maasy-aos`: si `maasy` no está listado ahí, la instalación termina con una advertencia y `maasy-aos` no carga.

## Marketplace

El marketplace es `maasy-plugins` (lo publica el orquestador). La entrada que hay que agregar a su `marketplace.json`:

```json
{ "name": "maasy-aos", "source": "<ruta o repo de plugin/maasy-aos>", "description": "BeAOS en Claude: audita y mide tu sitio." }
```

## Instalar

```
/plugin install maasy-aos --marketplace BELIEVE-IT-GROUP/maasy-plugins
```

Necesita el plugin `maasy` y un plan de pago de Maasy.
