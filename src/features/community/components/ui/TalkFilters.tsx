import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FilterGroup } from '@/components/ui/FilterGroup'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { inputClasses } from '@/features/community/types/DEFAULT_VALUES'

interface TalkFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  tagIds: number[]
  onTagIdsChange: (tagIds: number[]) => void
  activeCount: number
  onClear: () => void
}

/** Espera a que la persona deje de escribir antes de pedir el feed de nuevo. */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Panel de filtros de "Talk", con el mismo marco que el de "Shop". El backend
 * solo filtra por texto y por tags (ver GetGlobalPostsQueryDto), asi que son
 * esos dos grupos; los tags van con OR entre ellos.
 */
export function TalkFilters({
  search,
  onSearchChange,
  tagIds,
  onTagIdsChange,
  activeCount,
  onClear,
}: TalkFiltersProps) {
  const { t } = useLanguage()
  const tags = useTags()

  // El input se escribe local y recien despues viaja al feed, para no pedir
  // una pagina nueva por cada tecla.
  const [draft, setDraft] = useState(search)
  const [lastSearch, setLastSearch] = useState(search)
  if (search !== lastSearch) {
    setLastSearch(search)
    setDraft(search)
  }

  useEffect(() => {
    if (draft === search) return
    const timer = setTimeout(() => onSearchChange(draft), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, search, onSearchChange])

  function toggle(tagId: number) {
    onTagIdsChange(tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId])
  }

  return (
    <aside
      aria-label={t('explore.filters.title')}
      className="flex flex-col gap-5 rounded-2xl border border-mynted-border bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('explore.filters.title')}</h2>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="px-2 text-xs text-mynted-blue">
            <X className="size-3.5" aria-hidden="true" />
            {t('explore.filters.clear')}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="talk-search" className="text-xs font-semibold text-mynted-gray">
          {t('talk.filters.search')}
        </label>
        <input
          id="talk-search"
          type="search"
          placeholder={t('talk.filters.searchPlaceholder')}
          className={inputClasses(false)}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </div>

      <FilterGroup label={t('talk.filters.tags')}>
        <Button
          variant={tagIds.length === 0 ? 'primary' : 'secondary'}
          size="sm"
          shape="pill"
          aria-pressed={tagIds.length === 0}
          onClick={() => onTagIdsChange([])}
        >
          {t('talk.filters.all')}
        </Button>

        {tags.isPending &&
          Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="h-8 w-20 animate-pulse rounded-full bg-mynted-bg" />
          ))}

        {tags.data?.map((tag) => {
          const isSelected = tagIds.includes(tag.tagId)
          return (
            <Button
              key={tag.tagId}
              variant={isSelected ? 'primary' : 'secondary'}
              size="sm"
              shape="pill"
              aria-pressed={isSelected}
              onClick={() => toggle(tag.tagId)}
            >
              #{tag.name}
            </Button>
          )
        })}
      </FilterGroup>
    </aside>
  )
}
