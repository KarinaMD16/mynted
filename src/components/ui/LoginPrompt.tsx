import { SignedOutState } from '@/components/errors/QueryErrorState'

/**
 * Invitación a iniciar sesión. Se muestra cuando una pantalla pública (Explorar) pide datos y el
 * backend responde 401, es decir, cuando ese endpoint todavía exige sesión. Si el endpoint es
 * público, esta tarjeta nunca aparece. Usa el estado "sin sesión" del ganso (cant-access).
 */
export function LoginPrompt({ message }: { message: string }) {
  return <SignedOutState description={message} />
}
