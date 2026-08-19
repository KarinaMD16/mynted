import { useForm } from '@tanstack/react-form'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { SocialButtons } from './SocialButtons'
import { useRegisterMutation } from './useAuthMutations'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const registerMutation = useRegisterMutation()

  const form = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync(value)
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

      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'El correo es obligatorio'
            if (!EMAIL_PATTERN.test(value)) return 'Ingresá un correo válido'
            return undefined
          },
        }}
      >
        {(field) => (
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="username"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'El username es obligatorio'
            if (value.length < 3) return 'Debe tener al menos 3 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <TextField
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'La contraseña es obligatoria'
            if (value.length < 8) return 'Debe tener al menos 8 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter a password"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="hover:cursor-pointer" disabled={!canSubmit || registerMutation.isPending}>
            {isSubmitting || registerMutation.isPending ? 'Creating account…' : 'Register'}
          </Button>
        )}
      </form.Subscribe>

      {registerMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {(registerMutation.error as Error).message}
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
