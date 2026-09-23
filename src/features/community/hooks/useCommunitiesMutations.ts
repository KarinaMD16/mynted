import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createCommunity,
  createCommunityRules,
  deactivateCommunity,
  deleteCommunityRule,
  joinCommunity,
  leaveCommunity,
  setCommunityPrivacy,
  updateCommunity,
  updateCommunityRule,
} from "../services/communityService"
import { communityKeys } from "./useCommunitiesQueries"


export const useCreateCommunity = () => {
  const queryClient = useQueryClient()
  
  const createCommunityMutation = useMutation({
    mutationFn: async (data: FormData) => createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
    onError: (error) => {
      console.error('Error creating community:', error)
    }
  })

  return createCommunityMutation
}


export const useJoinCommunity = (communityId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => joinCommunity(communityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

export const useLeaveCommunity = (communityId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveCommunity(communityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}


export const useCommunityModeration = (communityId: number) => {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: communityKeys.all })

  const addRules = useMutation({
    mutationFn: (descriptions: string[]) => createCommunityRules(communityId, descriptions),
    onSuccess: refresh,
  })

  const editRule = useMutation({
    mutationFn: ({ ruleId, description }: { ruleId: number; description: string }) =>
      updateCommunityRule(communityId, ruleId, description),
    onSuccess: refresh,
  })

  const removeRule = useMutation({
    mutationFn: (ruleId: number) => deleteCommunityRule(communityId, ruleId),
    onSuccess: refresh,
  })

  const saveSettings = useMutation({
    mutationFn: (data: FormData) => updateCommunity(communityId, data),
    onSuccess: refresh,
  })

  const changePrivacy = useMutation({
    mutationFn: (isPrivate: boolean) => setCommunityPrivacy(communityId, isPrivate),
    onSuccess: refresh,
  })

  const deactivate = useMutation({
    mutationFn: () => deactivateCommunity(communityId),
    onSuccess: refresh,
  })

  return { addRules, editRule, removeRule, saveSettings, changePrivacy, deactivate }
}
