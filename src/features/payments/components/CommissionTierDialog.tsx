import { useState } from 'react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { TextField } from '@/components/ui/TextField'
import { useLanguage } from '@/i18n/LanguageContext'
import { SUPPORTED_CURRENCIES } from '@/utils/locale'
import type { AdminCommissionTier, AdminCommissionTierPayload, CommissionTierType } from '../models/payment'

/** Valores del formulario: todo texto hasta enviarlo, como en el resto de la app. */
interface TierFormValues {
  name: string
  minValue: string
  /** Vacío = sin tope (el último rango de la escala). */
  maxValue: string
  /** En porcentaje (2,5), no en fracción: es lo que lee un administrador. */
  discountPercent: string
  currency: string
  isActive: boolean
}

const NUMBER_FORMAT = /^\d+(\.\d{1,2})?$/

function toForm(tier: AdminCommissionTier | null, currency: string): TierFormValues {
  if (!tier) {
    return { name: '', minValue: '', maxValue: '', discountPercent: '', currency, isActive: true }
  }
  return {
    name: tier.name,
    minValue: String(tier.minValue),
    maxValue: tier.maxValue === null ? '' : String(tier.maxValue),
    // 0.025 -> "2.5". El redondeo evita los 2.4999999999 del punto flotante.
    discountPercent: String(Math.round(tier.discount * 10000) / 100),
    currency: tier.currency ?? currency,
    isActive: tier.isActive,
  }
}

/** Revisa el formulario con las mismas reglas del DTO; devuelve el error por campo. */
function validate(values: TierFormValues, type: CommissionTierType, t: ReturnType<typeof useLanguage>['t']) {
  const errors: Partial<Record<keyof TierFormValues, string>> = {}

  if (values.name.trim() === '') errors.name = t('admin.commissions.form.nameRequired')
  if (!NUMBER_FORMAT.test(values.minValue.trim())) errors.minValue = t('admin.commissions.form.numberFormat')
  if (values.maxValue.trim() !== '' && !NUMBER_FORMAT.test(values.maxValue.trim())) {
    errors.maxValue = t('admin.commissions.form.numberFormat')
  }
  if (!errors.minValue && !errors.maxValue && values.maxValue.trim() !== '') {
    if (Number(values.maxValue) <= Number(values.minValue)) {
      errors.maxValue = t('admin.commissions.form.maxAfterMin')
    }
  }

  const discount = Number(values.discountPercent)
  if (values.discountPercent.trim() === '' || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    errors.discountPercent = t('admin.commissions.form.discountRange')
  }
  if (type === 'price' && values.currency === '') errors.currency = t('admin.commissions.form.currencyRequired')

  return errors
}

interface CommissionTierDialogProps {
  open: boolean
  /** null = crear uno nuevo. */
  tier: AdminCommissionTier | null
  type: CommissionTierType
  /** Moneda elegida en la pestaña, como valor inicial de un rango por precio. */
  currency: string
  isPending: boolean
  error: unknown
  onSubmit: (payload: AdminCommissionTierPayload) => void
  onClose: () => void
}

/**
 * Alta y edición de un rango de comisión.
 *
 * El descuento se escribe en porcentaje porque es como se piensa ("medio punto
 * menos"), y se envía en fracción, que es lo que guarda el backend. Los
 * rangos por ventas no llevan moneda: un nivel es una cantidad de ventas.
 */
export function CommissionTierDialog({
  open,
  tier,
  type,
  currency,
  isPending,
  error,
  onSubmit,
  onClose,
}: CommissionTierDialogProps) {
  const { t } = useLanguage()
  const [values, setValues] = useState<TierFormValues>(() => toForm(tier, currency))
  const [touched, setTouched] = useState(false)

  // El diálogo no se desmonta al cerrarse, así que al abrirlo con otro rango
  // (o para crear uno nuevo) hay que rehacer el formulario. Se ajusta durante
  // el render, comparando con lo último que se cargó: con un efecto, el
  // formulario se vería un instante con los datos del rango anterior.
  const openedFor = open ? `${tier?.id ?? 'new'}:${currency}` : null
  const [loadedFor, setLoadedFor] = useState(openedFor)
  if (openedFor !== loadedFor) {
    setLoadedFor(openedFor)
    setValues(toForm(tier, currency))
    setTouched(false)
  }

  const errors = validate(values, type, t)
  const field = (key: keyof TierFormValues) => (touched ? errors[key] : undefined)

  function handleSubmit() {
    setTouched(true)
    if (Object.keys(errors).length > 0) return

    onSubmit({
      type,
      name: values.name.trim(),
      minValue: Number(values.minValue),
      maxValue: values.maxValue.trim() === '' ? null : Number(values.maxValue),
      currency: type === 'price' ? values.currency : null,
      // De porcentaje a fracción, con los 4 decimales que acepta el backend.
      discount: Math.round(Number(values.discountPercent) * 100) / 10000,
      isActive: values.isActive,
    })
  }

  const isSales = type === 'sales'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t(tier ? 'admin.commissions.form.editTitle' : 'admin.commissions.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t(isSales ? 'admin.commissions.form.salesHint' : 'admin.commissions.form.priceHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <TextField
            label={t('admin.commissions.form.name')}
            placeholder={isSales ? 'Oro' : 'Alto'}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            error={field('name')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t(isSales ? 'admin.commissions.form.minSales' : 'admin.commissions.form.minPrice')}
              placeholder="0"
              inputMode="decimal"
              value={values.minValue}
              onChange={(event) => setValues({ ...values, minValue: event.target.value.replace(',', '.') })}
              error={field('minValue')}
            />
            <div className="flex flex-col gap-1.5">
              <TextField
                label={t(isSales ? 'admin.commissions.form.maxSales' : 'admin.commissions.form.maxPrice')}
                placeholder={t('admin.commissions.form.noLimit')}
                inputMode="decimal"
                value={values.maxValue}
                onChange={(event) => setValues({ ...values, maxValue: event.target.value.replace(',', '.') })}
                error={field('maxValue')}
              />
              <span className="text-xs text-mynted-gray">{t('admin.commissions.form.maxHint')}</span>
            </div>
          </div>

          {!isSales && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-mynted-ink">{t('admin.commissions.form.currency')}</span>
              <Select
                value={values.currency}
                options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
                placeholder={t('admin.commissions.form.currency')}
                onChange={(next) => setValues({ ...values, currency: next })}
                invalid={Boolean(field('currency'))}
              />
              {field('currency') && <span className="text-xs text-red-500">{field('currency')}</span>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <TextField
              label={t('admin.commissions.form.discount')}
              placeholder="0.5"
              inputMode="decimal"
              value={values.discountPercent}
              onChange={(event) => setValues({ ...values, discountPercent: event.target.value.replace(',', '.') })}
              error={field('discountPercent')}
            />
            <span className="text-xs text-mynted-gray">{t('admin.commissions.form.discountHint')}</span>
          </div>

          <Switch
            label={t('admin.commissions.form.active')}
            description={t('admin.commissions.form.activeHint')}
            isSelected={values.isActive}
            onChange={(isActive) => setValues({ ...values, isActive })}
            className="rounded-xl bg-mynted-bg px-3.5 py-2.5"
          />

          {/* El backend valida de nuevo (solapes, moneda no soportada…): su
              mensaje es más preciso que cualquier cosa que digamos acá. */}
          {error != null && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {getApiErrorMessage(error, t('admin.commissions.form.saveError'))}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {t('profile.edit.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={isPending}>
            {t('admin.commissions.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
