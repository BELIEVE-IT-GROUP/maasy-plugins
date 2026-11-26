# Maasy Reply para Claude

Con este plugin, tu Claude diseña las campañas de comentario a DM de Instagram de tu marca y Maasy Reply las corre. Las campañas funcionan sin IA: cada texto queda escrito y fijo.

## Qué trae

- El servidor MCP `maasy-reply` (tus campañas, conversaciones y contactos). El cerebro de tu marca llega con el plugin `maasy`, que se instala solo como dependencia.
- `/maasy-reply:campana`: diseña una campaña nueva.
- `/maasy-reply:escalados`: lo que las campañas pasaron a una persona.
- `/maasy-reply:conversaciones`: los DMs recientes y si todavía se les puede escribir.

## Cómo funciona

1. La primera vez, Claude te pide entrar con tu cuenta de Maasy. Para crear borradores tienes que aceptar el permiso `reply:draft`; sin él, Claude solo lee.
2. Claude lee la voz de tu marca en Maasy y escribe la campaña.
3. Lo que Claude guarda es un borrador. Ninguna campaña se activa ni sale un mensaje sin que una persona lo apruebe en el panel de BeReply.
4. Los leads (etiqueta lead, follow gate cumplido o clic en un link medido) llegan al CRM de Maasy.

## Requisitos

- Una cuenta de Maasy con plan pago y acceso a la marca.
- La cuenta de Instagram conectada en BeReply y vinculada a esa marca.
