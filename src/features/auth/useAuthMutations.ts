import { useMutation } from '@tanstack/react-query'
import { loginRequest, registerRequest, socialLoginRequest } from './api'

/** Mutation de login, lista para usarse en el formulario. Ver api.ts para el estado del backend. */
export function useLoginMutation() {
  return useMutation({
    mutationFn: loginRequest,
  })
}

/** Mutation de registro/creación de cuenta. */
export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerRequest,
  })
}

/** Mutation compartida por los botones de login social (Google / Facebook). */
export function useSocialLoginMutation() {
  return useMutation({
    mutationFn: socialLoginRequest,
  })
}
