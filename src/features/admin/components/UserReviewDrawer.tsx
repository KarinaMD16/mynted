import { useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Ban, Check, Copy, FileText, MapPin, RotateCcw, Store as StoreIcon, Trash2, X } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { useLastDefined } from '@/hooks/useLastDefined'
import type { TranslationKey } from '@/i18n/translations/es'
import type { SellerRequestStatus, UserRole } from '@/features/auth/models/auth'
import { formatShortDate } from '@/utils/relativeTime'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { Avatar, ConfirmDialog, ConfirmWithReasonDialog, IconAction, StatusPill, type PillTone } from './AdminUi'
import { SellerRequestDialog } from './SellerRequestDialog'
import {
  useAdminUser,
  useAdminUsers,
  useDeleteProductMutation,
  useDeleteUserMutation,
  useProductModerationMutation,
  useSellerDecisionMutation,
  useSetUserActiveMutation,
} from '../hooks/useAdminQueries'
import type { AdminUser } from '../models/admin'
import { Button } from '@/components/ui/Button'

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
  revoked: 'admin.sellers.status.revoked',
}
const SELLER_TONE: Record<Exclude<SellerRequestStatus, 'none'>, PillTone> = {
  pending: 'amber',
  approved: 'teal',
  rejected: 'red',
  revoked: 'red',
}

type PendingAction =
  | { kind: 'active'; active: boolean }
  | { kind: 'delete' }
  /** `active` es a qué estado se lo quiere llevar. */
  | { kind: 'product'; productId: number; title: string; active: boolean }
  | { kind: 'productDelete'; productId: number; title: string }
  /** `grant` es si se le devuelve el rol de vendedor o se le quita. */
  | { kind: 'sellerRole'; grant: boolean; productCount: number }

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
  // Se sigue mostrando el último usuario mientras el panel se desliza hacia afuera.
  const shownUser = useLastDefined(user)

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

          {shownUser && <ReviewBody user={shownUser} isSelf={shownUser.id === currentUserId} />}
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
  const deleteMutation = useDeleteUserMutation()
  const productMutation = useProductModerationMutation()
  const productDeleteMutation = useDeleteProductMutation()
  const sellerMutation = useSellerDecisionMutation()
  const sellerStatus = user.sellerRequestStatus
  /* Revocar solo da de baja lo que está publicado: los vendidos y los ya
     desactivados no se tocan, así que el aviso no debe contarlos. */
  const activeProductCount = (user.seller?.products ?? []).filter((product) => product.status === 'active').length

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

        <ReviewSection title={t('admin.review.publicProfile')}>
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

        <ReviewSection title={t('admin.review.account')}>
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
              {/* Una tienda creada a mano no tiene fecha de solicitud: sin
                  ella la frase quedaba "Solicitada el Sin definir". */}
              {user.sellerRequestedAt && t('admin.review.requestedOn', { date: date(user.sellerRequestedAt) })}
            </div>
          )}
        </ReviewSection>

        <ReviewSection title={t('admin.review.activity')} hint={t('admin.review.activityHint')}>
          <UserProducts userId={user.id} onModerate={(action) => setPending(action)} />
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
          {/* Quitar el rol desactiva de una vez todos sus productos, así que
              el diálogo avisa cuántos son antes de confirmar.

              Se condiciona al estado 'approved' y no al rol porque el backend
              solo revoca a quien pasó por una solicitud aprobada: a una cuenta
              con tienda creada a mano (estado 'none') responde 400, así que
              mostrarle el botón sería ofrecer algo que nunca funciona. */}
          {sellerStatus === 'approved' && (
            <ActionButton
              icon={StoreIcon}
              label={t('admin.sellers.revoke')}
              variant="danger"
              onPress={() => {
                sellerMutation.reset()
                setPending({ kind: 'sellerRole', grant: false, productCount: activeProductCount })
              }}
            />
          )}
          {sellerStatus === 'revoked' && (
            <ActionButton
              icon={StoreIcon}
              label={t('admin.sellers.restore')}
              variant="outline"
              onPress={() => {
                sellerMutation.reset()
                setPending({ kind: 'sellerRole', grant: true, productCount: activeProductCount })
              }}
            />
          )}
          {/* Eliminar es borrado lógico: la cuenta desaparece del panel pero
              se conservan sus compras, ventas y reseñas, que involucran a
              otras personas. No se puede eliminar la cuenta propia. */}
          <ActionButton
            icon={Trash2}
            label={t('admin.users.delete')}
            variant="danger"
            disabled={isSelf}
            title={isSelf ? t('admin.users.cannotDeleteSelf') : undefined}
            onPress={() => {
              deleteMutation.reset()
              setPending({ kind: 'delete' })
            }}
          />
        </div>
      </div>

      <ReviewConfirm
        user={user}
        pending={pending}
        activeMutation={activeMutation}
        deleteMutation={deleteMutation}
        productMutation={productMutation}
        productDeleteMutation={productDeleteMutation}
        sellerMutation={sellerMutation}
        onClose={() => setPending(null)}
      />
      <SellerRequestDialog userId={isRequestOpen ? user.id : null} onClose={() => setIsRequestOpen(false)} />
    </>
  )
}

