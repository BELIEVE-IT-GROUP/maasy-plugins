// Identidad del sitio en UN solo lugar. `routes/__root.tsx` la usa para el <title> y los
// metadatos sociales; cualquier pantalla puede importarla para mostrar el nombre.
//
// Cambiar el nombre o la descripcion del sitio se hace ACA, no repitiendo el texto en
// cada ruta. Cada ruta si define su propio <title> y description en su `head()`.

// Comillas dobles a proposito: el scaffold de Believable sustituye el nombre del proyecto
// aca escapandolo como string JSON, y ese escape asume comillas dobles. Con comillas
// simples, un nombre con apostrofe romperia el archivo.
export const SITE_NAME = "{{PROJECT_NAME}}"

export const SITE_DESCRIPTION = 'Un proyecto nuevo creado con Believable.'
