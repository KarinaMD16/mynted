/**
 * Ancho estándar de todas las pantallas: el mismo de Home. Se alinea con el
 * header (también max-w-[1320px]) y deja 56px de aire a los lados desde lg.
 * Cada página le suma solo su espaciado vertical y su layout interno, p. ej.
 * `cx(PAGE_CONTAINER, 'flex flex-col gap-6 pt-7 pb-24')`.
 *
 * Excepciones a propósito (columna angosta centrada, para que se lean
 * cómodas): login y recuperación de contraseña, checkout, recibo y páginas
 * legales. El panel de admin tiene su propio layout de ancho completo.
 */
export const PAGE_CONTAINER = 'mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-14'
