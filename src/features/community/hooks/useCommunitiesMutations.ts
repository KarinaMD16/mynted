import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCommunity, joinCommunity, leaveCommunity } from "../services/communityService"
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
