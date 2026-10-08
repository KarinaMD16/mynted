import { SearchIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from '@/cuicui/utils/cn'
import {
  CommunityResultRow,
  PostResultRow,
  ProductResultRow,
  UserResultRow,
} from '@/features/search/components/SearchResultRows'
import { useSearchSummary } from '@/features/search/hooks/useSearchQueries'
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LIVE_LENGTH, type SearchSummary, type SearchType } from '@/features/search/models/search'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'

/** Resultados que se muestran por tipo en el desplegable; el resto está en "Ver todos". */
const PREVIEW_COUNT = 3
const DEBOUNCE_MS = 300

const SECTION_TITLE: Record<SearchType, TranslationKey> = {
  products: 'search.section.products',
  communities: 'search.section.communities',
  users: 'search.section.users',
  posts: 'search.section.posts',
}

/**
 * Buscador del header. Al escribir (con una pausa breve) muestra un resumen de
 * GET /search con los primeros resultados de cada tipo y un "Ver todos"; con
 * Enter o el botón del teclado móvil lleva a /search?q=. Es un
 * <form role="search">. La búsqueda es pública (la sesión es opcional).
 */
export const SearchBar = ({ className }: { className?: string }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const inputId = useId()
  const panelId = useId()
  const rootRef = useRef<HTMLFormElement>(null)
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value])

  // Cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const canSearchLive = debounced.length >= SEARCH_MIN_LIVE_LENGTH
  const summary = useSearchSummary(debounced, isOpen && canSearchLive)
  const showPanel = isOpen && value.trim().length >= SEARCH_MIN_LIVE_LENGTH

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    setIsOpen(false)
    void navigate({ to: '/search', search: { q: query, type: undefined } })
  }

  const close = () => setIsOpen(false)

  return (
    <form ref={rootRef} role="search" onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <label htmlFor={inputId} className="sr-only">
        {t('search.placeholder')}
      </label>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mynted-gray"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        maxLength={SEARCH_MAX_LENGTH}
        autoComplete="off"
        aria-expanded={showPanel}
        aria-controls={panelId}
        onChange={(event) => {
          setValue(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={t('search.placeholderLong')}
        className="h-10 w-full rounded-full border border-mynted-border bg-white pr-4 pl-10 text-sm text-mynted-ink outline-none transition-colors placeholder:text-mynted-gray hover:border-mynted-gray-light focus:border-mynted-blue-mid focus:ring-2 focus:ring-mynted-blue-mid/20"
      />

      <div
        id={panelId}
        hidden={!showPanel}
        className="absolute top-full right-0 z-50 mt-2 max-h-[70vh] w-[min(92vw,380px)] overflow-y-auto rounded-2xl border border-mynted-border bg-white p-2 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.18)]"
      >
        {showPanel && <SearchPanelContent summary={summary} isDebouncing={!canSearchLive || debounced !== value.trim()} query={debounced} onNavigate={close} />}
      </div>
    </form>
  )
}

function SearchPanelContent({
  summary,
  isDebouncing,
  query,
  onNavigate,
}: {
  summary: ReturnType<typeof useSearchSummary>
  isDebouncing: boolean
  query: string
  onNavigate: () => void
}) {
  const { t } = useLanguage()

  if (summary.isError) {
    return <p className="px-3 py-4 text-sm text-red-500">{t('search.error')}</p>
  }
  if (!summary.data || (isDebouncing && summary.isFetching)) {
    return (
      <p className="px-3 py-4 text-sm text-mynted-gray" role="status">
        {t('search.searching')}
      </p>
    )
  }

  const data: SearchSummary = summary.data
  const total = data.products.total + data.communities.total + data.users.total + data.posts.total
  if (total === 0) {
    return (
      <p className="px-3 py-4 text-sm text-mynted-gray" role="status">
        {t('search.noResults', { query })}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <Section type="products" total={data.products.total} query={data.q} onNavigate={onNavigate}>
        {data.products.data.slice(0, PREVIEW_COUNT).map((product) => (
          <ProductResultRow key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </Section>
      <Section type="communities" total={data.communities.total} query={data.q} onNavigate={onNavigate}>
        {data.communities.data.slice(0, PREVIEW_COUNT).map((community) => (
          <CommunityResultRow key={community.id} community={community} onNavigate={onNavigate} />
        ))}
      </Section>
      <Section type="users" total={data.users.total} query={data.q} onNavigate={onNavigate}>
        {data.users.data.slice(0, PREVIEW_COUNT).map((user) => (
          <UserResultRow key={user.id} user={user} onNavigate={onNavigate} />
        ))}
      </Section>
      <Section type="posts" total={data.posts.total} query={data.q} onNavigate={onNavigate}>
        {data.posts.data.slice(0, PREVIEW_COUNT).map((post) => (
          <PostResultRow key={post.id} post={post} onNavigate={onNavigate} />
        ))}
      </Section>
      <Link
        to="/search"
        search={{ q: data.q, type: undefined }}
        onClick={onNavigate}
        className="mt-1 rounded-xl px-3 py-2 text-center text-sm font-semibold text-mynted-blue hover:bg-mynted-bg"
      >
        {t('search.seeAll', { query: data.q })}
      </Link>
    </div>
  )
}

function Section({
  type,
  total,
  query,
  onNavigate,
  children,
}: {
  type: SearchType
  total: number
  query: string
  onNavigate: () => void
  children: ReactNode
}) {
  const { t } = useLanguage()
  if (total === 0) return null
  return (
    <section aria-label={t(SECTION_TITLE[type])} className="flex flex-col">
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <h3 className="text-xs font-semibold tracking-wide text-mynted-gray uppercase">{t(SECTION_TITLE[type])}</h3>
        {total > PREVIEW_COUNT && (
          <Link
            to="/search"
            search={{ q: query, type }}
            onClick={onNavigate}
            className="text-xs font-semibold text-mynted-blue hover:underline"
          >
            {t('search.seeType', { count: total })}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export default SearchBar
