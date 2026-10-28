import { useEffect, useId, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, ImagePlus, Lock, Sparkles, Trash2 } from 'lucide-react'
import { getApiErrorMessage, getHttpStatus } from '@/api/apiError'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AuthUser } from '@/features/auth/models/auth'
import { ImageCropDialog, type CropSource } from '@/features/community/components/ui/ImageCropDialog'
import { BANNER_CROP } from '@/features/community/types/DEFAULT_VALUES'
import { useLastDefined } from '@/hooks/useLastDefined'
import { AvatarFrame } from '@/features/pro/components/AvatarFrame'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { ProfileBanner } from '@/features/pro/components/ProfileBanner'
import { SkinnedGoose } from '@/features/pro/components/SkinnedGoose'
import { useCosmeticsCatalog, useDeleteCustomBanner, useEquipCosmetics, useMyCosmetics, useUploadCustomBanner } from '@/features/pro/hooks/useCosmetics'
import {
  BANNER_ACCEPTED_TYPES,
  BANNER_MAX_BYTES,
  type Cosmetic,
  type CosmeticAsset,
  type CosmeticType,
  type EffectiveBanner,
  type EquipCosmeticsPayload,
  type MyCosmetics,
} from '@/features/pro/models/cosmetics'
import { getCosmeticName } from '@/features/pro/utils/cosmeticVisuals'
import { getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage, type TranslateFn } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { useSavedFlash } from '../hooks/useSavedFlash'
import { SettingsCard, SettingsFormFooter } from './SettingsCard'

/**
 * Pestaña "Apariencia" de /settings: banner, skin del ganso y marco del avatar
 * (sección 8 de la guía Pro) y el banner propio (sección 9, solo Pro).
 *
 * Los cosméticos gratuitos los puede equipar cualquiera; los Pro se muestran
 * con candado a quien no es Pro y, en vez de llamar al endpoint (que daría
 * 403), se ofrece hacerse Pro.
 */
