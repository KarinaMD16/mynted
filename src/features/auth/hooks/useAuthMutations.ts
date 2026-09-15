import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '../models/auth'
import {
  getUserByIdRequest,
  loginRequest,
  loginWithFacebookRequest,
  loginWithGoogleRequest,
  logoutRequest,
  registerRequest,
} from '../services/authServices'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => queryClient.setQueryData<AuthUser>(authKeys.me, user),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerRequest,
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => queryClient.removeQueries({ queryKey: authKeys.me }),
  })
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginWithGoogleRequest,
    onSuccess: (user) => queryClient.setQueryData<AuthUser>(authKeys.me, user),
  })
}

export function useFacebookLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginWithFacebookRequest,
    onSuccess: (user) => queryClient.setQueryData<AuthUser>(authKeys.me, user),
  })
}

export function useUserByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserByIdRequest(id as string),
    enabled: Boolean(id),
  })
}
