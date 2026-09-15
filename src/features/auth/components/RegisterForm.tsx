import { TextField } from '@/components/ui/TextField'
import { useForm } from '@tanstack/react-form'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { SocialButtons } from './SocialButtons'
import { Button } from '@/components/ui/Button'
import { setCurrentUserId } from '../hooks/useCurrentUser'
import { useLoginMutation, useRegisterMutation } from '../hooks/useAuthMutations'
import { registerSchema } from '../schema/authSchemas'

interface RegisterFormProps {
  onSwitchToLogin: () => void
  onRegistered: () => void
}

export function RegisterForm({ onSwitchToLogin, onRegistered }: RegisterFormProps) {
  const registerMutation = useRegisterMutation()
  const loginMutation = useLoginMutation()

  const form = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync(value)
      // POST /users crea la cuenta pero no abre sesión (todavía no hay cookie
      // JWT); sin este login, el siguiente paso (elegir intereses) falla con
      // 401 Unauthorized. Iniciamos sesión con las mismas credenciales para
      // obtener la cookie de sesión antes de continuar.
      const user = await loginMutation.mutateAsync({ email: value.email, password: value.password })
      setCurrentUserId(user.id)
      onRegistered()
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
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">Join collectors of every age, from every fandom.</p>
      </div>

      <form.Field name="email" validators={{ onChange: registerSchema.shape.email }}>
        {(field) => (
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="username" validators={{ onChange: registerSchema.shape.username }}>
        {(field) => (
          <TextField
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: registerSchema.shape.password }}>
        {(field) => (
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter a password"
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
            disabled={!canSubmit || registerMutation.isPending || loginMutation.isPending}
          >
            {isSubmitting || registerMutation.isPending || loginMutation.isPending ? 'Creating account…' : 'Register'}
          </Button>
        )}
      </form.Subscribe>

      {(registerMutation.isError || loginMutation.isError) && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(registerMutation.error ?? loginMutation.error)}
        </p>
      )}

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-center text-[13px] font-semibold text-mynted-orange hover:cursor-pointer hover:underline"
      >
        I already have an account
      </button>

      <SocialButtons />
    </form>
  )
}