export function AppearanceSettingsSection({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const catalog = useCosmeticsCatalog()
  const mine = useMyCosmetics()

  if (catalog.isPending || mine.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
        <div className="h-48 animate-pulse rounded-2xl bg-white" />
      </div>
    )
  }

  if (catalog.isError || mine.isError) {
    return (
      <QueryErrorState
        error={catalog.error ?? mine.error}
        onRetry={() => {
          void catalog.refetch()
          void mine.refetch()
        }}
        texts={{ error: { description: t('settings.appearance.loadError') } }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* key: al guardar (o subir un banner) lo equipado cambia y el borrador vuelve a partir de ahí. */}
      <CosmeticsEditor key={JSON.stringify(mine.data.equipped)} user={user} catalog={catalog.data} mine={mine.data} />
      <CustomBannerCard mine={mine.data} />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Selector de cosméticos
// -----------------------------------------------------------------------------

/** Lo que se está eligiendo. `null` = el valor por defecto del tipo. */
interface Draft {
  bannerId: number | null
  gooseSkinId: number | null
  frameId: number | null
  useCustomBanner: boolean
}

type CatalogByType = Record<CosmeticType, Cosmetic[]>

function groupCatalog(catalog: Cosmetic[]): CatalogByType {
  const groups: CatalogByType = { banner: [], goose_skin: [], frame: [] }
  for (const item of catalog) groups[item.type]?.push(item)
  for (const list of Object.values(groups)) list.sort((a, b) => a.sortOrder - b.sortOrder)
  return groups
}

/** El id equipado, o null si es el por defecto (o uno que ya no está en el catálogo). */
function normalizeId(list: Cosmetic[], id: number | null | undefined): number | null {
  const item = list.find((cosmetic) => cosmetic.id === id)
  return item && !item.isDefault ? item.id : null
}

/** El cosmético elegido de un tipo; con `null`, el por defecto. */
function pick(list: Cosmetic[], id: number | null): Cosmetic | undefined {
  return (id !== null ? list.find((item) => item.id === id) : undefined) ?? list.find((item) => item.isDefault)
}

/**
 * Lo que se vería con el borrador: un cosmético Pro sin Pro vigente no se
 * aplica (el backend pinta el por defecto), igual que el banner propio.
 */
function effectiveOf(list: Cosmetic[], id: number | null, isPro: boolean): CosmeticAsset | null {
  const item = pick(list, id)
  if (!item) return null
  const applied = item.proOnly && !isPro ? list.find((cosmetic) => cosmetic.isDefault) : item
  return applied ? { code: applied.code, assetUrl: applied.assetUrl } : null
}

function CosmeticsEditor({ user, catalog, mine }: { user: AuthUser; catalog: Cosmetic[]; mine: MyCosmetics }) {
  const { t } = useLanguage()
  const equip = useEquipCosmetics()
  const saved = useSavedFlash()
  const groups = useMemo(() => groupCatalog(catalog), [catalog])
  const { isPro, equipped } = mine
  const customBanner = equipped.customBanner

  const initial = useMemo<Draft>(
    () => ({
      bannerId: normalizeId(groups.banner, equipped.banner?.id),
      gooseSkinId: normalizeId(groups.goose_skin, equipped.gooseSkin?.id),
      frameId: normalizeId(groups.frame, equipped.frame?.id),
      useCustomBanner: equipped.useCustomBanner && customBanner !== null,
    }),
    [groups, equipped, customBanner],
  )
  const [draft, setDraft] = useState<Draft>(initial)
  // Último cosmético Pro que alguien sin Pro intentó elegir: se le explica y se le ofrece Pro.
  const [lockedPick, setLockedPick] = useState<string | null>(null)

  // Solo se manda lo que cambió (PUT /users/me/cosmetics no toca lo demás).
  const payload: EquipCosmeticsPayload = {}
  if (draft.useCustomBanner !== initial.useCustomBanner || (!draft.useCustomBanner && draft.bannerId !== initial.bannerId)) {
    if (draft.useCustomBanner) payload.useCustomBanner = true
    else payload.bannerId = draft.bannerId
  }
  if (draft.gooseSkinId !== initial.gooseSkinId) payload.gooseSkinId = draft.gooseSkinId
  if (draft.frameId !== initial.frameId) payload.frameId = draft.frameId
  const isDirty = Object.keys(payload).length > 0

  const previewBanner: EffectiveBanner | null =
    draft.useCustomBanner && customBanner && isPro
      ? { source: 'custom', code: null, url: customBanner.url, staticUrl: customBanner.staticUrl, isAnimated: customBanner.isAnimated }
      : (() => {
          const asset = effectiveOf(groups.banner, draft.bannerId, isPro)
          return asset ? { source: 'catalog', code: asset.code, url: asset.assetUrl, staticUrl: asset.assetUrl, isAnimated: false } : null
        })()
  const previewSkin = effectiveOf(groups.goose_skin, draft.gooseSkinId, isPro)
  const previewFrame = effectiveOf(groups.frame, draft.frameId, isPro)

  // Venció Pro con cosas Pro guardadas: no se borran, vuelven solas al renovar.
  const hasStoredProItems =
    !isPro &&
    ([pick(groups.banner, initial.bannerId), pick(groups.goose_skin, initial.gooseSkinId), pick(groups.frame, initial.frameId)].some(
      (item) => item?.proOnly,
    ) ||
      initial.useCustomBanner)

  /**
   * Lo que se ve elegido: lo del borrador o, si es Pro y no hay Pro vigente, el
   * por defecto (que es lo que de verdad se aplica). Lo Pro queda como "guardado".
   */
  function appliedId(list: Cosmetic[], id: number | null): number | undefined {
    const item = pick(list, id)
    return item?.proOnly && !isPro ? list.find((cosmetic) => cosmetic.isDefault)?.id : item?.id
  }
  const bannerAppliedId = draft.useCustomBanner && isPro ? undefined : appliedId(groups.banner, draft.bannerId)
  const bannerPickedId = draft.useCustomBanner ? undefined : pick(groups.banner, draft.bannerId)?.id
  const gooseAppliedId = appliedId(groups.goose_skin, draft.gooseSkinId)
  const goosePickedId = pick(groups.goose_skin, draft.gooseSkinId)?.id
  const frameAppliedId = appliedId(groups.frame, draft.frameId)
  const framePickedId = pick(groups.frame, draft.frameId)?.id

  function choose(type: CosmeticType, item: Cosmetic) {
    if (item.proOnly && !isPro) {
      setLockedPick(getCosmeticName(item, t))
      return
    }
    setLockedPick(null)
    const id = item.isDefault ? null : item.id
    setDraft((current) =>
      type === 'banner'
        ? { ...current, bannerId: id, useCustomBanner: false }
        : type === 'goose_skin'
          ? { ...current, gooseSkinId: id }
          : { ...current, frameId: id },
    )
  }

  function chooseCustomBanner() {
    if (!isPro) {
      setLockedPick(t('settings.appearance.customBannerTile'))
      return
    }
    setLockedPick(null)
    setDraft((current) => ({ ...current, useCustomBanner: true }))
  }

  function save() {
    if (!isDirty) return
    equip.mutate(payload, { onSuccess: () => saved.flash() })
  }

  const saveError = equip.isError ? equipErrorMessage(equip.error, t) : undefined

  return (
    <SettingsCard title={t('settings.appearance.title')} description={t('settings.appearance.description')}>
      <div className="flex flex-col gap-6">
        <ProfilePreview user={user} isPro={isPro} banner={previewBanner} skin={previewSkin} frame={previewFrame} />

        {hasStoredProItems && (
          <Notice>
            {t('settings.appearance.storedProItems')}{' '}
            <Link to="/pro" className="font-semibold underline underline-offset-2">
              {t('pro.plans.ctaRenew')}
            </Link>
          </Notice>
        )}

        {lockedPick && (
          <div role="status" className="flex flex-col gap-3 rounded-xl border border-mynted-orange/40 bg-mynted-orange/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-mynted-ink">
              <Lock className="mt-0.5 size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
              {t('settings.appearance.lockedPick', { name: lockedPick })}
            </p>
            <Link
              to="/pro"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-mynted-orange px-3 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {t('pro.plans.ctaJoin')}
            </Link>
          </div>
        )}

        <PickerGroup title={t('settings.appearance.bannerTitle')}>
          {groups.banner.map((item) => (
            <CosmeticTile
              key={item.id}
              label={getCosmeticName(item, t)}
              selected={bannerAppliedId === item.id}
              saved={bannerPickedId === item.id && bannerAppliedId !== item.id}
              locked={item.proOnly && !isPro}
              proOnly={item.proOnly}
              onSelect={() => choose('banner', item)}
              wide
            >
              <ProfileBanner
                banner={{ source: 'catalog', code: item.code, url: item.assetUrl, staticUrl: item.assetUrl, isAnimated: false }}
                mode="static"
                compact
                className="h-14 w-full rounded-lg"
              />
            </CosmeticTile>
          ))}
          {customBanner && (
            <CosmeticTile
              label={t('settings.appearance.customBannerTile')}
              selected={draft.useCustomBanner && isPro}
              saved={draft.useCustomBanner && !isPro}
              locked={!isPro}
              proOnly
              onSelect={chooseCustomBanner}
              wide
            >
              <ProfileBanner
                banner={{ source: 'custom', code: null, url: customBanner.url, staticUrl: customBanner.staticUrl, isAnimated: customBanner.isAnimated }}
                mode="static"
                className="h-14 w-full rounded-lg"
              />
            </CosmeticTile>
          )}
        </PickerGroup>

        <PickerGroup title={t('settings.appearance.gooseTitle')}>
          {groups.goose_skin.map((item) => (
            <CosmeticTile
              key={item.id}
              label={getCosmeticName(item, t)}
              selected={gooseAppliedId === item.id}
              saved={goosePickedId === item.id && gooseAppliedId !== item.id}
              locked={item.proOnly && !isPro}
              proOnly={item.proOnly}
              onSelect={() => choose('goose_skin', item)}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-mynted-bg">
                <SkinnedGoose skin={{ code: item.code, assetUrl: item.assetUrl }} className="size-14" />
              </span>
            </CosmeticTile>
          ))}
        </PickerGroup>

        <PickerGroup title={t('settings.appearance.frameTitle')}>
          {groups.frame.map((item) => (
            <CosmeticTile
              key={item.id}
              label={getCosmeticName(item, t)}
              selected={frameAppliedId === item.id}
              saved={framePickedId === item.id && frameAppliedId !== item.id}
              locked={item.proOnly && !isPro}
              proOnly={item.proOnly}
              onSelect={() => choose('frame', item)}
            >
              <AvatarFrame frame={{ code: item.code, assetUrl: item.assetUrl }} size="md" className="size-16">
                <MiniAvatar user={user} />
              </AvatarFrame>
            </CosmeticTile>
          ))}
        </PickerGroup>
      </div>

      <SettingsFormFooter error={saveError ? new Error(saveError) : undefined} showSaved={saved.isVisible && !isDirty}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={!isDirty || equip.isPending}
          onClick={() => {
            equip.reset()
            setLockedPick(null)
            setDraft(initial)
          }}
        >
          {t('settings.appearance.discard')}
        </Button>
        <Button type="button" variant="primary" size="md" disabled={!isDirty} isLoading={equip.isPending} onClick={save}>
          {t('settings.appearance.save')}
        </Button>
      </SettingsFormFooter>
    </SettingsCard>
  )
}

function equipErrorMessage(error: unknown, t: TranslateFn): string {
  switch (getHttpStatus(error)) {
    case 403:
      return t('settings.appearance.errorNeedsPro')
    case 404:
      return t('settings.appearance.errorNotFound')
    default:
      return getApiErrorMessage(error, t('settings.appearance.errorGeneric'))
  }
}

/** Así se vería la cabecera del perfil con lo elegido (antes de guardar). */
function ProfilePreview({
  user,
  isPro,
  banner,
  skin,
  frame,
}: {
  user: AuthUser
  isPro: boolean
  banner: EffectiveBanner | null
  skin: CosmeticAsset | null
  frame: CosmeticAsset | null
}) {
  const { t } = useLanguage()
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-semibold tracking-wide text-mynted-gray uppercase">{t('settings.appearance.preview')}</figcaption>
      <div className="overflow-hidden rounded-2xl border border-mynted-border bg-mynted-bg p-3">
        <ProfileBanner banner={banner} className="h-24 rounded-xl sm:h-28" />
        <div className="relative -mt-6 flex items-end justify-between gap-3 px-3">
          <span className="flex size-14 items-center justify-center rounded-full border-4 border-mynted-bg bg-white shadow-sm">
            <SkinnedGoose skin={skin} className="size-10" />
          </span>
          <AvatarFrame frame={frame} size="lg" className="size-20">
            <span className="flex size-full items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-xl font-semibold text-white">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
              ) : (
                getInitials(user.username)
              )}
            </span>
          </AvatarFrame>
          <span className="size-14" aria-hidden="true" />
        </div>
        <p className="mt-2 flex items-center justify-center gap-2 font-heading text-base font-semibold text-mynted-ink">
          {user.username}
          {isPro && <ProBadge size="sm" />}
        </p>
      </div>
    </figure>
  )
}

