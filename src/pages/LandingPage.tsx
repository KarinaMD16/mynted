import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Gem,
  Heart,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Logo } from '@/components/ui/Logo'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'

/**
 * Landing promocional de Mynted (/descubre), pensada como "anuncio": la
 * página a la que se manda a alguien desde una campaña o un link externo.
 *
 * Viene del proyecto aparte `landing-page-mynted` (Next.js + v0), portada a
 * esta app: usa el mismo SiteHeader que el resto del sitio (así se puede
 * iniciar sesión o abrir el menú de cuenta desde acá), los tokens de color
 * de index.css, el diccionario de traducciones y rutas reales en vez de
 * anclas "#". Los llamados a la acción llevan a:
 *
 * - "/" para ver los productos destacados;
 * - "/login?mode=register" para crear una cuenta (o "/communities" si ya
 *   hay sesión);
 * - "/communities" y las comunidades reales más populares (GET /communities
 *   es público), en vez de los números de miembros inventados del mockup.
 */
export default function LandingPage() {
  const { isLoggedIn } = useCurrentUser()

  return (
    <div className="overflow-hidden bg-[#fbfcff] text-mynted-ink">
      <Hero isLoggedIn={isLoggedIn} />
      <Features />
      <Steps isLoggedIn={isLoggedIn} />
      <Communities />
      <Values />
      <FinalCta isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Llamados a la acción
// ---------------------------------------------------------------------------

const primaryCta =
  'group inline-flex items-center justify-center gap-2 rounded-full bg-mynted-blue-mid px-6 py-4 font-bold text-white shadow-[0_6px_0_#1748c5] transition hover:-translate-y-0.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mynted-blue-mid'
const secondaryCta =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#d9e2ff] bg-white px-6 py-4 font-bold text-mynted-blue-mid transition hover:border-mynted-blue-mid outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mynted-blue-mid'

/** Crear cuenta si no hay sesión; si ya la hay, ir a las comunidades. */
function JoinLink({ isLoggedIn, className, children }: { isLoggedIn: boolean; className: string; children: ReactNode }) {
  return isLoggedIn ? (
    <Link to="/communities" className={className}>
      {children}
    </Link>
  ) : (
    <Link to="/login" search={{ mode: 'register' }} className={className}>
      {children}
    </Link>
  )
}

function Eyebrow({ children, tone = 'orange' }: { children: ReactNode; tone?: 'orange' | 'blue' | 'light' }) {
  const color = { orange: 'text-mynted-orange', blue: 'text-mynted-blue-mid', light: 'text-white/75' }[tone]
  return (
    <p className={`mb-4 text-xs font-bold tracking-[.22em] uppercase [:lang(ko)_&]:tracking-normal ${color}`}>{children}</p>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useLanguage()

  return (
    <section className="relative bg-[#f4f7ff]">
      <div className="pointer-events-none absolute -top-56 -right-48 size-[550px] rounded-full bg-[#dce6ff] blur-3xl" />

      <div className="relative z-20 px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pt-14 pb-20 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pt-20 lg:pb-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9d7ff] bg-white px-4 py-2 text-xs font-bold text-mynted-blue-mid shadow-sm">
            <Sparkles className="size-3.5" aria-hidden="true" /> {t('landing.hero.badge')}
          </div>
          <h1 className="max-w-3xl font-heading text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-[72px]">
            {t('landing.hero.titleLine1')}
            <br />
            <span className="text-mynted-blue-mid">{t('landing.hero.titleLine2')}</span>
            <br />
            <span className="text-mynted-orange">{t('landing.hero.titleLine3')}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-mynted-gray">{t('landing.hero.description')}</p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link to="/" className={primaryCta}>
              {t('landing.hero.primaryCta')}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <JoinLink isLoggedIn={isLoggedIn} className={secondaryCta}>
              {isLoggedIn ? t('landing.hero.communitiesCta') : t('landing.hero.signUpCta')}
            </JoinLink>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-3" aria-hidden="true">
              <span className="size-9 rounded-full border-2 border-[#f4f7ff] bg-mynted-orange" />
              <span className="size-9 rounded-full border-2 border-[#f4f7ff] bg-[#8da9ff]" />
              <span className="size-9 rounded-full border-2 border-[#f4f7ff] bg-[#f3ca5e]" />
              <span className="size-9 rounded-full border-2 border-[#f4f7ff] bg-mynted-ink" />
            </div>
            <p className="text-xs leading-5 font-semibold text-mynted-gray">
              {t('landing.hero.socialProof')}
              <br />
              <span className="font-bold text-mynted-ink">{t('landing.hero.socialProofStrong')}</span>
            </p>
          </div>
        </div>

        <CollectionVisual />
      </div>
    </section>
  )
}

/** Ilustración decorativa del hero (solo formas y colores, sin imágenes). */
function CollectionVisual() {
  const { t } = useLanguage()

  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[510px]" role="img" aria-label={t('landing.visual.label')}>
      <div className="absolute inset-x-8 top-10 h-72 rotate-[-4deg] rounded-[38px] bg-[#dbe6ff]" />
      <div className="absolute inset-x-2 top-5 h-72 rotate-[5deg] rounded-[38px] border border-white/70 bg-mynted-blue-mid shadow-[0_24px_50px_rgba(37,97,243,0.3)]" />
      <div className="absolute inset-x-8 top-16 h-72 overflow-hidden rounded-[30px] bg-[#f8f9fc] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#e9efff] px-3 py-1 text-[10px] font-bold tracking-widest text-mynted-blue-mid uppercase [:lang(ko)_&]:tracking-normal">
            {t('landing.visual.newFinds')}
          </span>
          <Heart className="size-4 text-mynted-orange" fill="currentColor" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="relative flex h-36 items-end justify-center overflow-hidden rounded-2xl bg-[#f8c8ba] pb-3">
            <div className="mb-3 size-20 rounded-[48%_48%_35%_35%] bg-mynted-orange shadow-[inset_-8px_-5px_0_rgba(0,0,0,.1)]" />
            <div className="absolute bottom-2 h-3 w-16 rounded-full bg-[#c4502e]/30" />
          </div>
          <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-[#d6e0ff]">
            <div className="relative size-20 rotate-45 rounded-lg bg-mynted-blue-mid shadow-[8px_8px_0_#9db5f7]">
              <div className="absolute inset-5 rounded-sm border-2 border-white/70" />
            </div>
          </div>
          <div className="relative flex h-36 items-end justify-center overflow-hidden rounded-2xl bg-[#f8e5a8] pb-3">
            <div className="relative mb-2 size-16 rounded-full bg-[#f1b93b] shadow-[inset_-5px_-4px_0_rgba(0,0,0,.1)]">
              <div className="absolute top-6 left-4 size-2 rounded-full bg-[#382918]" />
              <div className="absolute top-6 right-4 size-2 rounded-full bg-[#382918]" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-mynted-ink">{t('landing.visual.collectionTitle')}</p>
            <p className="text-[10px] text-mynted-gray-light">{t('landing.visual.collectionSubtitle')}</p>
          </div>
          <div className="flex -space-x-2">
            <span className="size-6 rounded-full border-2 border-white bg-mynted-orange" />
            <span className="size-6 rounded-full border-2 border-white bg-mynted-blue-mid" />
            <span className="size-6 rounded-full border-2 border-white bg-mynted-ink" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-1 left-0 flex rotate-[-7deg] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_18px_35px_rgba(18,32,65,.14)]">
        <span className="grid size-9 place-items-center rounded-xl bg-[#fff0eb] text-mynted-orange">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-mynted-gray-light uppercase [:lang(ko)_&]:tracking-normal">
            {t('landing.visual.trending')}
          </p>
          <p className="text-sm font-bold text-mynted-ink">{t('landing.visual.trendingTitle')}</p>
        </div>
      </div>
      <div className="absolute top-0 -right-1 grid size-16 rotate-12 place-items-center rounded-2xl bg-mynted-orange text-white shadow-[0_14px_25px_rgba(253,133,82,.35)]">
        <Gem className="size-7" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Secciones informativas
// ---------------------------------------------------------------------------

const FEATURES: { icon: ComponentType<{ className?: string }>; title: TranslationKey; text: TranslationKey }[] = [
  { icon: Users, title: 'landing.features.communitiesTitle', text: 'landing.features.communitiesText' },
  { icon: BadgeCheck, title: 'landing.features.marketplaceTitle', text: 'landing.features.marketplaceText' },
  { icon: MessageCircle, title: 'landing.features.chatTitle', text: 'landing.features.chatText' },
  { icon: Heart, title: 'landing.features.favoritesTitle', text: 'landing.features.favoritesText' },
]

function Features() {
  const { t } = useLanguage()
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
      <div className="max-w-2xl">
        <Eyebrow>{t('landing.features.eyebrow')}</Eyebrow>
        <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{t('landing.features.title')}</h2>
        <p className="mt-5 text-lg leading-8 text-mynted-gray">{t('landing.features.description')}</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }, index) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(24,34,56,.04)]">
            <div
              className={`mb-7 grid size-12 place-items-center rounded-2xl ${
                index % 2 ? 'bg-[#fff0eb] text-mynted-orange' : 'bg-[#eaf0ff] text-mynted-blue-mid'
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="font-heading text-lg leading-tight font-semibold">{t(title)}</h3>
            <p className="mt-3 text-sm leading-6 text-mynted-gray">{t(text)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

const STEPS: { icon: ComponentType<{ className?: string }>; title: TranslationKey; text: TranslationKey }[] = [
  { icon: Users, title: 'landing.steps.joinTitle', text: 'landing.steps.joinText' },
  { icon: Search, title: 'landing.steps.exploreTitle', text: 'landing.steps.exploreText' },
  { icon: Zap, title: 'landing.steps.connectTitle', text: 'landing.steps.connectText' },
]

function Steps({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useLanguage()
  return (
    <section className="bg-mynted-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-28">
        <div>
          <Eyebrow>{t('landing.steps.eyebrow')}</Eyebrow>
          <h2 className="max-w-md font-heading text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            {t('landing.steps.title')}
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">{t('landing.steps.description')}</p>
          <JoinLink
            isLoggedIn={isLoggedIn}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-mynted-orange px-6 py-4 text-sm font-bold text-white transition hover:bg-[#ff9b70]"
          >
            {isLoggedIn ? t('landing.hero.communitiesCta') : t('landing.steps.cta')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </JoinLink>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-3xl border border-white/10 bg-white/[.06] p-6">
              <span className="font-mono text-sm text-mynted-orange">{String(index + 1).padStart(2, '0')}</span>
              <Icon className="mt-12 size-6 text-[#8eaeff]" aria-hidden="true" />
              <h3 className="mt-6 font-heading text-xl font-semibold">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t(text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Comunidades (datos reales)
// ---------------------------------------------------------------------------

const CARD_STYLES = [
  { color: 'bg-[#f4b8a5]', accent: 'text-[#c4502e]', mark: '✦' },
  { color: 'bg-[#b9c9f8]', accent: 'text-mynted-blue-mid', mark: '◈' },
  { color: 'bg-[#f7d889]', accent: 'text-[#916d0a]', mark: '✺' },
  { color: 'bg-[#b7e0d3]', accent: 'text-[#24795e]', mark: '⬡' },
]

/** Se muestran si todavía no hay comunidades (o no se pudieron cargar). */
const FALLBACK_FRANCHISES: TranslationKey[] = [
  'landing.communities.fallbackAnime',
  'landing.communities.fallbackGaming',
  'landing.communities.fallbackComics',
  'landing.communities.fallbackFigures',
]

function Communities() {
  const { t, language } = useLanguage()
  const communitiesQuery = useCommunities({ sort: 'popularity', limit: 4 })
  const communities = communitiesQuery.data?.data ?? []
  const showFallback = !communitiesQuery.isPending && communities.length === 0

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <Eyebrow tone="blue">{t('landing.communities.eyebrow')}</Eyebrow>
          <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{t('landing.communities.title')}</h2>
        </div>
        <Link to="/communities" className="group inline-flex items-center gap-2 text-sm font-bold text-mynted-blue-mid">
          {t('landing.communities.viewAll')}
          <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {communitiesQuery.isPending &&
          CARD_STYLES.map((_, index) => (
            <div key={index} className="h-[300px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}

        {communities.map((community, index) => (
          <CommunityCard key={community.id} community={community} style={CARD_STYLES[index % CARD_STYLES.length]} language={language} />
        ))}

        {showFallback &&
          FALLBACK_FRANCHISES.map((labelKey, index) => {
            const style = CARD_STYLES[index]
            return (
              <article key={labelKey} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className={`grid h-48 place-items-center ${style.color}`}>
                  <div className={`grid size-24 place-items-center rounded-[30px] bg-white/50 text-6xl font-bold ${style.accent}`}>
                    {style.mark}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-semibold">{t(labelKey)}</h3>
                  <p className="mt-1 text-xs text-mynted-gray-light">{t('landing.communities.fallbackHint')}</p>
                </div>
              </article>
            )
          })}
      </div>
    </section>
  )
}

function CommunityCard({
  community,
  style,
  language,
}: {
  community: CommunityListItem
  style: (typeof CARD_STYLES)[number]
  language: string
}) {
  const { t } = useLanguage()
  return (
    <Link
      to="/communities/$slug"
      params={{ slug: community.slug }}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mynted-blue-mid"
    >
      <div className={`relative grid h-48 place-items-center ${style.color}`}>
        {community.bannerUrl ? (
          <img src={community.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className={`relative grid size-24 place-items-center overflow-hidden rounded-[30px] bg-white/50 text-6xl font-bold shadow-sm ${style.accent}`}>
          {community.imageUrl ? <img src={community.imageUrl} alt="" className="h-full w-full object-cover" /> : style.mark}
        </div>
        <span className="absolute top-4 right-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase [:lang(ko)_&]:tracking-normal">
          {community.isPrivate ? t('communities.card.private') : t('communities.card.public')}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-heading font-semibold">{community.name}</h3>
            <p className="mt-1 text-xs text-mynted-gray-light">
              {t('communities.card.members', { count: community.memberCount.toLocaleString(language) })}
            </p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-[#eaf0ff] group-hover:text-mynted-blue-mid">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <span className="truncate text-xs font-bold text-mynted-blue-mid">@{community.slug}</span>
          {community.category && <span className="shrink-0 text-xs text-mynted-gray-light">{community.category.name}</span>}
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Valores, CTA final y pie
// ---------------------------------------------------------------------------

const VALUES: { icon: ComponentType<{ className?: string }>; title: TranslationKey; text: TranslationKey }[] = [
  { icon: Layers3, title: 'landing.values.specializedTitle', text: 'landing.values.specializedText' },
  { icon: ShieldCheck, title: 'landing.values.trustTitle', text: 'landing.values.trustText' },
  { icon: LockKeyhole, title: 'landing.values.safeTitle', text: 'landing.values.safeText' },
  { icon: Star, title: 'landing.values.realTitle', text: 'landing.values.realText' },
]

function Values() {
  const { t } = useLanguage()
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
      <div className="grid overflow-hidden rounded-[36px] bg-[#eaf0ff] lg:grid-cols-2">
        <div className="p-8 sm:p-12 lg:p-16">
          <Eyebrow tone="blue">{t('landing.values.eyebrow')}</Eyebrow>
          <h2 className="max-w-lg font-heading text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            {t('landing.values.title')}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 text-mynted-orange">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading font-semibold">{t(title)}</h3>
                  <p className="mt-1 text-sm leading-5 text-mynted-gray">{t(text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden min-h-[420px] overflow-hidden bg-mynted-blue-mid lg:block" aria-hidden="true">
          <div className="absolute top-12 -right-12 size-72 rounded-full border-[42px] border-mynted-orange/80" />
          <div className="absolute bottom-[-80px] left-[-50px] size-80 rounded-full border-[55px] border-white/20" />
          <div className="absolute top-1/2 left-1/2 grid size-44 -translate-x-1/2 -translate-y-1/2 rotate-12 place-items-center rounded-[42px] bg-white shadow-2xl">
            <div className="grid size-28 place-items-center rounded-[30px] bg-[#fff0eb] text-mynted-orange">
              <Gem className="size-14" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useLanguage()
  const buttonClass =
    'mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-mynted-orange shadow-[0_5px_0_#d6572e] transition hover:-translate-y-0.5'

  return (
    <section className="px-6 pb-20 lg:px-10 lg:pb-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-mynted-orange px-7 py-14 text-center text-white shadow-[0_18px_40px_rgba(253,133,82,.22)] sm:px-12 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <Eyebrow tone="light">{t('landing.cta.eyebrow')}</Eyebrow>
          <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">{t('landing.cta.title')}</h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/85">
            {isLoggedIn ? t('landing.cta.loggedInDescription') : t('landing.cta.description')}
          </p>
          {isLoggedIn ? (
            <Link to="/" className={buttonClass}>
              {t('landing.cta.goHome')} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link to="/login" search={{ mode: 'register' }} className={buttonClass}>
              {t('landing.cta.signUp')} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useLanguage()
  const linkClass = 'transition-colors hover:text-mynted-blue-mid'

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <Link to="/" aria-label="Mynted">
              <Logo ver="small" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-mynted-gray">{t('landing.footer.tagline')}</p>
          </div>
          <nav aria-label={t('landing.footer.linksLabel')} className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-mynted-gray">
            <Link to="/" className={linkClass}>
              {t('nav.home')}
            </Link>
            <Link to="/communities" className={linkClass}>
              {t('nav.communities')}
            </Link>
            <Link to="/legal/privacidad" className={linkClass}>
              {t('onboarding.privacyPolicyLinkText')}
            </Link>
            <Link to="/legal/cookies" className={linkClass}>
              {t('cookieBanner.cookiesPolicyLinkText')}
            </Link>
            <a href="mailto:myntedstate@gmail.com" className={linkClass}>
              {t('landing.footer.contact')}
            </a>
          </nav>
        </div>
        <p className="border-t border-slate-100 pt-6 text-xs text-mynted-gray-light">
          {t('landing.footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
