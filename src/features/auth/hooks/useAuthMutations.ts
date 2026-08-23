import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getUserByIdRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  socialLoginRequest,
} from '../services/authServices'

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginRequest,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerRequest,
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logoutRequest,
  })
}

export function useSocialLoginMutation() {
  return useMutation({
    mutationFn: socialLoginRequest,
  })
}

export function useUserByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserByIdRequest(id as string),
    enabled: Boolean(id),
  })
}