function ReviewConfirm({
  user,
  pending,
  activeMutation,
  deleteMutation,
  productMutation,
  productDeleteMutation,
  sellerMutation,
  onClose,
}: {
  user: AdminUser
  pending: PendingAction | null
  activeMutation: ReturnType<typeof useSetUserActiveMutation>
  deleteMutation: ReturnType<typeof useDeleteUserMutation>
  productMutation: ReturnType<typeof useProductModerationMutation>
  productDeleteMutation: ReturnType<typeof useDeleteProductMutation>
  sellerMutation: ReturnType<typeof useSellerDecisionMutation>
  onClose: () => void
}) {
  const { t } = useLanguage()
  const name = user.username

  /**
   * Todas estas acciones exigen motivo menos reactivar una cuenta: el backend
   * no lo pide ahí, y no tiene sentido justificar devolverle el acceso a
   * alguien. Esa sigue con la confirmación simple.
   */
  if (pending?.kind === 'active' && pending.active) {
    return (
      <ConfirmDialog
        open
        title={t('admin.users.activateTitle', { name })}
        description={t('admin.users.activateDescription')}
        confirmLabel={t('admin.users.activate')}
        tone="primary"
        isPending={activeMutation.isPending}
        error={activeMutation.error}
        onClose={onClose}
        onConfirm={() => activeMutation.mutate({ userId: user.id, active: true }, { onSuccess: onClose })}
      />
    )
  }

  if (pending?.kind === 'active') {
    return (
      <ConfirmWithReasonDialog
        open
        title={t('admin.users.deactivateTitle', { name })}
        description={t('admin.users.deactivateDescription')}
        confirmLabel={t('admin.users.deactivate')}
        isPending={activeMutation.isPending}
        error={activeMutation.error}
        onClose={onClose}
        onConfirm={(reason) => activeMutation.mutate({ userId: user.id, active: false, reason }, { onSuccess: onClose })}
      />
    )
  }

  if (pending?.kind === 'delete') {
    return (
      <ConfirmWithReasonDialog
        open
        title={t('admin.users.deleteTitle', { name })}
        description={t('admin.users.deleteDescription')}
        confirmLabel={t('admin.users.delete')}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
        onClose={onClose}
        onConfirm={(reason) => deleteMutation.mutate({ userId: user.id, reason }, { onSuccess: onClose })}
      />
    )
  }

  if (pending?.kind === 'product') {
    const { productId, title, active } = pending
    return (
      <ConfirmWithReasonDialog
        open
        title={t(active ? 'admin.users.productActivateTitle' : 'admin.users.productDeactivateTitle', { title })}
        description={t(active ? 'admin.users.productActivateDescription' : 'admin.users.productDeactivateDescription')}
        confirmLabel={t(active ? 'admin.users.productActivate' : 'admin.users.productDeactivate')}
        tone={active ? 'primary' : 'danger'}
        isPending={productMutation.isPending}
        error={productMutation.error}
        onClose={onClose}
        onConfirm={(reason) =>
          productMutation.mutate({ productId, active, reason, userId: user.id }, { onSuccess: onClose })
        }
      />
    )
  }

  if (pending?.kind === 'productDelete') {
    const { productId, title } = pending
    return (
      <ConfirmWithReasonDialog
        open
        title={t('admin.users.productDeleteTitle', { title })}
        description={t('admin.users.productDeleteDescription')}
        confirmLabel={t('admin.users.productDelete')}
        isPending={productDeleteMutation.isPending}
        error={productDeleteMutation.error}
        onClose={onClose}
        onConfirm={(reason) =>
          productDeleteMutation.mutate({ productId, reason, userId: user.id }, { onSuccess: onClose })
        }
      />
    )
  }

  if (pending?.kind === 'sellerRole') {
    const { grant, productCount } = pending
    /* Devolver el rol no pide motivo: el backend guarda la acción con
       reason: null, así que escribirlo sería tirarlo a la basura. */
    if (grant) {
      return (
        <ConfirmDialog
          open
          title={t('admin.sellers.restoreTitle', { name })}
          description={t('admin.sellers.restoreDescription')}
          confirmLabel={t('admin.sellers.restore')}
          tone="primary"
          isPending={sellerMutation.isPending}
          error={sellerMutation.error}
          onClose={onClose}
          onConfirm={() => sellerMutation.mutate({ userId: user.id, status: 'approved' }, { onSuccess: onClose })}
        />
      )
    }
    return (
      <ConfirmWithReasonDialog
        open
        title={t('admin.sellers.revokeTitle', { name })}
        description={
          productCount > 0
            ? t('admin.sellers.revokeDescription', { count: productCount })
            : t('admin.sellers.revokeDescriptionNone')
        }
        confirmLabel={t('admin.sellers.revoke')}
        isPending={sellerMutation.isPending}
        error={sellerMutation.error}
        onClose={onClose}
        onConfirm={(reason) =>
          sellerMutation.mutate({ userId: user.id, status: 'revoked', reason }, { onSuccess: onClose })
        }
      />
    )
  }

  return null
}

