import type { ReactNode } from 'react'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'

/**
 * Estados comunes de las pestañas del perfil que listan contenido paginado
 * (cargando, error con reintento, vacío) y el botón "Cargar más".
 */
export function ProfileFeedFrame<TPage extends PaginatedResponse<unknown>>({
  query,
  isEmpty,
  emptyTitle,
  emptySubtitle,
  children,
}: {
  query: UseInfiniteQueryResult<InfiniteData<TPage>>
  isEmpty: boolean
  emptyTitle: TranslationKey
  emptySubtitle: TranslationKey
  children: ReactNode
}) {
  const { t } = useLanguage()

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center"
        role="alert"
      >
        <p className="text-sm font-semibold text-mynted-ink">{t('forum.list.loadError')}</p>
        <p className="text-sm text-mynted-gray">{getApiErrorMessage(query.error)}</p>
        <Button type="button" onClick={() => void query.refetch()} variant="secondary" size="sm" className="mt-2">
          {t('communities.list.retry')}
        </Button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-16 text-center">
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t(emptyTitle)}</h2>
        <p className="max-w-sm text-sm text-mynted-gray">{t(emptySubtitle)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {children}
      {query.hasNextPage && (
        <Button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          variant="secondary"
          size="md"
          isLoading={query.isFetchingNextPage}
          className="mx-auto"
        >
          {t('products.list.loadMore')}
        </Button>
      )}
    </div>
  )
}
