// Config compartida de la tienda de ejemplo. Un solo lugar para las decisiones que
// atraviesan listado, PDP, carrito y checkout.
//
// ⓘ SCAFFOLD: adáptalo a la marca. Al copiarlo a `src/`, ajusta MONEDA (la que vende la
//   marca) y LOCALE (para el formato de precio). Todo lo demás sale del catálogo.

import { becommerce, pickRegion, type Region } from '@/lib/becommerce'

/** La moneda que vende esta marca. Se usa para elegir la región (y con ella, los precios).
 *  La tienda demo tiene 'eur' y 'mxn'; cámbiala a la de tu marca. */
export const MONEDA = 'eur'

/** Locale para formatear precios de forma consistente en toda la tienda. */
export const LOCALE = 'es-CO'

/** Clave de localStorage donde vive el id del carrito. Ponle el slug de tu proyecto para
 *  que no choque con otra app en el mismo navegador. */
export const CARRITO_KEY = 'tienda_cart_id'

let regionCache: Promise<Region | undefined> | null = null

/** Resuelve la región una vez y la reutiliza. La llaman los loaders (en el build) y el
 *  store del carrito (en el cliente). Sin región no hay precios. */
export function resolverRegion(): Promise<Region | undefined> {
  if (!regionCache) {
    regionCache = becommerce
      .getRegions()
      .then((regions) => pickRegion(regions, MONEDA))
      .catch(() => undefined)
  }
  return regionCache
}
