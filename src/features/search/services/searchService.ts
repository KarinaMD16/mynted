import myntedAPI from '@/api/apiConfig'
import type { SearchItemByType, SearchSummary, SearchType, SearchTypePage } from '../models/search'

/** GET /search?q= — resumen con los primeros resultados de cada tipo (la sesión es opcional). */
export async function searchSummary(q: string): Promise<SearchSummary> {
  const { data } = await myntedAPI.get<SearchSummary>('/search', { params: { q } })
  return data
}

/** GET /search?q=&type=&page=&limit= — resultados paginados de un solo tipo. */
export async function searchByType<T extends SearchType>(
  type: T,
  q: string,
  page: number,
  limit: number,
): Promise<SearchTypePage<SearchItemByType[T]>> {
  const { data } = await myntedAPI.get<SearchTypePage<SearchItemByType[T]>>('/search', { params: { q, type, page, limit } })
  return data
}
