import { Link } from '@tanstack/react-router'
import { ArrowRight, MessageCircle, Package, ShoppingBag, Sparkles, Users, Repeat2 } from 'lucide-react'
import { motion } from 'motion/react'
import gooseMynted from '@/assets/goose-mynted.png'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CommunityPattern } from '@/features/community/components/ui/CommunityPattern'
import { TalkFeed } from '@/features/community/components/sections/TalkFeed'
import { useCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { ShopFeed } from '@/features/products/components/ShopFeed'
import { useLanguage } from '@/i18n/LanguageContext'
import { SiteHeader } from '../components/layout/SiteHeader'

/**
 * Home. De arriba a abajo:
 *
 * 1. Hero (solo sin sesión): explica qué es Mynted en una pantalla y lleva a crear cuenta o
 *    a la tienda. Con sesión se omite, para que quien vuelve llegue directo a los productos.
 * 2. Shop: productos agrupados por tag, con scroll infinito (visible también sin sesión).
 * 3. Talk (solo con sesión): las publicaciones que coinciden con los intereses del usuario
 *    (GET /users/me/recommended-posts). El feed de todas las comunidades vive en /explore.
 * 4. Comunidades más populares (GET /communities es público).
 * 5. Llamado a vender.
 */
export default function HomePage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading } = useCurrentUser()

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-16 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        {/* Mientras se resuelve la sesión no se muestra, para que no aparezca y desaparezca. */}
        {!isLoading && !isLoggedIn && <Hero />}

        <section id="shop" aria-labelledby="home-shop-title" className="flex scroll-mt-28 flex-col gap-8">
          <ScrollReveal>
            <SectionHeading id="home-shop-title" eyebrow={t('home.shop.eyebrow')} title={t('home.shop.title')} />
          </ScrollReveal>
          <ShopFeed />
        </section>

        {/* Pide sesión: sin ella no se muestra, en vez de dejar un bloque pidiendo entrar. */}
        {isLoggedIn && (
          <section id="talk" aria-labelledby="home-talk-title" className="flex scroll-mt-28 flex-col gap-8">
            <ScrollReveal>
              <SectionHeading id="home-talk-title" eyebrow={t('home.talk.eyebrow')} title={t('home.talk.title')} />
            </ScrollReveal>
            <TalkFeed source="interests" />
          </section>
        )}

        <PopularCommunities />

        <SellCta />
      </main>

      <motion.div
        className="fixed right-6 bottom-6"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.4 }}
      >
        <HomeChatLink />
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Piezas pequeñas
// ---------------------------------------------------------------------------

/** Eyebrow + título de sección. El eyebrow va en azul: el naranja sobre el fondo claro no llega a contraste AA. */
function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-mynted-blue-mid uppercase [:lang(ko)_&]:tracking-normal">
        {eyebrow}
      </p>
      <h2 id={id} className="font-heading text-3xl font-semibold text-mynted-ink">
        {title}
      </h2>
    </div>
  )
}

function HomeChatLink() {
  const { t } = useLanguage()
  return (
    <Link
      to="/messages"
      aria-label={t('shop.chat')}
      className="flex size-[60px] items-center justify-center rounded-full bg-mynted-blue text-white shadow-[0_6px_18px_-2px_rgba(47,95,255,0.35)]"
    >
      <MessageCircle className="size-[26px]" aria-hidden="true" />
    </Link>
  )
}

// Mismo tamaño que `Button size="lg"`. El texto va oscuro sobre el naranja (7:1; con blanco serían 2.3:1).
const ctaBase =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid'
const ctaPrimary = `${ctaBase} bg-mynted-orange text-mynted-ink hover:bg-mynted-orange-hover`
const ctaSecondary = `${ctaBase} border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg`

// ---------------------------------------------------------------------------
// Hero (sin sesión)
// ---------------------------------------------------------------------------

function Hero() {
  const { t } = useLanguage()

  return (
    <section className="grid items-center gap-10 py-2 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
      <div>
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-mynted-yellow px-3.5 py-1.5 text-xs font-semibold text-mynted-ink">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {t('landing.hero.badge')}
        </span>

        <h1 className="max-w-[640px] font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-mynted-ink sm:text-5xl sm:leading-[1.1]">
          {t('home.hero.titleStart')}{' '}
          {/* Resaltador en vez de texto naranja: mantiene el color de marca y el contraste. */}
          <span className="rounded-lg bg-mynted-orange px-2 box-decoration-clone">{t('home.hero.titleAccent')}</span>
        </h1>

        <p className="mt-5 max-w-[520px] text-base leading-7 text-mynted-gray sm:text-lg sm:leading-8">
          {t('home.hero.description')}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/login" search={{ mode: 'register' }} className={ctaPrimary}>
            {t('landing.hero.signUpCta')}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          <a href="#shop" className={ctaSecondary}>
            {t('landing.hero.primaryCta')}
          </a>
        </div>
      </div>

      <HeroVisual />
    </section>
  )
}

