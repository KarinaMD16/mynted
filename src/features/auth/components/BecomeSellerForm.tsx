import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Banknote, LoaderCircle, Wallet } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { TextField } from '@/components/ui/TextField'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRequestSellerMutation } from '../hooks/useAuthMutations'
import { makeRequestSellerSchema } from '../schema/sellerSchema'
import type { PaymentType } from '../models/auth'

interface BecomeSellerFormProps {
  isOpen: boolean
  onClose: () => void
}

/** Modal de solicitud de vendedor, abierto desde el CTA "Convertite en vendedor" en /profile (ver ProfilePage). */
export function BecomeSellerForm({ isOpen, onClose }: BecomeSellerFormProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-lg">
        <BecomeSellerDialogBody onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function BecomeSellerDialogBody({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [isDone, setIsDone] = useState(false)

  const requestSellerSchema = useMemo(() => makeRequestSellerSchema(t), [t])
  const requestSellerMutation = useRequestSellerMutation()

  const form = useForm({
    defaultValues: {
      displayName: '',
      description: '',
      location: '',
      ownerFullName: '',
      type: 'bank_account' as PaymentType,
      name: '',
      number: '',
    },
    validators: { onChange: requestSellerSchema },
    onSubmit: async ({ value }) => {
      try {
        await requestSellerMutation.mutateAsync(value)
        setIsDone(true)
      } catch {
        // el hook muestra el error abajo del form
      }
    },
  })

  if (isDone) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('profile.becomeSeller.successTitle')}</DialogTitle>
          <DialogDescription>{t('profile.becomeSeller.successBody')}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-mynted-orange px-6 py-2.5 font-heading text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover"
          >
            {t('profile.becomeSeller.done')}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('profile.becomeSeller.title')}</DialogTitle>
        <DialogDescription>{t('profile.becomeSeller.subtitle')}</DialogDescription>
      </DialogHeader>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
          <form.Field name="displayName">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <TextField
                  label={t('profile.becomeSeller.displayNameLabel')}
                  placeholder={t('profile.becomeSeller.displayNamePlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={error}
                />
              )
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={field.name} className="text-[13px] font-medium text-mynted-ink">
                    {t('profile.becomeSeller.descriptionLabel')}
                  </label>
                  <textarea
                    id={field.name}
                    rows={3}
                    placeholder={t('profile.becomeSeller.descriptionPlaceholder')}
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
                  label={t('profile.becomeSeller.locationLabel')}
                  placeholder={t('profile.becomeSeller.locationPlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={error}
                />
              )
            }}
          </form.Field>

          <form.Field name="ownerFullName">
            {(field) => {
              const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
              return (
                <TextField
                  label={t('profile.becomeSeller.ownerFullNameLabel')}
                  placeholder={t('profile.becomeSeller.ownerFullNamePlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={error}
                />
              )
            }}
          </form.Field>

          <form.Field name="type">
            {(typeField) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-mynted-ink">{t('profile.becomeSeller.paymentTypeLabel')}</span>
                <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={typeField.state.value === 'bank_account'}
                    onClick={() => typeField.handleChange('bank_account')}
                    className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors hover:cursor-pointer ${
                      typeField.state.value === 'bank_account'
                        ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
                        : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
                    }`}
                  >
                    <Banknote className="size-4" aria-hidden="true" />
                    {t('profile.becomeSeller.paymentTypeBank')}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={typeField.state.value === 'paypal'}
                    onClick={() => typeField.handleChange('paypal')}
                    className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors hover:cursor-pointer ${
                      typeField.state.value === 'paypal'
                        ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
                        : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
                    }`}
                  >
                    <Wallet className="size-4" aria-hidden="true" />
                    {t('profile.becomeSeller.paymentTypePaypal')}
                  </button>
                </div>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.type}>
            {(paymentType) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="name">
                  {(field) => {
                    const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
                    return (
                      <TextField
                        label={paymentType === 'paypal' ? t('profile.becomeSeller.paypalNameLabel') : t('profile.becomeSeller.bankNameLabel')}
                        placeholder={
                          paymentType === 'paypal'
                            ? t('profile.becomeSeller.paypalNamePlaceholder')
                            : t('profile.becomeSeller.bankNamePlaceholder')
                        }
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        error={error}
                      />
                    )
                  }}
                </form.Field>

                <form.Field name="number">
                  {(field) => {
                    const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
                    return (
                      <TextField
                        label={paymentType === 'paypal' ? t('profile.becomeSeller.paypalEmailLabel') : t('profile.becomeSeller.bankNumberLabel')}
                        placeholder={
                          paymentType === 'paypal'
                            ? t('profile.becomeSeller.paypalEmailPlaceholder')
                            : t('profile.becomeSeller.bankNumberPlaceholder')
                        }
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        error={error}
                      />
                    )
                  }}
                </form.Field>
              </div>
            )}
          </form.Subscribe>
        </div>

        {requestSellerMutation.isError && (
          <p className="mt-4 text-right text-sm text-red-500" role="alert">
            {getApiErrorMessage(requestSellerMutation.error)}
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-mynted-border bg-white px-6 py-2.5 font-heading text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
          >
            {t('profile.becomeSeller.cancel')}
          </button>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || requestSellerMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-mynted-orange px-6 py-2.5 font-heading text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || requestSellerMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    {t('profile.becomeSeller.submitting')}
                  </>
                ) : (
                  t('profile.becomeSeller.submit')
                )}
              </button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </>
  )
}
