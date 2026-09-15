import { useMutation, useQuery } from '@tanstack/react-query'
import { getCommunitiesRequest, joinCommunitiesRequest } from '../services/communitiesServices'

/** Catálogo de comunidades del picker de onboarding (ver nota sobre el endpoint pendiente en communitiesServices.ts). */
export function useOnboardingCommunitiesQuery() {
  return useQuery({
    queryKey: ['communities', 'onboarding'],
    queryFn: getCommunitiesRequest,
  })
}

export function useJoinCommunitiesMutation() {
  return useMutation({
    mutationFn: joinCommunitiesRequest,
  })
}
