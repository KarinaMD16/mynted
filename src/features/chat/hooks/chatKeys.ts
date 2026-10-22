/** Claves de React Query del chat. Todo cuelga de `chatKeys.all` para poder invalidarlo de una vez. */
export const chatKeys = {
  all: ['chat'] as const,
  inbox: () => [...chatKeys.all, 'inbox'] as const,
  unreadCount: () => [...chatKeys.all, 'unread-count'] as const,
  messagesAll: () => [...chatKeys.all, 'messages'] as const,
  messages: (conversationId: number) => [...chatKeys.messagesAll(), conversationId] as const,
}
