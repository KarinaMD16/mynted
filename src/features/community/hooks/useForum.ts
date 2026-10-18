import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPost,
  createReply,
  getCommunityPosts,
  getGlobalPosts,
  getExplorePosts,
  getHomePosts,
  getPost,
  getPostReplies,
  setPostFavorite,
  setReplyFavorite,
  votePost,
  voteReply,
} from '../services/forumService'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { PaginatedResponse } from '../models/communityDTOs'
import type { FeedSort, ForumPostsQuery, GlobalPostsPage, GlobalPostsQuery, VoteType } from '../models/forumDTOs'

/** Filtros del feed global; la pagina y el limite los pone el scroll infinito. */
export type GlobalPostsFilters = Omit<GlobalPostsQuery, 'page' | 'limit'>

export const forumKeys = {
  all: ['forum'] as const,
  posts: (communityId: number, query: ForumPostsQuery) => ['forum', 'posts', communityId, query] as const,
  globalPosts: (filters: GlobalPostsFilters) => ['forum', 'global-posts', filters] as const,
  // El usuario va en la clave: estos feeds cambian segun la sesion (comunidades, intereses).
  homePosts: (viewer: string | null, sort: FeedSort) => ['forum', 'home-posts', viewer, sort] as const,
  explorePosts: (viewer: string | null) => ['forum', 'explore-posts', viewer] as const,
  post: (postId: number) => ['forum', 'post', postId] as const,
  replies: (postId: number) => ['forum', 'replies', postId] as const,
}

const GLOBAL_POSTS_PAGE_SIZE = 10

const nextPage = (last: PaginatedResponse<unknown>) =>
  last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined

/**
 * Une las paginas de un feed quitando repetidos: el orden depende de los votos
 * del momento, asi que entre una pagina y la siguiente un post puede moverse y
 * volver a aparecer (ver GUIA_FRONTEND 1.5).
 */
export function flattenUniquePosts<T extends { id: number }>(pages: { data: T[] }[] | undefined): T[] {
  const seen = new Set<number>()
  const items: T[] = []
  for (const page of pages ?? []) {
    for (const post of page.data) {
      if (seen.has(post.id)) continue
      seen.add(post.id)
      items.push(post)
    }
  }
  return items
}

/**
 * Home (GET /home/posts): posts de las comunidades del usuario, o de
 * comunidades publicas si no hay sesion o todavia no se unio a ninguna.
 */
export const useHomePosts = (sort: FeedSort = 'hot', enabled = true) => {
  const { userId, isLoading } = useCurrentUser()
  return useInfiniteQuery({
    queryKey: forumKeys.homePosts(userId, sort),
    queryFn: ({ pageParam }) => getHomePosts(pageParam, GLOBAL_POSTS_PAGE_SIZE, sort),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    // Espera a saber si hay sesion, para no pedir el feed publico y luego el personal.
    enabled: enabled && !isLoading,
  })
}

/** "Para ti" de Explorar (GET /explore/forums/posts): intereses + votos + comunidades nuevas. Sin filtros. */
export const useExplorePosts = (enabled = true) => {
  const { userId, isLoading } = useCurrentUser()
  return useInfiniteQuery({
    queryKey: forumKeys.explorePosts(userId),
    queryFn: ({ pageParam }) => getExplorePosts(pageParam, GLOBAL_POSTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: enabled && !isLoading,
  })
}

/** Feed de "Talk" en Explorar: todas las comunidades publicas, con scroll infinito. */
export const useGlobalPosts = (filters: GlobalPostsFilters = {}, enabled = true) => {
  return useInfiniteQuery({
    queryKey: forumKeys.globalPosts(filters),
    queryFn: ({ pageParam }) =>
      getGlobalPosts({ ...filters, page: pageParam, limit: GLOBAL_POSTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last: GlobalPostsPage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
  })
}

export const useCommunityPosts = (communityId: number, query: ForumPostsQuery = {}, enabled = true) => {
  return useQuery({
    queryKey: forumKeys.posts(communityId, query),
    queryFn: () => getCommunityPosts(communityId, query),
    enabled: enabled && communityId > 0,
  })
}

export const usePost = (postId: number, enabled = true) => {
  return useQuery({
    queryKey: forumKeys.post(postId),
    queryFn: () => getPost(postId),
    enabled: enabled && postId > 0,
  })
}

export const usePostReplies = (postId: number, enabled = true) => {
  return useQuery({
    queryKey: forumKeys.replies(postId),
    queryFn: () => getPostReplies(postId),
    enabled: enabled && postId > 0,
  })
}

/**
 * Acciones del foro. Todas refrescan `['forum']`: los contadores viven dentro
 * de la publicacion y de la respuesta, asi que se vuelven a pedir en bloque en
 * vez de parchear cada lista a mano.
 */
export const useForumActions = () => {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: forumKeys.all })

  const publishPost = useMutation({
    mutationFn: ({ communityId, body }: { communityId: number; body: FormData }) =>
      createPost(communityId, body),
    onSuccess: refresh,
  })

  const reply = useMutation({
    mutationFn: ({ postId, body, parentReplyId }: { postId: number; body: string; parentReplyId?: number }) =>
      createReply(postId, { body, parentReplyId }),
    onSuccess: refresh,
  })

  const voteOnPost = useMutation({
    mutationFn: ({ postId, voteType }: { postId: number; voteType: VoteType }) => votePost(postId, voteType),
    onSuccess: refresh,
  })

  const voteOnReply = useMutation({
    mutationFn: ({ replyId, voteType }: { replyId: number; voteType: VoteType }) => voteReply(replyId, voteType),
    onSuccess: refresh,
  })

  const favoritePost = useMutation({
    mutationFn: ({ postId, isSaved }: { postId: number; isSaved: boolean }) => setPostFavorite(postId, isSaved),
    onSuccess: refresh,
  })

  const favoriteReply = useMutation({
    mutationFn: ({ replyId, isSaved }: { replyId: number; isSaved: boolean }) => setReplyFavorite(replyId, isSaved),
    onSuccess: refresh,
  })

  return { publishPost, reply, voteOnPost, voteOnReply, favoritePost, favoriteReply }
}
