import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

/**
 * Lleva al elemento del `#hash` de la URL cuando el contenido ya está en
 * pantalla (`isReady`). El router intenta hacerlo al navegar, pero en páginas
 * que cargan sus datos después (detalle de producto, respuestas de un post)
 * el elemento todavía no existe en ese momento. Se hace una sola vez por hash.
 */
export function useScrollToHash(isReady: boolean) {
  // El router guarda el hash sin '#'; por las dudas se quita si viniera.
  const hash = useRouterState({ select: (state) => state.location.hash.replace(/^#/, '') })
  const doneFor = useRef<string | null>(null)

  useEffect(() => {
    if (!isReady || !hash || doneFor.current === hash) return
    const element = document.getElementById(hash)
    if (!element) return
    doneFor.current = hash
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isReady, hash])
}
