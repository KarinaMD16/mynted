import { useEffect, useId, useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, Camera, Clock, ExternalLink, ShoppingBag, XCircle } from 'lucide-react'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES, SUPPORTED_CURRENCIES } from '@/utils/locale'
import { Button } from '@/components/ui/Button'
import type { AuthUser } from '@/features/auth/models/auth'
import { BecomeSellerForm } from '@/features/auth/components/BecomeSellerForm'
import { useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations'
import { makeEditProfileSchema } from '@/features/auth/schema/editProfileSchema'
import { toProfileFormData, useSavedFlash } from '../hooks/useSavedFlash'
import { SettingsCard, SettingsFormFooter } from './SettingsCard'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const BIO_MAX_LENGTH = 500

/** Pestaña "Perfil": foto, biografía y (si aplica) ajustes de vendedor. */
export function ProfileSettingsSection({ user }: { user: AuthUser }) {
  return (
    <div className="flex flex-col gap-6">
      <PublicProfileCard user={user} />
      <SellerCard user={user} />
    </div>
  )
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

/** Foto de perfil + biografía, lo que ven los demás en /profile. */
function PublicProfileCard({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const photoInputId = useId()
  const updateProfile = useUpdateProfileMutation()
  const saved = useSavedFlash()

  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const bioSchema = useMemo(() => makeEditProfileSchema(t).pick({ bio: true }), [t])

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.previewUrl)
    },
    [photo],
  )

  const form = useForm({
    defaultValues: { bio: user.bio ?? '' },
    validators: { onChange: bioSchema },
    onSubmit: async ({ value }) => {
      try {
        const updated = await updateProfile.mutateAsync(
          toProfileFormData({ bio: value.bio.trim(), photo: photo?.file }),
        )
        setPhoto(null)
        form.reset({ bio: updated.bio ?? '' })
        saved.flash()
      } catch {
        // el error se muestra en el pie del formulario
      }
    },
  })

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    // Mismo límite que el FileInterceptor del backend (5 MB): mejor avisar
    // antes que esperar a que la subida falle.
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t('settings.profile.photoTooLarge'))
      return
    }
    setPhotoError(null)
    setPhoto({ file, previewUrl: URL.createObjectURL(file) })
  }

  const previewUrl = photo?.previewUrl ?? user.photoUrl ?? null

  return (
    <SettingsCard title={t('settings.profile.publicTitle')} description={t('settings.profile.publicDescription')}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label
            htmlFor={photoInputId}
            aria-label={t('profile.edit.changePhotoLabel')}
            className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-2xl font-semibold text-white shadow-sm"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              getInitials(user.username)
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" aria-hidden="true" />
            </span>
          </label>
          <input
            id={photoInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handlePhotoChange}
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-mynted-ink">{t('settings.profile.photoLabel')}</p>
            <p className="text-xs text-mynted-gray">{t('settings.profile.photoHint')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById(photoInputId)?.click()}
              >
                <Camera className="size-4" aria-hidden="true" />
                {t('settings.profile.uploadPhoto')}
              </Button>
              {photo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                  {t('settings.profile.discardPhoto')}
                </Button>
              )}
            </div>
            {photoError && (
              <p className="text-xs text-red-500" role="alert">
                {photoError}
              </p>
            )}
          </div>
        </div>

        <form.Field name="bio">
          {(field) => {
            const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
            return (
              <div className="mt-6 flex flex-col gap-1.5">
                <label htmlFor={field.name} className="text-[13px] font-medium text-mynted-ink">
                  {t('profile.edit.bioLabel')}
                </label>
                <textarea
                  id={field.name}
                  rows={4}
                  placeholder={t('profile.edit.bioPlaceholder')}
                  className={`w-full resize-y rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20 ${
                    error ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
                  }`}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-red-500">{error}</span>
                  <span className="text-mynted-gray">
                    {field.state.value.length}/{BIO_MAX_LENGTH}
                  </span>
                </div>
              </div>
            )
          }}
        </form.Field>

        <SettingsFormFooter error={updateProfile.isError ? updateProfile.error : undefined} showSaved={saved.isVisible}>
          <Link
            to="/profile"
            className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-mynted-gray transition-colors hover:bg-mynted-bg hover:text-mynted-ink"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t('settings.profile.viewProfile')}
          </Link>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty] as const}>
            {([canSubmit, isDirty]) => (
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmit || (!isDirty && !photo)}
                isLoading={updateProfile.isPending}
              >
                {t('settings.save')}
              </Button>
            )}
          </form.Subscribe>
        </SettingsFormFooter>
      </form>
    </SettingsCard>
  )
}

