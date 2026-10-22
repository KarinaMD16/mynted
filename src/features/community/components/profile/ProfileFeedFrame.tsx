import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import type { ReactNode } from 'react'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
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
      <QueryErrorState error={query.error} onRetry={() => void query.refetch()} texts={{ error: { description: t('forum.list.loadError') } }} />
    )
  }

  if (isEmpty) {
    return (
      <ErrorState kind="empty" variant="compact" title={t(emptyTitle)} description={t(emptySubtitle)} />
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
