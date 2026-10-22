import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useUnreadCount } from './useChatQueries'

/** No leídos para el badge de "Mensajes" (0 sin sesión). Lo mantiene al día useInboxSync. */
export function useUnreadBadge(): number {
  const { isLoggedIn } = useCurrentUser()
  const unread = useUnreadCount(isLoggedIn)
  return isLoggedIn ? (unread.data ?? 0) : 0
}