function MiniAvatar({ user }: { user: AuthUser }) {
  return (
    <span className="flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-mynted-orange font-heading text-sm font-semibold text-white">
      {user.photoUrl ? (
        <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        getInitials(user.username)
      )}
    </span>
  )
}

function PickerGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold text-mynted-ink">{title}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </fieldset>
  )
}

/**
 * Una opción del selector. Un cosmético Pro sin Pro vigente se ve con candado:
 * se puede tocar (explica por qué no se puede usar y ofrece Pro), pero no queda elegido.
 */
function CosmeticTile({
  label,
  selected,
  saved = false,
  locked,
  proOnly,
  wide = false,
  onSelect,
  children,
}: {
  label: string
  selected: boolean
  /** Elegido pero sin aplicarse (cosmético Pro sin Pro vigente): se conserva y vuelve al renovar. */
  saved?: boolean
  locked: boolean
  proOnly: boolean
  wide?: boolean
  onSelect: () => void
  children: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      title={locked ? t('settings.appearance.lockedHint') : undefined}
      className={cx(
        'relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-white p-2.5 text-center transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
        wide && 'col-span-2 sm:col-span-2',
        selected
          ? 'border-mynted-orange ring-2 ring-mynted-orange/30'
          : saved
            ? 'border-dashed border-mynted-orange/60'
            : 'border-mynted-border hover:border-mynted-orange/50',
      )}
    >
      <span className={cx('flex w-full items-center justify-center', locked && 'opacity-60')}>{children}</span>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-mynted-ink">
        {locked && <Lock className="size-3 text-mynted-gray" aria-hidden="true" />}
        {label}
      </span>
      {proOnly && <ProBadge size="xs" className="absolute top-1.5 left-1.5" />}
      {selected && (
        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-mynted-orange text-white" aria-hidden="true">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {saved && (
        <span className="absolute top-1.5 right-1.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-mynted-orange ring-1 ring-mynted-orange/30">
          {t('settings.appearance.savedPro')}
        </span>
      )}
      {locked && <span className="sr-only">{t('settings.appearance.lockedHint')}</span>}
    </button>
  )
}

