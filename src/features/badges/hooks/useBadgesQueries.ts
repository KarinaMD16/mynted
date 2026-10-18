import { useQuery } from '@tanstack/react-query'
import type { BadgeScope } from '../models/badges'
import { getBadgeCatalog, getCommunityProfileBadges, getMyBadges, getUserBadges } from '../services/badgesService'

export const badgeKeys = {
  all: ['badges'] as const,
  catalog: (scope: BadgeScope | 'all') => [...badgeKeys.all, 'catalog', scope] as const,
  mine: () => [...badgeKeys.all, 'me'] as const,
  user: (userId: string) => [...badgeKeys.all, 'user', userId] as const,
  communityProfile: (communityProfileId: number) => [...badgeKeys.all, 'community-profile', communityProfileId] as const,
}

/**
 * Los badges se otorgan de forma asíncrona en el backend (un instante después
 * de publicar, responder, etc.), así que no se cachean mucho tiempo: al volver
 * al perfil se vuelven a pedir y aparecen los recién ganados.
 */
const BADGES_STALE_TIME = 1000 * 30

/** El catálogo casi no cambia: se pide una vez por sesión. */
export function useBadgeCatalog(scope?: BadgeScope, enabled = true) {
  return useQuery({
    queryKey: badgeKeys.catalog(scope ?? 'all'),
    queryFn: () => getBadgeCatalog(scope),
    enabled,
    staleTime: 1000 * 60 * 30,
  })
}

export function useMyBadges(enabled = true) {
  return useQuery({
    queryKey: badgeKeys.mine(),
    queryFn: getMyBadges,
    enabled,
    staleTime: BADGES_STALE_TIME,
  })
}

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
