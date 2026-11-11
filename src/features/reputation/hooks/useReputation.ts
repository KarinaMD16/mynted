import { useQuery } from '@tanstack/react-query'
import { getUserReputation } from '../services/reputationService'

export const reputationKeys = {
  all: ['reputation'] as const,
  user: (userId: string) => [...reputationKeys.all, userId] as const,
}

/** Reputación de un usuario. Cambia solo con reseñas o ventas nuevas: un minuto de caché alcanza. */
export function useUserReputation(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: reputationKeys.user(userId ?? ''),
    queryFn: () => getUserReputation(userId as string),
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
  })
}
