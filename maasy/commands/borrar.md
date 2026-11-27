---
description: "Borra una marca de Maasy (pide confirmación) / Delete a Maasy brand (asks for confirmation)"
argument-hint: "[nombre de la marca]"
allowed-tools: mcp__plugin_maasy_maasy__maasy_list_brands, AskUserQuestion
---

Borrar una marca es difícil de deshacer. Solo la borra la persona, escribiendo el nombre exacto de la marca. La tool de borrado no está preaprobada: Claude Code pide permiso aparte, y eso es una segunda barrera a propósito.

1. Llama `maasy_list_brands`. Si "$ARGUMENTS" trae un nombre, búscalo en esa lista; si no, pregunta con `AskUserQuestion` cuál marca quiere borrar. Guarda el `project_id` de la marca elegida.
2. Dile a la persona qué se borra y pídele que escriba el nombre de la marca para confirmar. Espera su respuesta.
3. Solo si lo que escribió coincide con el nombre de la marca, llama `maasy_delete_my_brand` (servidor maasy) con `project_id` y `confirmar_nombre` igual a lo que la persona escribió, no al nombre que leíste de la lista. Si no coincide, no llames nada y avísale.
4. Muestra lo que la tool devuelve. Si responde `forbidden` o `confirm_mismatch`, muestra su texto tal cual (trae el enlace a la web). Nunca la llames sin esa confirmación escrita.
5. Plan claude-pro. Si la tool vuelve con `confirmacion_pendiente`, todavía no borró nada: trae lo que se borra y cuánto baja la factura (con el prorrateo a favor). Muéstralo con su `tarjeta` en `AskUserQuestion`, tal cual viene, y espera la respuesta. Solo si elige "Sí, borrarla", llama otra vez a `maasy_delete_my_brand` con el mismo `project_id`, el mismo `confirmar_nombre` y el `ticket_borrado` que vino (vale 10 minutos). Si dice que no, no la llames. Nunca elijas por la persona ni reuses un ticket viejo: si venció, la llamada devuelve uno nuevo y se pregunta otra vez.
