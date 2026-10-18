import { useQuery } from '@tanstack/react-query'
import { getCommunityProfileBadges, getUserBadges } from '../services/badgesService'

export const badgeKeys = {
  all: ['badges'] as const,
  user: (userId: string) => [...badgeKeys.all, 'user', userId] as const,
  communityProfile: (communityProfileId: number) => [...badgeKeys.all, 'community-profile', communityProfileId] as const,
}

/**
 * Los badges se otorgan de forma asíncrona en el backend (un instante después
 * de publicar, responder, etc.), así que no se cachean mucho tiempo: al volver
 * al perfil se vuelven a pedir y aparecen los recién ganados.
 */
const BADGES_STALE_TIME = 1000 * 30

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: badgeKeys.user(userId ?? ''),
    queryFn: () => getUserBadges(userId as string),
    enabled: Boolean(userId),
    staleTime: BADGES_STALE_TIME,
  })
}

export function useCommunityProfileBadges(communityProfileId: number | undefined) {
  return useQuery({
    queryKey: badgeKeys.communityProfile(communityProfileId ?? 0),
    queryFn: () => getCommunityProfileBadges(communityProfileId as number),
    enabled: communityProfileId !== undefined,
    staleTime: BADGES_STALE_TIME,
  })
}