/** Errores de PUT /users/me/banner (sección 9 de la guía). */
function uploadErrorMessage(error: unknown, t: TranslateFn): string {
  switch (getHttpStatus(error)) {
    case 400:
      return t('settings.appearance.bannerBadType')
    case 403:
      return t('settings.appearance.errorNeedsPro')
    case 413:
      return t('settings.appearance.bannerTooLarge')
    default:
      return getApiErrorMessage(error, t('settings.appearance.errorGeneric'))
  }
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-[#fff4d6] px-3.5 py-3 text-sm text-[#8a5a00]">{children}</p>
}

// -----------------------------------------------------------------------------
// Banner propio (solo Pro)
// -----------------------------------------------------------------------------

function CustomBannerCard({ mine }: { mine: MyCosmetics }) {
  const { t } = useLanguage()
  const inputId = useId()
  const upload = useUploadCustomBanner()
  const remove = useDeleteCustomBanner()
  const [fileError, setFileError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  // Imagen elegida que se está recortando (mismo editor que la portada de las comunidades).
  const [cropSource, setCropSource] = useState<CropSource | null>(null)
  // Se sigue mostrando durante la animación de cierre del diálogo.
  const shownCrop = useLastDefined(cropSource)
  const { isPro } = mine
  const customBanner = mine.equipped.customBanner

  // El object URL vive mientras el recorte esté abierto.
  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource.url) }, [cropSource])

  /** Mismas reglas que el backend (8 MB): avisar antes de subir para nada. */
  function uploadChecked(file: File) {
    if (file.size > BANNER_MAX_BYTES) {
      setFileError(t('settings.appearance.bannerTooLarge'))
      return
    }
    setFileError(null)
    upload.mutate(file)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!(BANNER_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setFileError(t('settings.appearance.bannerBadType'))
      return
    }
    // Un GIF se sube tal cual: recortarlo en el navegador lo dejaría quieto
    // (el canvas exporta un solo fotograma) y perdería la animación.
    if (file.type === 'image/gif') {
      uploadChecked(file)
      return
    }
    // El resto pasa por el recortador: la foto puede pesar más de 8 MB, el
    // recorte sale reducido a 1600 × 400 y se valida después.
    setFileError(null)
    upload.reset()
    setCropSource({ file, url: URL.createObjectURL(file) })
  }

  function handleCropConfirm(cropped: File) {
    setCropSource(null)
    uploadChecked(cropped)
  }

  const uploadError = upload.isError ? uploadErrorMessage(upload.error, t) : null
  const error = fileError ?? uploadError ?? (remove.isError ? getApiErrorMessage(remove.error, t('settings.appearance.errorGeneric')) : null)

  return (
    <SettingsCard title={t('settings.appearance.customBannerTitle')} description={t('settings.appearance.customBannerDescription')}>
      <div className="flex flex-col gap-4">
        {customBanner ? (
          <ProfileBanner
            banner={{ source: 'custom', code: null, url: customBanner.url, staticUrl: customBanner.staticUrl, isAnimated: customBanner.isAnimated }}
            className="h-28 rounded-xl sm:h-32"
          />
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-mynted-border bg-mynted-bg text-mynted-gray sm:h-32">
            <ImagePlus className="size-6" aria-hidden="true" />
            <span className="text-xs">{t('settings.appearance.customBannerEmpty')}</span>
          </div>
        )}

        {!isPro && (
          <Notice>
            {t(customBanner ? 'settings.appearance.customBannerKept' : 'settings.appearance.customBannerProOnly')}{' '}
            <Link to="/pro" className="font-semibold underline underline-offset-2">
              {t(customBanner ? 'pro.plans.ctaRenew' : 'pro.plans.ctaJoin')}
            </Link>
          </Notice>
        )}

        <p className="text-xs text-mynted-gray">{t('settings.appearance.customBannerHint')}</p>

        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {(customBanner || isPro) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-mynted-border pt-4">
            {customBanner && (
              // Quitarlo no exige Pro: se puede limpiar aunque haya vencido.
              <Button type="button" variant="destructive-secondary" size="md" disabled={upload.isPending} onClick={() => setIsConfirmOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                {t('settings.appearance.removeBanner')}
              </Button>
            )}
            {isPro && (
              <>
                <input
                  id={inputId}
                  type="file"
                  accept={BANNER_ACCEPTED_TYPES.join(',')}
                  className="sr-only"
                  onChange={handleFile}
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={upload.isPending}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  <ImagePlus className="size-4" aria-hidden="true" />
                  {upload.isPending
                    ? t('settings.appearance.uploading')
                    : t(customBanner ? 'settings.appearance.replaceBanner' : 'settings.appearance.uploadBanner')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <ImageCropDialog
        key={shownCrop?.url ?? 'closed'}
        source={shownCrop}
        isOpen={cropSource !== null}
        aspect={BANNER_CROP.aspect}
        outputWidth={BANNER_CROP.outputWidth}
        shape="rect"
        title={t('settings.appearance.cropTitle')}
        onCancel={() => setCropSource(null)}
        onConfirm={handleCropConfirm}
      />

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            remove.reset()
            setIsConfirmOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('settings.appearance.removeTitle')}</DialogTitle>
            <DialogDescription>{t('settings.appearance.removeBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" size="md" disabled={remove.isPending} onClick={() => setIsConfirmOpen(false)}>
              {t('profile.edit.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(undefined, { onSettled: () => setIsConfirmOpen(false) })}
            >
              {t('settings.appearance.removeBanner')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsCard>
  )
}