/** Composición decorativa: la mascota y los tres pilares (venta, intercambio, comunidades). Sin datos inventados. */
function HeroVisual() {
  const { t } = useLanguage()

  return (
    <div className="hidden h-[340px] grid-cols-2 gap-4 lg:grid" aria-hidden="true">
      <div className="row-span-2 flex items-end justify-center overflow-hidden rounded-[22px] bg-[#dce5ff]">
        <img src={gooseMynted} alt="" className="h-[92%] w-full object-contain object-bottom" />
      </div>

      <div className="flex flex-col justify-center gap-3 rounded-[22px] bg-mynted-yellow p-5">
        <p className="flex items-center gap-3 font-heading text-lg font-semibold text-mynted-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-white/60">
            <ShoppingBag className="size-5" />
          </span>
          {t('products.type.sale')}
        </p>
        <p className="flex items-center gap-3 font-heading text-lg font-semibold text-mynted-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-white/60">
            <Repeat2 className="size-5" />
          </span>
          {t('products.type.exchange')}
        </p>
      </div>

      <div className="flex flex-col justify-between rounded-[22px] bg-mynted-blue-dark p-5 text-white">
        <Users className="size-7" />
        <p className="font-heading text-lg leading-snug font-semibold">{t('landing.features.communitiesTitle')}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comunidades populares
// ---------------------------------------------------------------------------

/** Fondos de las tarjetas, en orden. */
const COMMUNITY_TONES = ['bg-[#ffdfd1]', 'bg-[#dce5ff]', 'bg-mynted-yellow']

function PopularCommunities() {
  const { t, language } = useLanguage()
  const query = useCommunities({ sort: 'popularity', limit: COMMUNITY_TONES.length })
  const communities = query.data?.data ?? []

  // Sin comunidades (o si falló la carga) la sección no aporta nada: se omite en vez de mostrar un error.
  if (!query.isPending && communities.length === 0) return null

  return (
    <section aria-labelledby="home-communities-title" className="flex flex-col gap-8">
      <ScrollReveal className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          id="home-communities-title"
          eyebrow={t('landing.communities.eyebrow')}
          title={t('home.communities.title')}
        />
        <Link to="/communities" className="inline-flex items-center gap-1 text-sm font-semibold text-mynted-blue-mid hover:underline">
          {t('landing.communities.viewAll')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </ScrollReveal>

      <ul className="grid gap-5 md:grid-cols-3">
        {query.isPending
          ? COMMUNITY_TONES.map((_, index) => (
              <li key={index} aria-hidden="true" className="h-[216px] animate-pulse rounded-2xl bg-white" />
            ))
          : communities.map((community, index) => (
              <StaggerItem key={community.id} index={index}>
                <CommunityCard
                  community={community}
                  tone={COMMUNITY_TONES[index % COMMUNITY_TONES.length]}
                  language={language}
                />
              </StaggerItem>
            ))}
      </ul>
    </section>
  )
}

function CommunityCard({ community, tone, language }: { community: CommunityListItem; tone: string; language: string }) {
  const { t } = useLanguage()
  const cover = community.bannerUrl ?? community.imageUrl

  return (
    <Link
      to="/communities/$slug"
      params={{ slug: community.slug }}
      aria-label={t('community.card.open', { name: community.name })}
      className={`group flex flex-col gap-3 rounded-2xl border border-mynted-border p-3 outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(13,13,20,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid ${tone}`}
    >
      <div className="relative h-32 overflow-hidden rounded-xl bg-white/60">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <CommunityPattern seed={community.id} className="absolute inset-0" />
        )}
        {community.category && (
          <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-mynted-ink">
            {community.category.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-1 pb-1">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-mynted-ink">{community.name}</h3>
          <p className="mt-0.5 text-xs text-mynted-ink/70">
            {t('communities.card.members', { count: community.memberCount.toLocaleString(language) })}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-mynted-ink transition-colors group-hover:bg-mynted-ink group-hover:text-white">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Llamado a vender
// ---------------------------------------------------------------------------

/**
 * Vendedor → publicar; con sesión pero sin rol de vendedor → ajustes de perfil, donde está
 * la solicitud para serlo; sin sesión → crear cuenta. El superadmin no vende, así que no lo ve.
 */
function SellCta() {
  const { t } = useLanguage()
  const { data: user, isLoggedIn, isLoading } = useCurrentUser()

  if (isLoading || user?.role === 'superadmin') return null

  const buttonClass = `${ctaBase} bg-white text-mynted-ink hover:bg-mynted-bg`
  const label = (
    <>
      {t('home.sell.cta')}
      <ArrowRight className="size-5" aria-hidden="true" />
    </>
  )

  return (
    <ScrollReveal>
      <section className="flex flex-col items-start justify-between gap-6 rounded-[22px] bg-mynted-orange p-7 sm:flex-row sm:items-center sm:p-9">
        <div className="flex items-start gap-5">
          <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-white/40 text-mynted-ink sm:grid">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="max-w-[440px] font-heading text-2xl leading-tight font-semibold text-mynted-ink sm:text-3xl">
              {t('home.sell.title')}
            </h2>
            <p className="mt-2 max-w-[480px] text-base leading-7 text-mynted-ink/80">{t('home.sell.body')}</p>
          </div>
        </div>

        {user?.role === 'seller' ? (
          <Link to="/products/new" className={buttonClass}>
            {label}
          </Link>
        ) : isLoggedIn ? (
          <Link to="/settings" search={{ tab: 'profile' }} className={buttonClass}>
            {label}
          </Link>
        ) : (
          <Link to="/login" search={{ mode: 'register' }} className={buttonClass}>
            {label}
          </Link>
        )}
      </section>
    </ScrollReveal>
  )
}
