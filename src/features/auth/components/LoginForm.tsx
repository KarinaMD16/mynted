import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useForm } from '@tanstack/react-form'
import { SocialButtons } from './SocialButtons'
import { useLoginMutation } from '../hooks/useAuthMutations'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const loginMutation = useLoginMutation()

  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value)
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
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">Sign in to keep collecting with your communities.</p>
      </div>

      <form.Field
        name="identifier"
        validators={{
          onChange: ({ value }) => (!value ? 'Ingresá tu correo o username' : undefined),
        }}
      >
        {(field) => (
          <TextField
            label="Email or username"
            type="text"
            autoComplete="username"
            placeholder="Enter your email or username"
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
          onChange: ({ value }) => (!value ? 'La contraseña es obligatoria' : undefined),
        }}
      >
        {(field) => (
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="hover:cursor-pointer" disabled={!canSubmit || loginMutation.isPending}>
            {isSubmitting || loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          </Button>
        )}
      </form.Subscribe>

      {loginMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {(loginMutation.error as Error).message}
        </p>
      )}

      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full text-center text-[13px] font-semibold text-mynted-orange  hover:cursor-pointer hover:underline"
      >
        Don't have an account? Create one
      </button>

      <SocialButtons />
    </form>
  )
}
