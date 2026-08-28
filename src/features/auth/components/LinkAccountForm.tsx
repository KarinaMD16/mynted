import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { z } from 'zod'
import { useConfirmLinkMutation } from '../hooks/useAuthMutations'
import { PROVIDER_LABELS, type OAuthProvider } from '../models/auth'

const passwordField = z.string().min(1, 'Password is required')

interface LinkAccountFormProps {
  email: string
  provider: OAuthProvider
}

/**
 * Último paso de la vinculación cuando el email del proveedor ya tenía una
 * cuenta local sin verificar.
 *
 * El backend no vincula solo por coincidencia de email: quien haya registrado
 * antes esa dirección se quedaría dentro de la cuenta del dueño real. La
 * contraseña es la prueba de que ambas cuentas son de la misma persona.
 */
export function LinkAccountForm({ email, provider }: LinkAccountFormProps) {
  const confirmLink = useConfirmLinkMutation()
  const navigate = useNavigate()
  const providerLabel = PROVIDER_LABELS[provider]

  const form = useForm({
    defaultValues: { password: '' },
    onSubmit: async ({ value }) => {
      await confirmLink.mutateAsync(value)
      await navigate({ to: '/' })
    },
  })

  return (
    <form
      className="flex w-full flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
      noValidate
    >
      <div>
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">
          Link your {providerLabel} account
        </h1>
        <p className="mt-1.5 text-sm text-mynted-gray">
          There's already a Mynted account for <span className="font-semibold">{email}</span>.
          Enter its password once and we'll connect both.
        </p>
      </div>

      <form.Field name="password" validators={{ onChange: passwordField }}>
        {(field) => (
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="hover:cursor-pointer"
            disabled={!canSubmit || confirmLink.isPending}
          >
            {isSubmitting || confirmLink.isPending ? 'Linking…' : `Link ${providerLabel}`}
          </Button>
        )}
      </form.Subscribe>

      {confirmLink.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(confirmLink.error)}
        </p>
      )}

      <button
        type="button"
        onClick={() => void navigate({ to: '/login' })}
        className="w-full text-center text-[13px] font-semibold text-mynted-orange hover:cursor-pointer hover:underline"
      >
        Cancel and go back to sign in
      </button>
    </form>
  )
}
