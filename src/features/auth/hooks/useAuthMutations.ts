import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '../models/auth'
import {
  confirmLinkRequest,
  getCurrentUserRequest,
  getIdentitiesRequest,
  getUserByIdRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  setPasswordRequest,
  unlinkProviderRequest,
} from '../services/authServices'

export const authKeys = {
  me: ['auth', 'me'] as const,
  identities: ['auth', 'identities'] as const,
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

/**
 * Sesión actual. `retry: false` porque un 401 significa "no hay sesión",
 * no un fallo transitorio que valga la pena reintentar.
 */
export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUserRequest,
    retry: false,
    enabled: options?.enabled ?? true,
  })
}

/** Cierra la vinculación pendiente con la contraseña de la cuenta local. */
export function useConfirmLinkMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmLinkRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authKeys.me, user)
      void queryClient.invalidateQueries({ queryKey: authKeys.identities })
    },
  })
}

/** Métodos de acceso de la cuenta: contraseña y proveedores vinculados. */
export function useIdentitiesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.identities,
    queryFn: getIdentitiesRequest,
    retry: false,
    enabled: options?.enabled ?? true,
  })
}

export function useSetPasswordMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setPasswordRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authKeys.me, user)
      void queryClient.invalidateQueries({ queryKey: authKeys.identities })
    },
  })
}

export function useUnlinkProviderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: unlinkProviderRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.identities }),
  })
}

export function useUserByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserByIdRequest(id as string),
    enabled: Boolean(id),
  })
}
