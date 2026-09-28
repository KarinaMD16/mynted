import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Muestra "Cambios guardados" unos segundos después de guardar y lo quita
 * solo. `flash()` se llama en el onSuccess de la mutación.
 */
export function useSavedFlash(durationMs = 3000) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(true)
    timeoutRef.current = setTimeout(() => setIsVisible(false), durationMs)
  }, [durationMs])

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  return { isVisible, flash }
}

/**
 * PATCH /users/me es multipart (puede llevar foto), así que hasta los
 * booleanos viajan como texto; el backend los convierte (parseBoolean en
 * UpdateProfileDto). Solo se agregan los campos que se pasan: el backend
 * deja intactos los que no vienen.
 */
export function toProfileFormData(fields: Record<string, string | boolean | File | undefined>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    formData.append(key, value instanceof File ? value : String(value))
  }
  return formData
}
