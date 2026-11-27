# Si algo falla

Casi todo lo que falla tiene un arreglo corto. Busca tu síntoma y sigue la receta. Si no está, el final del capítulo dice cómo pedir ayuda.

## Instalar y empezar

| Síntoma | Qué hacer |
|---|---|
| Claude se cerró al instalar | Al preguntar si confías en la carpeta, la opción marcada por defecto es **No, exit**. Elige **Yes, I trust this folder** y mira antes de presionar Enter |
| Instalé y no aparece `/maasy:start` | Abre una conversación nueva. Si sigue sin aparecer, `/plugin` y revisa que `maasy` figure como instalado |
| Tengo Maasy como conector en mi cuenta y no veo el servidor del plugin | Es lo esperado: los dos apuntan al mismo servidor y Claude Code usa el de tu cuenta (**Maasy MCP**). Los comandos y el panel funcionan igual (capítulo 2) |
| Claude pide permiso para cada herramienta de Maasy | Pasa cuando las herramientas vienen del conector de tu cuenta: apruébalas. Con el servidor del plugin no las pide |
| Ya tenía un servidor de Maasy o de BeFeed configurado a mano y el del plugin no aparece | Claude Code usa uno solo cuando dos servidores tienen la misma dirección. Las herramientas siguen ahí, con el nombre de tu servidor: los comandos funcionan igual |
| La ventana de inicio de sesión no se abre, o la sesión no continúa | `/mcp`, elige **maasy**, **Authenticate**, y vuelve a escribir `/maasy:start` |
| No veo el panel | Escribe `/maasy-panel`. El panel solo se activa cuando usas Maasy por primera vez |
| Claude se cierra solo durante una sesión | Puede pasar con Code Mode. Cuéntanos qué hacías cuando pasó |

## La entrevista y la marca

| Síntoma | Qué hacer |
|---|---|
| Dice que no tengo cupo de marcas | Ya usaste tu marca gratis. Claude te da el enlace a los planes. Si quieres otra marca, sube de plan o borra la que no usas con `/maasy:borrar` |
| La entrevista quedó a medias | Escribe `/maasy:start` y la retomas donde estabas |
| Quiero empezar de cero | Claude te pide confirmación antes de descartar el borrador. Sin tu confirmación explícita, no lo hace |
| Al crear la marca faltan archivos | Claude te dice cuáles. Vuelve a subirlos y llámalo una vez más |
| `/maasy:borrar` responde que no está permitido (`forbidden`) | La marca no es tuya, la usa más gente o la opera Believe. Se borra desde la web de Maasy |
| `/maasy:borrar` dice que el nombre no coincide (`confirm_mismatch`) | Escribe el nombre exacto de la marca, tal como aparece en tu lista |
| Subí un SVG y lo rechazó | Un SVG con código ejecutable no se acepta. Expórtalo otra vez como SVG limpio o usa PNG |

## Plugins de producto

| Síntoma | Qué hacer |
|---|---|
| Un plugin dice que no hay sesión de Maasy | Instala `maasy` y corre `/maasy:start` |
| Un plugin de producto no ve mi marca | La conexión del cerebro con tus plugins es del plan Pro. Mira tu plan en la web de Maasy |
| Vibe: "no hay sesión" al publicar | `/maasy-vibe:login publicar` |
| Vibe: se llenó el cupo de apps | El plan gratis publica 1 app y Pro 5. Despublica una con `/maasy-vibe:unpublish` o sube de plan |
| Vibe: no puedo despublicar | La app tiene backend o dominio propio. El mensaje dice qué quitar primero |
| Reply: `/maasy-reply:campana` te pide el @usuario | La conexión solo trae el permiso "Proponer borradores" y no deja listar tus cuentas. Escribe el @usuario de Instagram y sigue. Si falta otro permiso, Claude te dice cuál y dónde activarlo |
| Motion: Claude dice que la app no responde | Instala Maasy Motion desde su DMG y ábrela una vez |
| Motion: falta una pieza (`doctor`) | Claude muestra el arreglo de cada pieza. Hazlo y vuelve a empezar |
| Lens: `ver_video` no existe | Lens no está instalado o conectado. Corre `/maasy-lens:estado` y reconecta con `/mcp`, **belens**, **Reconectar** |
| Lens: el video es privado | Lens solo ve contenido público y no inicia sesión en ninguna red |
| Lens: una red falla y lo demás está listo | Lo más probable es que esa red cambió algo. Prueba otra vez más tarde |

## Aprobar y publicar

| Síntoma | Qué hacer |
|---|---|
| No veo las tarjetas de Claude en el canvas | El canvas es del plan Pro. Con plan gratis no recibe tarjetas |
| El canvas dice que hay demasiadas pendientes | Una marca puede tener hasta 100 tarjetas por aprobar. Aprueba, descarta o archiva algunas |
| Claude dice que algo "queda como borrador" | Es lo normal. Revisa y apruébalo en la web de Maasy |

## Cuando es mejor parar

- Claude te pide una llave, un token o una contraseña en el chat. Ningún plugin de Maasy lo hace. Detente y cuéntalo.
- Una pieza se publicó y tú no la aprobaste. Revoca las conexiones en **Llaves y conexiones** y regenera la llave de Claude.
- Una tarjeta de permiso te pide algo distinto de lo que pediste. Recházala.

## Cómo pedir ayuda

Escribe a **soporte@maasy.ai**. Cuéntanos qué estabas haciendo y qué viste en pantalla, con el texto exacto de cualquier mensaje de error. Si te acompaña una persona de Maasy en una prueba, díselo a ella primero.
