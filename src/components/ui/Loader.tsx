import loaderGif from '../../assets/loader-goose.gif'

const GIF_ASPECT_RATIO = 480 / 360

interface LoaderProps {
  /** Texto opcional debajo de la animación (ej. "Cargando..."). */
  label?: string
  /** Ancho del gif en px. El alto se calcula solo, manteniendo su proporción original. */
  size?: number
  className?: string
  /** Clases para el texto del label (útil para fondos oscuros, ej. "text-white/80"). */
  labelClassName?: string
}

/**
 * Loader oficial de mynted: el gansito caminando (gif subido por Karina).
 * Se usa como pending state de las rutas (ver router.tsx) y como estado de
 * carga de la mascota de Spline en el login.
 */
export function Loader({ label, size = 96, className = '', labelClassName = 'text-mynted-gray' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <img
        src={loaderGif}
        alt="Loading..."
        width={size}
        height={Math.round(size * GIF_ASPECT_RATIO)}
        draggable={false}
        className="select-none"
      />
      {label && <p className={`text-xs ${labelClassName}`}>{label}</p>}
    </div>
  )
}
