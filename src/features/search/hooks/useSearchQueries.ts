import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { SearchItemByType, SearchType, SearchTypePage } from '../models/search'
import { searchByType, searchSummary } from '../services/searchService'

export const searchKeys = {
  all: ['search'] as const,
  summary: (q: string) => [...searchKeys.all, 'summary', q] as const,
  type: (type: SearchType, q: string) => [...searchKeys.all, 'type', type, q] as const,
}

/** Resumen por tipo para el desplegable del buscador y la pestaña "Todo". */
export function useSearchSummary(q: string, enabled = true) {
  return useQuery({
    queryKey: searchKeys.summary(q),
    queryFn: () => searchSummary(q),
    enabled: enabled && q.length > 0,
    staleTime: 30_000,
  })
}

const TYPE_PAGE_SIZE = 12

/** Resultados de un solo tipo con "Cargar más". */
export function useSearchByType<T extends SearchType>(type: T, q: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: searchKeys.type(type, q),
    queryFn: ({ pageParam }) => searchByType(type, q, pageParam, TYPE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last: SearchTypePage<SearchItemByType[T]>) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: enabled && q.length > 0,
    staleTime: 30_000,
  })
}
