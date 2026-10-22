import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getHttpStatus } from '@/api/apiError'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { openConversationInLauncher } from '../utils/chatLauncherBus'
import { contactErrorKey } from '../utils/contactError'
import { useOpenConversation } from './useChatMutations'

/**
 * "Contactar" desde una tarjeta de producto: abre (o retoma) la conversación
 * con POST /conversations y la muestra en la hoja de mensajes, la misma que
 * abre el CTA del detalle, sin salir de la pantalla. Sin sesión lleva a
 * /login. Si en esa pantalla no hay hoja, abre /messages/:id.
 */
export function useContactSeller() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { isLoggedIn, isLoading } = useCurrentUser()
  const openConversation = useOpenConversation()

  const contact = (productId: number) => {
    if (isLoading || openConversation.isPending) return
    if (!isLoggedIn) {
      void navigate({ to: '/login' })
      return
    }
    openConversation.mutate(productId, {
      onSuccess: (conversation) => {
        if (!openConversationInLauncher(conversation.id)) {
          void navigate({ to: '/messages/$conversationId', params: { conversationId: String(conversation.id) } })
        }
      },
      onError: (error) => {
        if (getHttpStatus(error) === 401) void navigate({ to: '/login' })
        else toast.error(t(contactErrorKey(error)))
      },
    })
  }

  return { contact, isOpening: openConversation.isPending }
}
