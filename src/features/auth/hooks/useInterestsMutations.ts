import { useMutation, useQuery } from '@tanstack/react-query'
import { getInterestsRequest, getMyInterestsRequest, saveInterestsRequest } from '../services/interestsServices'

export function useInterestsQuery() {
  return useQuery({
    queryKey: ['interests'],
    queryFn: getInterestsRequest,
  })
}

export function useSaveInterestsMutation() {
  return useMutation({
    mutationFn: saveInterestsRequest,
  })
}

/** `enabled` debe ser `false` mientras no haya sesión, para no pegarle a /users/me/tags sin cookie. */
export function useMyInterestsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['interests', 'me'],
    queryFn: getMyInterestsRequest,
    enabled,
  })
}
