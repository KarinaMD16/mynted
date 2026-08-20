/**
 * Formas decorativas de fondo (círculos difuminados) que aparecen
 * detrás de la tarjeta de login en el mockup. Se recrean con CSS en vez
 * de los SVG originales de Figma (no se pudieron descargar esos assets
 * desde este entorno), usando posiciones relativas al viewport para
 * que se vean bien en cualquier tamaño de pantalla.
 */
export function DecorativeBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-10 left-[15%] size-28 rounded-full bg-mynted-blue/15 " />
      <div className="absolute top-[20%] -left-10 size-28 rounded-full bg-mynted-orange/15" />
      <div className="absolute top-[45%] -right-8 size-28 rounded-full bg-mynted-blue/15 " />
      <div className="absolute bottom-[8%] left-[45%] size-28 rounded-full bg-mynted-orange/15 " />
      <div className="absolute bottom-[15%] left-[5%] size-40 rounded-full bg-mynted-orange/10 " />
      <div className="absolute -top-16 right-[10%] size-44 rounded-full bg-mynted-blue/10" />
    </div>
  )
}
