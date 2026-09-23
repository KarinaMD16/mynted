import { useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Ban, Check, Copy, FileText, MapPin, RotateCcw, X } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { SellerRequestStatus, UserRole } from '@/features/auth/models/auth'
import { formatShortDate } from '@/utils/relativeTime'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { Avatar, ConfirmDialog, StatusPill, type PillTone } from './AdminUi'
import { SellerRequestDialog } from './SellerRequestDialog'
import { useAdminUsers, useSetUserActiveMutation } from '../hooks/useAdminQueries'
import type { AdminUser } from '../models/admin'

const ROLE_LABEL: Record<UserRole, TranslationKey> = {
  user: 'admin.users.role.user',
  seller: 'admin.users.role.seller',
  superadmin: 'admin.users.role.superadmin',
}
const ROLE_TONE: Record<UserRole, PillTone> = { user: 'gray', seller: 'blue', superadmin: 'orange' }

const SELLER_LABEL: Record<Exclude<SellerRequestStatus, 'none'>, TranslationKey> = {
  pending: 'admin.sellers.status.pending',
  approved: 'admin.sellers.status.approved',
  rejected: 'admin.sellers.status.rejected',
}
const SELLER_TONE: Record<Exclude<SellerRequestStatus, 'none'>, PillTone> = {
  pending: 'amber',
  approved: 'teal',
  rejected: 'red',
}

type PendingAction = { kind: 'active'; active: boolean }

/**
 * Panel lateral de moderación para revisar una cuenta desde el panel de
 * superadmin (botón "Revisar usuario" en Usuarios y en Solicitudes de
 * vendedor). Muestra:
 *
 * - Perfil público: lo que cualquiera ve en /profile (foto, usuario, bio,
 *   ubicación, fecha de registro, rol).
 * - Cuenta: datos privados que solo ve el superadmin (correo, ID, idioma y
 *   moneda, aceptación de la política de privacidad, notificaciones).
 * - Solicitud de vendedor y acciones de moderación (desactivar/activar;
 *   si hay una solicitud pendiente, abrirla para aprobarla o rechazarla con
 *   los datos de la tienda a la vista, ver SellerRequestDialog).
 *
 * Los datos salen del mismo cache de GET /users que usa la tabla, así que
 * después de una acción el panel se actualiza solo. La actividad (posts,
 * productos, comunidades) todavía no se puede consultar por usuario en el
 * backend; se avisa en el propio panel.
 */
