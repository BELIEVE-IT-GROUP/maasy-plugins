# El cerebro de tu marca

El cerebro es la memoria de tu marca dentro de Maasy. Guarda tu ADN, entiende cómo se relacionan sus partes y recuerda qué piezas aprobaste y cuáles descartaste. Claude lo consulta cada vez que crea algo para ti. Es lo que hace que la décima pieza salga mejor que la primera, y lo que ningún chat suelto puede tener.

> El cerebro que se sirve a los plugins es del plan Pro. Con el plan gratis tienes la entrevista, el ADN y su vista en la web (capítulo 8).

## Cómo se arma y cómo aprende

```figura
<figure class="vx-fig" data-alt="Siete pasos: la entrevista llena el ADN, el ADN produce las derivaciones, todo se guarda en el cerebro, Claude crea una pieza con ese contexto, tú la apruebas o la descartas, y el cerebro aprende de tu decisión para la próxima pieza.">
  <div class="vx-head">El ciclo del cerebro</div>
  <div class="vx-body">
    <div class="vx-flow">
      <div class="vx-node">Entrevista<small>Tus respuestas</small></div>
      <div class="vx-node">ADN<small>Más de 40 campos</small></div>
      <div class="vx-node">Derivaciones<small>Ángulos, pilares, diseño</small></div>
      <div class="vx-node vx-key">Cerebro<small>Se consulta y se alimenta</small></div>
      <div class="vx-node">Claude crea<small>Con tu contexto completo</small></div>
      <div class="vx-node">Tú apruebas<small>O descartas, en el canvas</small></div>
      <div class="vx-node">El cerebro aprende<small>Ganadoras y descartadas</small></div>
    </div>
  </div>
  <figcaption>Cada pieza que apruebas o descartas vuelve al cerebro. La siguiente nace sabiendo más de tu marca.</figcaption>
</figure>
```

## Qué hay dentro

El cerebro tiene cuatro capas.

### 1. El grafo de tu marca

Es el mapa de cómo se conectan las partes de tu marca. Cada nodo es una pieza de información y cada línea, una relación (por ejemplo, un término del glosario que cita una sección estratégica). Está organizado en grupos:

| Grupo | Qué reúne |
|---|---|
| ADN de marca | Identidad y negocio, propuesta de valor, cliente ideal, identidad visual, voz y tono, ángulos de venta y configuración de salida |
| Documento estratégico | El diagnóstico de la marca, la realidad diseñada y la realidad operativa, en tres fases |
| Glosario | Los términos propios de tu marca y su significado |
| Cultural | El perfil cultural de la marca |
| Pilares de contenido | Tus pilares y sus temas |
| Memoria de marca | Patrones emergentes, piezas ganadoras y piezas aprobadas |
| Canvas | Lo que tus plugins dejaron en el canvas |

Cuando Claude necesita la **estructura** de tu marca, no el detalle de cada campo, pide el grafo con `maasy_get_brand_graph`.

### 2. La compresión del grafo (DSL)

Un grafo completo en texto normal pesa unos 25.000 tokens, que es demasiado para cada turno de una conversación. Maasy lo comprime a un formato denso de unos 3.000 tokens, unas ocho veces menos, sin perder los nodos ni las relaciones. Así Claude puede tener tu marca entera presente en cada respuesta.

### 3. El corpus vectorizado

Tu ADN se parte en trozos y cada uno se vectoriza, es decir, se convierte en algo que se puede buscar por significado y no solo por palabra. Cada trozo pertenece a una capa:

| Capa | Qué contiene |
|---|---|
| Campos del ADN | Tus respuestas, campo por campo |
| Ángulos de venta | Cada ángulo derivado |
| Pilares de contenido | Cada pilar con sus temas |
| Secciones estratégicas | Las secciones del documento estratégico |
| Glosario | Los términos de tu marca |
| Perfil cultural | El perfil cultural |
| Ejemplos de voz | Las frases que suenan y las que no suenan a tu marca |

Toda marca tiene este corpus desde que se crea, aunque todavía no tenga una sola pieza.

### 4. La memoria de ganadoras y aprobadas

