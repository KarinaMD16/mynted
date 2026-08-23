/**
 * Extrae el mensaje del primer error de un campo de TanStack Form.
 * Soporta tanto los issues de un schema de zod (`{ message }`) como los
 * strings devueltos por validadores manuales (`onChange: ({ value }) => '...'`).
 */
export function getFieldErrorMessage(errors: unknown[]): string | undefined {
  const [firstError] = errors
  if (!firstError) return undefined
  if (typeof firstError === 'string') return firstError
  if (typeof firstError === 'object' && 'message' in firstError) {
    return String((firstError as { message: unknown }).message)
  }
  return undefined
}