export function UserReviewDrawer({
  userId,
  currentUserId,
  onClose,
}: {
  userId: string | null
  currentUserId: string
  onClose: () => void
}) {
  const { t } = useLanguage()
  const usersQuery = useAdminUsers()
  const user = usersQuery.data?.find((item) => item.id === userId)

  return (
    <DialogPrimitive.Root open={userId !== null && Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-mynted-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-[480px] flex-col bg-white shadow-xl outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        >
          <div className="flex items-center justify-between border-b border-mynted-border px-6 py-4">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold text-mynted-ink">
              {t('admin.review.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={t('admin.review.close')}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-mynted-gray outline-none transition-colors hover:bg-mynted-bg hover:text-mynted-ink focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          {user && <ReviewBody user={user} isSelf={user.id === currentUserId} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ReviewBody({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const { t, language } = useLanguage()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [isRequestOpen, setIsRequestOpen] = useState(false)
  const activeMutation = useSetUserActiveMutation()
  const sellerStatus = user.sellerRequestStatus

  const date = (iso: string | null | undefined) => (iso ? formatShortDate(iso, language) : t('admin.review.notSet'))

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Cabecera: como se ve el perfil */}
        <div className="flex flex-col items-center gap-3 border-b border-mynted-border px-6 py-7 text-center">
          <Avatar src={user.photoUrl} name={user.username} size="lg" />
          <div>
            <p className="font-heading text-xl font-semibold text-mynted-ink">{user.username}</p>
            {user.location && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-mynted-gray">
                <MapPin className="size-3.5" aria-hidden="true" />
                {user.location}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <StatusPill tone={ROLE_TONE[user.role]}>{t(ROLE_LABEL[user.role])}</StatusPill>
            {user.isActive ? (
              <StatusPill tone="violet">{t('admin.users.status.active')}</StatusPill>
            ) : (
              <StatusPill tone="teal">{t('admin.users.status.inactive')}</StatusPill>
            )}
          </div>
        </div>

        <ReviewSection title={t('admin.review.publicProfile')} hint={t('admin.review.publicHint')}>
          <Field label={t('admin.review.bio')}>
            {user.bio ? (
              <p className="whitespace-pre-line text-mynted-ink">{user.bio}</p>
            ) : (
              <Empty>{t('admin.review.noBio')}</Empty>
            )}
          </Field>
          <Field label={t('admin.review.location')}>
            {user.location || <Empty>{t('admin.review.noLocation')}</Empty>}
          </Field>
          <Field label={t('admin.review.memberSince')}>{date(user.createdAt)}</Field>
          <Field label={t('admin.review.photo')}>
            {user.photoUrl ? (
              <a href={user.photoUrl} target="_blank" rel="noreferrer" className="text-mynted-blue-mid hover:underline">
                {t('admin.review.viewPhoto')}
              </a>
            ) : (
              <Empty>{t('admin.review.noPhoto')}</Empty>
            )}
          </Field>
        </ReviewSection>

        <ReviewSection title={t('admin.review.account')} hint={t('admin.review.accountHint')}>
          <Field label={t('admin.review.email')}>
            <a href={`mailto:${user.email}`} className="break-all text-mynted-blue-mid hover:underline">
              {user.email}
            </a>
          </Field>
          <Field label={t('admin.review.userId')}>
            <CopyableId id={user.id} />
          </Field>
          <Field label={t('admin.review.region')}>
            {formatRegion(user.locale, user.currency, language) ?? <Empty>{t('admin.review.notSet')}</Empty>}
          </Field>
          <Field label={t('admin.review.privacy')}>
            {user.acceptedPrivacyPolicyAt ? (
              t('admin.review.privacyAccepted', {
                date: date(user.acceptedPrivacyPolicyAt),
                version: user.privacyPolicyVersion || '—',
              })
            ) : (
              <Empty>{t('admin.review.privacyPending')}</Empty>
            )}
          </Field>
          <Field label={t('admin.review.emailNotifications')}>
            {user.emailNotifications === false ? t('admin.review.no') : t('admin.review.yes')}
          </Field>
          <Field label={t('admin.review.pushNotifications')}>
            {user.pushNotifications === false ? t('admin.review.no') : t('admin.review.yes')}
          </Field>
          <Field label={t('admin.review.lastUpdate')}>{date(user.updatedAt)}</Field>
        </ReviewSection>

        <ReviewSection title={t('admin.review.seller')}>
          {sellerStatus === 'none' ? (
            <Empty>{t('admin.review.sellerNone')}</Empty>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-sm text-mynted-gray">
              <StatusPill tone={SELLER_TONE[sellerStatus]}>{t(SELLER_LABEL[sellerStatus])}</StatusPill>
              {t('admin.review.requestedOn', { date: date(user.sellerRequestedAt) })}
            </div>
          )}
        </ReviewSection>

        <ReviewSection title={t('admin.review.activity')}>
          <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-gray">{t('admin.review.activityUnavailable')}</p>
        </ReviewSection>
      </div>

      {/* Acciones de moderación, fijas abajo */}
      <div className="flex flex-col gap-2 border-t border-mynted-border px-6 py-4">
        <p className="text-xs font-medium tracking-[0.12em] text-mynted-gray uppercase [:lang(ko)_&]:tracking-normal">
          {t('admin.review.actions')}
        </p>
        <div className="flex flex-wrap gap-2">
          {sellerStatus === 'pending' && (
            <ActionButton
              icon={FileText}
              label={t('admin.sellerRequest.open')}
              variant="primary"
              onPress={() => setIsRequestOpen(true)}
            />
          )}
          {user.isActive ? (
            <ActionButton
              icon={Ban}
              label={t('admin.users.deactivate')}
              variant="danger"
              disabled={isSelf}
              title={isSelf ? t('admin.users.cannotDeactivateSelf') : undefined}
              onPress={() => {
                activeMutation.reset()
                setPending({ kind: 'active', active: false })
              }}
            />
          ) : (
            <ActionButton
              icon={RotateCcw}
              label={t('admin.users.activate')}
              variant="outline"
              onPress={() => {
                activeMutation.reset()
                setPending({ kind: 'active', active: true })
              }}
            />
          )}
        </div>
      </div>

      <ReviewConfirm user={user} pending={pending} activeMutation={activeMutation} onClose={() => setPending(null)} />
      <SellerRequestDialog userId={isRequestOpen ? user.id : null} onClose={() => setIsRequestOpen(false)} />
    </>
  )
}

function ReviewConfirm({
  user,
  pending,
  activeMutation,
  onClose,
}: {
  user: AdminUser
  pending: PendingAction | null
  activeMutation: ReturnType<typeof useSetUserActiveMutation>
  onClose: () => void
}) {
  const { t } = useLanguage()
  const name = user.username

  const activate = pending?.kind === 'active' && pending.active
  return (
    <ConfirmDialog
      open={pending?.kind === 'active'}
      title={activate ? t('admin.users.activateTitle', { name }) : t('admin.users.deactivateTitle', { name })}
      description={activate ? t('admin.users.activateDescription') : t('admin.users.deactivateDescription')}
      confirmLabel={activate ? t('admin.users.activate') : t('admin.users.deactivate')}
      tone={activate ? 'primary' : 'danger'}
      isPending={activeMutation.isPending}
      error={activeMutation.error}
      onClose={onClose}
      onConfirm={() => activeMutation.mutate({ userId: user.id, active: activate }, { onSuccess: onClose })}
    />
  )
}

/** "inglés (Costa Rica) · colón costarricense (CRC)", en el idioma actual de la app. */
function formatRegion(locale: string | null | undefined, currency: string | null | undefined, language: AppLanguage) {
  const parts: string[] = []
  try {
    if (locale) parts.push(new Intl.DisplayNames(INTL_LOCALES[language], { type: 'language' }).of(locale) ?? locale)
  } catch {
    if (locale) parts.push(locale)
  }
  try {
    if (currency) {
      const name = new Intl.DisplayNames(INTL_LOCALES[language], { type: 'currency' }).of(currency)
      parts.push(name && name !== currency ? `${name} (${currency})` : currency)
    }
  } catch {
    if (currency) parts.push(currency)
  }
  return parts.length ? parts.join(' · ') : null
}

function ReviewSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-b border-mynted-border px-6 py-5 last:border-b-0">
      <h3 className="font-heading text-sm font-semibold text-mynted-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-mynted-gray">{hint}</p>}
      <dl className="mt-4 flex flex-col gap-3.5">{children}</dl>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <dt className="text-mynted-gray">{label}</dt>
      <dd className="min-w-0 text-mynted-ink">{children}</dd>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <span className="text-mynted-gray-light italic">{children}</span>
}

function CopyableId({ id }: { id: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  return (
    <span className="flex items-center gap-2">
      <code className="truncate rounded bg-mynted-bg px-1.5 py-0.5 text-xs text-mynted-ink">{id}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(id).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
        }}
        aria-label={copied ? t('admin.review.copied') : t('admin.review.copyId')}
        title={copied ? t('admin.review.copied') : t('admin.review.copyId')}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-mynted-gray hover:bg-mynted-bg hover:text-mynted-ink"
      >
        {copied ? <Check className="size-3.5 text-teal-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </button>
    </span>
  )
}

function ActionButton({
  icon: Icon,
  label,
  variant,
  onPress,
  disabled = false,
  title,
}: {
  icon: typeof Ban
  label: string
  variant: 'primary' | 'outline' | 'danger'
  onPress: () => void
  disabled?: boolean
  title?: string
}) {
  const styles = {
    primary: 'bg-mynted-orange text-white hover:bg-mynted-orange-hover',
    outline: 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }[variant]
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid disabled:cursor-not-allowed disabled:opacity-50 ${
        disabled ? '' : 'cursor-pointer'
      } ${styles}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}
