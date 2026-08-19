/**
 * Wordmark de mynted.
 *
 * TODO(assets): el mockup de Figma usa un logo ilustrado (pato +
 * lettering a mano). No se pudo descargar ese PNG desde este entorno
 * (Figma bloquea la descarga automática de assets binarios acá). Para
 * usar el logo real: exportalo desde Figma (nodo "Brand" del frame de
 * Login) como PNG y guardalo en `public/mynted-logo.png`; después
 * cambiá este componente por un <img src="/mynted-logo.png" ... />.
 *
 * Mientras tanto, este wordmark de texto usa los colores de marca para
 * no bloquear el resto de la pantalla.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <p className={`font-heading text-[26px] font-semibold tracking-tight ${className}`}>
      <span className="text-mynted-blue">myn</span>
      <span className="text-mynted-orange">ted</span>
    </p>
  )
}
