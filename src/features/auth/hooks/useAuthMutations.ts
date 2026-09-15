import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '../models/auth'
import {
  forgotPasswordRequest,
  getCurrentUserRequest,
  getUserByIdRequest,
  loginRequest,
  loginWithFacebookRequest,
  loginWithGoogleRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
  updateProfileRequest,
} from '../services/authServices'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * "¿Hay sesión, y de quién?" — la fuente de verdad es GET /users/me, que el
 * backend valida contra la cookie de sesión (ver el interceptor de refresh
 * en api/apiConfig.ts). Un 401 acá significa "no hay sesión", no un error
 * de la app, así que no tiene sentido reintentar (ver useCurrentUser).
 */
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUserRequest,
    retry: false,
  })
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

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPasswordRequest,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPasswordRequest,
  })
}

/**
 * Actualiza el perfil (ver EditProfileForm). useCurrentUser/ProfilePage leen
 * de useCurrentUserQuery (clave authKeys.me), así que ahí hay que refrescar
 * el cache — ya tenemos el usuario actualizado en la respuesta, así que se
 * puede hacer setQueryData directo sin esperar a un refetch.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authKeys.me, user)
    },
  })
}
