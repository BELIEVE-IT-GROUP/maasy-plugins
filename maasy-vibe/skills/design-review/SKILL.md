---
name: design-review
description: Audita la UI actual del proyecto contra design.md y las reglas anti-look-de-IA de CLAUDE.md, y entrega una lista priorizada de qué arreglar. Úsalo cuando el usuario pida revisar, auditar o mejorar el diseño de lo ya construido — por ejemplo "revisa el diseño", "se ve como hecho por IA", "corre el design review", "por qué se ve genérico".
---

Auditoría de diseño de la app YA construida — no diseño nuevo, evaluación de lo que existe.

## Cómo correr la auditoría

1. Lee `design.md` (el brand lock del proyecto) y la sección `## Diseño` de `CLAUDE.md` (las
   reglas duras anti-look-de-IA). Si `design.md` está vacío o a medio llenar, dilo primero —
   sin brand lock, cualquier veredicto es débil.
2. Recorre las pantallas reales: componentes en `src/components/`, páginas/secciones en `src/`.
   Si puedes ver el preview en vivo (screenshot), mejor — algunos problemas solo se notan
   renderizados (dos colores que parecen dos acentos, un hero que no domina, etc.), no en el código.
3. Marca cada ítem de esta checklist como OK o FALLA, con el archivo:línea exacto de la falla:

```
□ Acento      — ¿es el color elegido en design.md, o quedó el índigo/violeta default (#4F46E5, #5E6AD2)?
□ Foco        — ¿cada pantalla tiene UN elemento que domina, o es una grilla pareja de cards del
                mismo peso? (la grilla pareja es la marca #1 de "esto lo compuso una máquina")
□ Íconos      — ¿emoji usados como ícono de UI en vez de un set de línea consistente?
□ Cards       — ¿el cliché "ícono en un chip arriba de cada feature card", repetido sin variar?
□ Color       — ¿algún estado normal/neutral está coloreado en vez de gris? ¿mismo valor,
                mismo color en todos lados, o hay una "lista arcoíris"?
□ Tokens      — ¿hex hardcodeado en componentes en vez de las clases del `@theme`?
□ Tipografía  — ¿tamaños fuera de una escala consistente, o el body en 14px en una pantalla ancha?
□ Elevación   — ¿se mezclan sombras duras con superficies tonales, o aparece negro puro (#000)?
□ Estados     — ¿falta el estado vacío, cargando o de error en alguna superficie con datos?
```

4. Cierra con: el % de ítems OK, la lista priorizada de fallas (archivo:línea + qué cambiar), y
   si el usuario quiere que las arregles ahora mismo o prefiere revisar la lista primero.

No inventes fallas para llenar la lista — un proyecto que ya sigue design.md correctamente
puede perfectamente salir limpio.
