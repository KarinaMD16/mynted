import { useState } from 'react'

/**
 * Devuelve `value`, o el último valor no nulo que tuvo. Sirve para que un
 * diálogo siga mostrando su contenido mientras corre la animación de cierre,
 * aunque el dato que lo abre (p. ej. el id seleccionado) ya haya vuelto a null.
 */
export function useLastDefined<T>(value: T | null | undefined): T | null {
  const [last, setLast] = useState<T | null>(value ?? null)
  // Actualizar estado durante el render es el patrón recomendado por React
  // para derivar de props (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  if (value != null && value !== last) setLast(value)
  return value ?? last
}
