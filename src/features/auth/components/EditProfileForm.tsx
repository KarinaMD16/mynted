import { useEffect, useId, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import { Camera, LoaderCircle } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { TextField } from '@/components/ui/TextField'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AuthUser } from '../models/auth'
import { useUpdateProfileMutation } from '../hooks/useAuthMutations'
import { makeEditProfileSchema } from '../schema/editProfileSchema'
import { Button } from '@/components/ui/Button'

interface EditProfileFormProps {
  isOpen: boolean
  onClose: () => void
  user: AuthUser
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

/** Modal de editar perfil, abierto desde el botón "Editar perfil" del header de /profile (ver ProfilePage). */
export function EditProfileForm({ isOpen, onClose, user }: EditProfileFormProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-lg">
        <EditProfileDialogBody onClose={onClose} user={user} />
      </DialogContent>
    </Dialog>
  )
}

function EditProfileDialogBody({ onClose, user }: { onClose: () => void; user: AuthUser }) {
  const { t } = useLanguage()
  const avatarInputId = useId()

  const [avatar, setAvatar] = useState<{ file: File; previewUrl: string } | null>(null)
  const editProfileSchema = useMemo(() => makeEditProfileSchema(t), [t])
  const updateProfileMutation = useUpdateProfileMutation()

  const form = useForm({
    defaultValues: {
      username: user.username,
      bio: user.bio ?? '',
      location: user.location ?? '',
    },
    validators: { onChange: editProfileSchema },
    onSubmit: async ({ value }) => {
      // Siempre se mandan los tres campos (aunque no hayan cambiado): el
      // backend exige al menos un campo o una foto en el PATCH, y mandar el
      // mismo valor de vuelta es inofensivo.
      const formData = new FormData()
      formData.append('username', value.username.trim())
      formData.append('bio', value.bio.trim())
      formData.append('location', value.location.trim())
      if (avatar) formData.append('photo', avatar.file)

      try {
        await updateProfileMutation.mutateAsync(formData)
        onClose()
      } catch {
        // el hook muestra el error abajo del form
      }
    },
  })

  useEffect(
    () => () => {
      if (avatar) URL.revokeObjectURL(avatar.previewUrl)
    },
    [avatar],
  )

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatar({ file, previewUrl: URL.createObjectURL(file) })
  }

  const avatarPreviewUrl = avatar?.previewUrl ?? user.photoUrl ?? null

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('profile.edit.title')}</DialogTitle>
        <DialogDescription>{t('profile.edit.subtitle')}</DialogDescription>
      </DialogHeader>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <label
              htmlFor={avatarInputId}
              aria-label={t('profile.edit.changePhotoLabel')}
              className="group relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-xl font-semibold text-white shadow-sm transition-transform hover:scale-105"
            >
              {avatarPreviewUrl ? (
                <img src={avatarPreviewUrl} alt="" className="size-full object-cover" />
              ) : (
                getInitials(user.username)
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5 text-white" aria-hidden="true" />
              </span>
            </label>
            <input
              id={avatarInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-mynted-gray">{t('profile.edit.avatarHint')}</p>
          </div>

          <form.Field name="username">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <TextField
                  label={t('auth.usernameLabel')}
                  placeholder={t('auth.usernamePlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={error}
                />
              )
            }}
          </form.Field>

          <form.Field name="bio">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={field.name} className="text-[13px] font-medium text-mynted-ink">
                    {t('profile.edit.bioLabel')}
                  </label>
                  <textarea
                    id={field.name}
                    rows={3}
                    placeholder={t('profile.edit.bioPlaceholder')}
                    className={`w-full resize-y rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20 ${
                      error ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
                    }`}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                  {error && <span className="text-xs text-red-500">{error}</span>}
                </div>
              )
            }}
          </form.Field>

          <form.Field name="location">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <TextField
                  label={t('profile.edit.locationLabel')}
                  placeholder={t('profile.edit.locationPlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={error}
                />
              )
            }}
          </form.Field>
        </div>

        {updateProfileMutation.isError && (
          <p className="mt-4 text-right text-sm text-red-500" role="alert">
            {getApiErrorMessage(updateProfileMutation.error)}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            {t('profile.edit.cancel')}
          </Button>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || updateProfileMutation.isPending}
                variant="primary"
                size="md"
              >
                {isSubmitting || updateProfileMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    {t('profile.edit.saving')}
                  </>
                ) : (
                  t('profile.edit.submit')
                )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </>
  )
}
