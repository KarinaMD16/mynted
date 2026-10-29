import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CommunityBansQuery, CommunityMembersQuery } from '../models/communityMembers'
import {
  addCommunityModerator,
  banCommunityUser,
  getCommunityBans,
  getCommunityMembers,
  removeCommunityMember,
  removeCommunityModerator,
  transferCommunityOwnership,
  unbanCommunityUser,
} from '../services/communityMembersService'
import { communityKeys } from './useCommunitiesQueries'

const memberKeys = {
  members: (communityId: number, query: CommunityMembersQuery) => [...communityKeys.all, 'members', communityId, query] as const,
  bans: (communityId: number, query: CommunityBansQuery) => [...communityKeys.all, 'bans', communityId, query] as const,
}

export function useCommunityMembers(communityId: number, query: CommunityMembersQuery) {
  return useQuery({
    queryKey: memberKeys.members(communityId, query),
    queryFn: () => getCommunityMembers(communityId, query),
    // Al cambiar de página o de filtro se sigue viendo la lista anterior.
    placeholderData: keepPreviousData,
  })
}

export function useCommunityBans(communityId: number, query: CommunityBansQuery, enabled = true) {
  return useQuery({
    queryKey: memberKeys.bans(communityId, query),
    queryFn: () => getCommunityBans(communityId, query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * Las acciones sobre miembros. Todo vive bajo ['communities']: se recargan la
 * lista, los bloqueos, el detalle (rol de quien mira, si transfirió) y las
 * estadísticas (cantidad de miembros).
 */
export function useCommunityMemberActions(communityId: number) {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: communityKeys.all })

  return {
    addModerator: useMutation({
      mutationFn: (profileId: number) => addCommunityModerator(communityId, profileId),
      onSuccess: refresh,
    }),
    removeModerator: useMutation({
      mutationFn: (profileId: number) => removeCommunityModerator(communityId, profileId),
      onSuccess: refresh,
    }),
    expel: useMutation({
      mutationFn: ({ profileId, reason }: { profileId: number; reason: string }) =>
        removeCommunityMember(communityId, profileId, reason),
      onSuccess: refresh,
    }),
    ban: useMutation({
      mutationFn: ({ userId, reason }: { userId: string; reason: string }) => banCommunityUser(communityId, userId, reason),
      onSuccess: refresh,
    }),
    unban: useMutation({
      mutationFn: (userId: string) => unbanCommunityUser(communityId, userId),
      onSuccess: refresh,
    }),
    transfer: useMutation({
      mutationFn: (profileId: number) => transferCommunityOwnership(communityId, profileId),
      onSuccess: refresh,
    }),
  }
}