/**
 * Los productos de la tienda, con la baja administrativa a mano.
 *
 * Las publicaciones del foro no están: el backend solo las expone en su
 * versión pública (`GET /users/:id/posts`), así que las ocultas —justo las que
 * habría que poder restaurar— no se ven, y no hay endpoint para ocultar una.
 */
function UserProducts({
  userId,
  onModerate,
}: {
  userId: string
  onModerate: (action: PendingAction) => void
}) {
  const { t } = useLanguage()
  const detail = useAdminUser(userId)
  const seller = detail.data?.seller
  const products = seller?.products ?? []

  if (detail.isLoading) {
    return <div className="h-20 animate-pulse rounded-xl bg-mynted-bg" aria-busy="true" />
  }

  if (!seller) {
    return <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-gray">{t('admin.review.notASeller')}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-mynted-gray">
        {t('admin.review.sellerSummary', {
          products: seller.productCount,
          sales: seller.salesCount,
          reports: seller.reportsReceivedCount,
        })}
      </p>

      {products.length === 0 ? (
        <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-gray">{t('admin.review.noProducts')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-mynted-border px-3.5 py-2.5"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-mynted-ink">{product.title}</span>
                <span className="text-xs text-mynted-gray">
                  {product.isDeactivated
                    ? t('admin.review.productDeactivated')
                    : product.isHidden
                      ? t('admin.review.productHidden')
                      : t('admin.review.productVisible')}
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={product.isDeactivated ? 'secondary' : 'destructive-secondary'}
                  onClick={() =>
                    onModerate({
                      kind: 'product',
                      productId: product.id,
                      title: product.title,
                      active: product.isDeactivated,
                    })
                  }
                >
                  {t(product.isDeactivated ? 'admin.users.productActivate' : 'admin.users.productDeactivate')}
                </Button>
                <IconAction
                  icon={Trash2}
                  label={t('admin.users.productDelete')}
                  tone="danger"
                  onPress={() => onModerate({ kind: 'productDelete', productId: product.id, title: product.title })}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
      <Button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(id).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
        }}
        aria-label={copied ? t('admin.review.copied') : t('admin.review.copyId')}
        title={copied ? t('admin.review.copied') : t('admin.review.copyId')}
        variant="ghost"
        size="icon-sm"
      >
        {copied ? <Check className="size-3.5 text-teal-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </Button>
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
  const buttonVariant = ({ primary: 'primary', outline: 'secondary', danger: 'destructive-secondary' } as const)[variant]
  return (
    <Button onClick={onPress} disabled={disabled} title={title} variant={buttonVariant} size="md">
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Button>
  )
}
