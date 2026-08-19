/**
 * Silueta del gansito de mynted ("silly goose" en el mockup de Figma),
 * usada como marca junto al wordmark del header y como avatar del
 * usuario.
 *
 * TODO(assets): el mockup usa una ilustración PNG del gansito. No se
 * pudo descargar ese asset binario desde este entorno (mismo bloqueo
 * de red que el logo de Login, ver Logo.tsx). Para usar la ilustración
 * real: exportala desde Figma (nodo "silly goose" del frame "Header")
 * como PNG y reemplazá este ícono por un <img src="..." />.
 *
 * Mientras tanto, esta silueta vectorial (hereda `currentColor`) sirve
 * de reemplazo liviano y no depende de ningún asset externo.
 */
export function GooseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M21 6c-3.3 0-6 2.7-6 6 0 1.1.3 2.1.8 3-2.4.7-4.8 2.5-6.3 5.1-1 .3-1.7 1.2-1.7 2.3 0 1.3 1.1 2.4 2.4 2.4.4 0 .8-.1 1.1-.3.9.5 2 .8 3.1.8h9.6c2.8 0 5-2.2 5-5v-1.2c1.2-.5 2-1.7 2-3.1 0-1.9-1.5-3.4-3.4-3.4-.3 0-.6 0-.9.1C25.7 9 23.6 6 21 6Z"
        fill="currentColor"
      />
      <circle cx="23.3" cy="10.4" r="1.1" fill="#1c1c1f" />
    </svg>
  )
}
