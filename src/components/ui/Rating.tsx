/**
 * Rating de estrellas para las ProductCard del marketplace.
 *
 * El pedido original era usar el componente CRating de CoreUI
 * (https://coreui.io/react/docs/forms/rating.md), pero ese componente
 * vive en "@coreui/react-pro" — la versión PAGA de CoreUI, que
 * necesita una licencia comercial. Para no atar el proyecto a una
 * dependencia con licencia paga, este componente replica el mismo
 * comportamiento visual (estrellas llenas/vacías, soporte de valores
 * fraccionarios como 4.5) a mano con SVG propio.
 */

const STAR_PATH =
  'M11.283 3.453c.23-.467.345-.7.502-.775a.5.5 0 0 1 .43 0c.157.075.272.308.502.775l2.187 4.43c.068.138.102.207.152.26a.502.502 0 0 0 .155.114c.067.03.143.042.295.064l4.891.715c.515.075.773.113.892.238a.5.5 0 0 1 .133.41c-.023.172-.21.353-.582.716l-3.54 3.446c-.11.108-.165.162-.2.226a.5.5 0 0 0-.06.183c-.009.072.004.148.03.3l.835 4.867c.088.514.132.77.05.922a.5.5 0 0 1-.349.253c-.17.032-.4-.09-.862-.332l-4.373-2.3c-.136-.07-.204-.107-.276-.12a.498.498 0 0 0-.192 0c-.072.013-.14.05-.276.12l-4.373 2.3c-.461.243-.692.364-.862.332a.5.5 0 0 1-.348-.253c-.083-.152-.039-.409.05-.922l.834-4.867c.026-.152.039-.228.03-.3a.5.5 0 0 0-.06-.184c-.035-.063-.09-.117-.2-.225L3.16 10.4c-.373-.363-.56-.544-.582-.716a.5.5 0 0 1 .132-.41c.12-.125.377-.163.892-.238l4.891-.715c.152-.022.228-.034.295-.064a.5.5 0 0 0 .155-.113c.05-.054.084-.123.152-.26l2.187-4.43Z'

function StarIcon({ size, fillRatio }: { size: number; fillRatio: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {/* Estrella vacía (fondo) */}
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-mynted-border" fill="currentColor" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      {/* Estrella llena, recortada al porcentaje de `fillRatio` (soporta medias estrellas, ej. 4.5) */}
      {fillRatio > 0 && (
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillRatio * 100}%` }}>
          <svg viewBox="0 0 24 24" width={size} height={size} className="text-amber-400" fill="currentColor" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
        </span>
      )}
    </span>
  )
}

interface RatingProps {
  /** Valor actual, de 0 a `max` (acepta decimales, ej. 4.5). */
  value: number
  /** Cantidad total de estrellas. @default 5 */
  max?: number
  /** Tamaño de cada estrella en px. @default 16 */
  size?: number
  className?: string
}

/** Rating de solo lectura (sin interacción) — para mostrar la calificación de un producto/vendedor. */
export function Rating({ value, max = 5, size = 16, className = '' }: RatingProps) {
  const clampedValue = Math.min(Math.max(value, 0), max)

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${clampedValue} de ${max} estrellas`}
    >
      {Array.from({ length: max }, (_, index) => (
        <StarIcon key={index} size={size} fillRatio={Math.min(Math.max(clampedValue - index, 0), 1)} />
      ))}
    </div>
  )
}
