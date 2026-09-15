import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCommunity } from "../services/communityService"


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

