import { useMutation } from '@tanstack/react-query'
import { loginRequest, registerRequest, socialLoginRequest } from './api'

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

export function useSocialLoginMutation() {
  return useMutation({
    mutationFn: socialLoginRequest,
  })
}