Es lo que tu marca produjo y cómo le fue. Cada pieza se guarda con su vector para poder buscar la parecida a lo que se pide.

- **Aprobadas:** las que tú aprobaste en el canvas.
- **Ganadoras:** las que además demostraron buen rendimiento real.
- **Descartadas:** las que rechazaste, con tu motivo, para no repetirlas.

Cuando hay varias piezas ganadoras, el sistema destila patrones emergentes: lo que tienen en común.

## Cómo lo consulta Claude

| Herramienta | Para qué |
|---|---|
| `maasy_get_brand_context` | Trae el contexto completo de la marca: nombre, industria, tono, cliente ideal, propuesta de valor, archivos y referencias. Es el punto de partida de cualquier pieza |
| `maasy_get_design_md` | Lee el design.md |
| `maasy_query_brand_brain` | Busca por significado en el corpus y en la memoria de piezas. Responde con lo más cercano a lo que Claude necesita, y puede limitarse a una capa (por ejemplo, solo ejemplos de voz) |
| `maasy_get_brand_graph` | Trae la estructura comprimida |
| `maasy_query_ecosystem_brain` | Busca entre **todas tus marcas** a la vez: qué mensaje funcionó con un público parecido en cualquiera de ellas. Solo ve tus marcas, nunca las de otras cuentas |

Lo normal es que no las pidas por nombre. Escribes lo que quieres y Claude decide qué consultar.

```pedido
¿Qué mensajes nos han funcionado mejor con clientes que dudan del precio?
Antes de escribir, revisa cómo hablamos de la garantía en otras piezas.
¿Qué ganchos usamos en las marcas de mi cuenta que le hablan a mamás?
```

Al principio, la consulta por piezas pasadas puede salir vacía: una marca nueva tiene ADN, pero todavía no tiene piezas aprobadas. Eso no es un error. La memoria de ganadoras crece con el uso.

## Cómo aprende

El cerebro aprende por tres caminos.

1. **Aprobar o descartar en el canvas.** Es el principal. Cada decisión tuya se guarda: lo aprobado pasa a la memoria de aprobadas y lo descartado queda registrado con su motivo. Ninguna herramienta de Claude toma esa decisión por ti.
2. **Rendimiento real.** Una pieza pasa a ganadora por cómo le va en la realidad, no porque lo diga Claude.
3. **Alimentarlo a mano.** `maasy_feed_brand_brain` guarda un aprendizaje, un posicionamiento que funcionó o un dato de contexto, con una etiqueta opcional. Queda disponible para cualquier consulta posterior, desde cualquier canal.

```pedido
Guarda en el cerebro: los clientes de más de 40 años responden mejor a las pruebas con cifras.
Guarda este ángulo ganador: "Entrega en 24 horas o te devolvemos el envío".
```

### Corregir lo que guardaste

Si guardaste algo equivocado, desactualizado o por accidente, se borra con `maasy_forget_brand_brain_item`, con el identificador que devolvió al guardarlo. Solo borra entradas que tú agregaste con `maasy_feed_brand_brain`, una por vez.

> `PRÓXIMAMENTE`: esta herramienta está en revisión y todavía no está en producción.

## Lo que el cerebro no hace

- No genera nada por sí mismo. Guarda, relaciona y recuerda. La creación la hace tu Claude.
- No decide por ti qué es una pieza ganadora ni qué se aprueba.
- No mezcla marcas ni cuentas. La búsqueda entre marcas solo recorre las tuyas.

## Preguntas frecuentes

**¿Cuánto tarda en volverse útil?** Desde el primer día Claude tiene tu ADN completo. Lo que mejora con el tiempo es la memoria de lo que aprobaste y descartaste.

**¿Puedo ver el cerebro?** En la web de Maasy, sección **ADN y cerebro** (capítulo 7): cuántos nodos tiene cada grupo, cuántas piezas ganadoras y descartadas hay, y un buscador. El mapa de nodos completo se explora en la app web.

**¿Qué pasa con el cerebro si borro la marca?** Se va con ella: su ADN, sus archivos y su memoria se eliminan a los 30 días (capítulos 3 y 8).