/**
 * Estado de vendedor. El backend todavía no tiene un endpoint para editar
 * la tienda ni los datos de pago después de la solicitud, así que aquí solo
 * se puede: solicitar (o volver a solicitar si fue rechazada) y, ya siendo
 * vendedor, elegir la moneda con la que publica sus precios.
 */
function SellerCard({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const [isRequestOpen, setIsRequestOpen] = useState(false)

  const isSeller = user.role === 'seller'
  const status = user.sellerRequestStatus ?? 'none'

  return (
    <SettingsCard title={t('settings.profile.sellerTitle')} description={t('settings.profile.sellerDescription')}>
      {isSeller ? (
        <div className="flex flex-col gap-5">
          <StatusBanner
            tone="success"
            icon={<BadgeCheck className="size-5" aria-hidden="true" />}
            title={t('settings.profile.sellerActiveTitle')}
            body={t('settings.profile.sellerActiveBody')}
          />
          <CurrencyForm user={user} />
        </div>
      ) : status === 'pending' ? (
        <StatusBanner
          tone="neutral"
          icon={<Clock className="size-5" aria-hidden="true" />}
          title={t('settings.profile.sellerPendingTitle')}
          body={t('settings.profile.sellerPendingBody')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {status === 'rejected' && (
            <StatusBanner
              tone="danger"
              icon={<XCircle className="size-5" aria-hidden="true" />}
              title={t('settings.profile.sellerRejectedTitle')}
              body={t('settings.profile.sellerRejectedBody')}
            />
          )}
          <div className="flex flex-col gap-3 rounded-xl bg-mynted-bg p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-mynted-ink">{t('settings.profile.sellerCtaBody')}</p>
            <Button type="button" variant="primary" size="md" onClick={() => setIsRequestOpen(true)}>
              <ShoppingBag className="size-4" aria-hidden="true" />
              {status === 'rejected' ? t('settings.profile.sellerRetry') : t('profile.becomeSeller.cta')}
            </Button>
          </div>
        </div>
      )}

      <BecomeSellerForm isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </SettingsCard>
  )
}

function StatusBanner({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'success' | 'neutral' | 'danger'
  icon: ReactNode
  title: string
  body: string
}) {
  const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    neutral: 'border-mynted-border bg-mynted-bg text-mynted-ink',
    danger: 'border-red-200 bg-red-50 text-red-700',
  }[tone]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${toneClasses}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{body}</p>
      </div>
    </div>
  )
}

/** Moneda de publicación del vendedor (la usa CreateProductDialog). */
function CurrencyForm({ user }: { user: AuthUser }) {
  const { t, language } = useLanguage()
  const updateProfile = useUpdateProfileMutation()
  const saved = useSavedFlash()
  const currentCurrency = user.currency ?? 'CRC'
  const [currency, setCurrency] = useState(currentCurrency)

  const currencyNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(INTL_LOCALES[language], { type: 'currency' })
    } catch {
      return null
    }
  }, [language])

  const options = SUPPORTED_CURRENCIES.includes(currentCurrency)
    ? SUPPORTED_CURRENCIES
    : [currentCurrency, ...SUPPORTED_CURRENCIES]

  const save = () => {
    updateProfile.mutate(toProfileFormData({ currency }), { onSuccess: () => saved.flash() })
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-currency" className="text-[13px] font-medium text-mynted-ink">
          {t('settings.profile.currencyLabel')}
        </label>
        <select
          id="settings-currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="w-full rounded-[10px] border border-mynted-border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20 sm:max-w-sm"
        >
          {options.map((code) => {
            const name = currencyNames?.of(code)
            return (
              <option key={code} value={code}>
                {name && name !== code ? `${name} (${code})` : code}
              </option>
            )
          })}
        </select>
        <p className="text-xs text-mynted-gray">{t('settings.profile.currencyHint')}</p>
      </div>

      <SettingsFormFooter error={updateProfile.isError ? updateProfile.error : undefined} showSaved={saved.isVisible}>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={currency === currentCurrency}
          isLoading={updateProfile.isPending}
          onClick={save}
        >
          {t('settings.save')}
        </Button>
      </SettingsFormFooter>
    </div>
  )
}
