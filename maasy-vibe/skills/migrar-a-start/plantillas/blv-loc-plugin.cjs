// Babel plugin de Believable: la "etiqueta invisible" del source mapping.
// Solo en desarrollo inyecta un atributo data-blv-loc="<archivo>:<linea>:<columna>"
// en cada elemento JSX, para que el Tweak panel sin IA pueda ubicar el elemento
// clickeado en el código fuente exacto y editarlo sin invocar al modelo.
//
// No se aplica en build de produccion (vite lo pasa solo en command === 'serve').
//
// Sin `require`: Vite bundlea el vite.config a ESM y un require dinámico (node:path
// o @babel/types) revienta ("Dynamic require not supported"). Por eso usamos el
// `types` que Babel ya inyecta y calculamos la ruta relativa a mano.

// Modo 'id' (Ola 6, docs/OLA6-PRD.md §2.2): para la vista previa que ve el CLIENTE se
// inyecta un identificador corto y sin significado (data-blv-id="a7f3") en vez de la
// ruta. El mapa a7f3 -> archivo:linea se acumula en globalThis y lo escribe el vite
// config en un archivo FUERA del proyecto, que nunca se sube a R2: el cliente ve un id
// opaco, y la estructura de archivos del proyecto no sale de la maquina del usuario.
//
// El id es un hash del propio "archivo:linea:columna": deterministico, sin estado, y no
// deja adivinar la ruta al reves.
const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619

function shortId(value) {
  let hash = FNV_OFFSET
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(-6)
}

module.exports = function blvLocPlugin({ types: t }, options) {
  const mode = (options && options.mode) === 'id' ? 'id' : 'loc'
  const attrName = mode === 'id' ? 'data-blv-id' : 'data-blv-loc'

  const relativePath = (root, filename) => {
    if (!filename) return ''
    const base = root ? (root.endsWith('/') ? root : root + '/') : ''
    return base && filename.startsWith(base) ? filename.slice(base.length) : filename
  }

  return {
    name: 'blv-loc',
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const node = nodePath.node
        // React.Fragment (<>) no tiene JSXOpeningElement con nombre util; los
        // fragmentos con nombre (<React.Fragment>) no aceptan atributos arbitrarios.
        const nameNode = node.name
        if (nameNode && nameNode.type === 'JSXIdentifier' && nameNode.name === 'Fragment') return
        if (
          nameNode &&
          nameNode.type === 'JSXMemberExpression' &&
          nameNode.property &&
          nameNode.property.name === 'Fragment'
        ) {
          return
        }

        // Ya tiene el atributo: no duplicar.
        const already = node.attributes.some(
          (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === attrName
        )
        if (already) return

        // Sin ubicacion de origen (nodos generados): nada que etiquetar.
        if (!node.loc || !node.loc.start) return

        const filename = state.file.opts.filename || ''
        const root = state.file.opts.root || process.cwd()
        const rel = relativePath(root, filename)
        const line = node.loc.start.line
        const column = node.loc.start.column
        const loc = `${rel}:${line}:${column}`

        // Con TanStack Start el mismo archivo se compila DOS veces (bundle ssr y bundle
        // cliente) y el plugin de Start inyecta un preambulo distinto por bundle: las
        // lineas se corren y el atributo sale con valores diferentes en cada lado. React
        // detecta el desajuste al hidratar y muestra el warning de hydration mismatch en
        // cada pagina. El DOM se queda con el valor del SERVIDOR (el correcto: ese bundle
        // no lleva preambulo), asi que el Tweak panel no se ve afectado — solo hay que
        // suprimir el warning en el elemento etiquetado. suppressHydrationWarning es un
        // prop que React consume (no llega al DOM) y solo silencia desajustes de
        // atributos/texto de ESE elemento; los estructurales siguen avisando.
        const suppress = t.jsxAttribute(t.jsxIdentifier('suppressHydrationWarning'), null)
        const hasSuppress = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'suppressHydrationWarning'
        )

        if (mode === 'loc') {
          node.attributes.push(t.jsxAttribute(t.jsxIdentifier(attrName), t.stringLiteral(loc)))
          if (!hasSuppress) node.attributes.push(suppress)
          return
        }

        // Modo id: el atributo lleva el hash, y el mapa queda en memoria para que el
        // vite config lo escriba al cerrar el bundle. Una colision (dos ubicaciones con
        // el mismo hash) se marca para descartarla despues: mandar al agente a la linea
        // equivocada es peor que no mandarlo a ninguna.
        const id = shortId(loc)
        const map = (globalThis.__BLV_IDMAP__ = globalThis.__BLV_IDMAP__ || {})
        if (!Object.prototype.hasOwnProperty.call(map, id)) map[id] = loc
        else if (map[id] !== loc) map[id] = null // colision: se descarta, no se adivina

        node.attributes.push(t.jsxAttribute(t.jsxIdentifier(attrName), t.stringLiteral(id)))
        if (!hasSuppress) node.attributes.push(suppress)
      }
    }
  }
}
