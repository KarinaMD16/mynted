import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useResetPasswordMutation } from '../hooks/useAuthMutations'
import { resetPasswordSchema } from '../schema/authSchemas'

interface ResetPasswordFormProps {
  /** Token de recuperación leído del query param `?token=` del link enviado por correo. */
  token: string | undefined
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const resetPasswordMutation = useResetPasswordMutation()
  const [isDone, setIsDone] = useState(false)

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (!token) return
      await resetPasswordMutation.mutateAsync({ token, newPassword: value.newPassword })
      setIsDone(true)
    },
  })

  if (!token) {
    return (
      <div className="flex w-full flex-col gap-3.5">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">Invalid link</h1>
          <p className="mt-1.5 text-sm text-mynted-gray">
            This password reset link is missing its token. Request a new one to continue.
          </p>
        </div>

        <Button
          type="button"
          className="hover:cursor-pointer"
          onClick={() => void navigate({ to: '/forgot-password' })}
        >
          Request a new link
        </Button>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="flex w-full flex-col gap-3.5">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">Password updated</h1>
          <p className="mt-1.5 text-sm text-mynted-gray">
            Your password has been reset. You can sign in with your new password now.
          </p>
        </div>

        <Button type="button" className="hover:cursor-pointer" onClick={() => void navigate({ to: '/login' })}>
          Go to sign in
        </Button>
      </div>
    )
  }

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
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">Reset your password</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">Choose a new password for your account.</p>
      </div>

      <form.Field name="newPassword" validators={{ onChange: resetPasswordSchema.shape.newPassword }}>
        {(field) => (
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter a new password"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ['newPassword'],
          onChange: ({ value, fieldApi }) =>
            value !== fieldApi.form.getFieldValue('newPassword') ? "Passwords don't match" : undefined,
        }}
      >
        {(field) => (
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
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
            disabled={!canSubmit || resetPasswordMutation.isPending}
          >
            {isSubmitting || resetPasswordMutation.isPending ? 'Updating…' : 'Update password'}
          </Button>
        )}
      </form.Subscribe>

      {resetPasswordMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(resetPasswordMutation.error)}
        </p>
      )}
    </form>
  )
}
