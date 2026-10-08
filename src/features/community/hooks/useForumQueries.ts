import { useInfiniteQuery } from '@tanstack/react-query'
import { getMyContent, getMyForumPosts } from '../services/forumService'
import type { MyForumPostsQuery, PaginatedResponse } from '../models/communityDTOs'

export const forumKeys = {
  all: ['forum'] as const,
  myThreads: (query: MyForumPostsQuery) => [...forumKeys.all, 'mine', 'threads', query] as const,
  myContent: () => [...forumKeys.all, 'mine', 'content'] as const,
}

const MY_PAGE_SIZE = 12
/** Múltiplo de 7: el patrón del bento grid se repite cada 7 tarjetas, así cada página cierra bloques completos. */
const MY_CONTENT_PAGE_SIZE = 14

function nextPage<T>(last: PaginatedResponse<T>) {
  return last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined
}

/** Pestaña "Hilos" del perfil: posts del usuario (GET /forums/me). */
export function useMyForumPosts(sort: Pick<MyForumPostsQuery, 'sortBy' | 'order'> = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: forumKeys.myThreads(sort),
    queryFn: ({ pageParam }) => getMyForumPosts({ ...sort, page: pageParam, limit: MY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  })
}

/** Pestaña "Publicaciones" del perfil: posts y productos del usuario mezclados (GET /posts/me). */
export function useMyContent(enabled = true) {
  return useInfiniteQuery({
    queryKey: forumKeys.myContent(),
    queryFn: ({ pageParam }) => getMyContent({ page: pageParam, limit: MY_CONTENT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  })
}
