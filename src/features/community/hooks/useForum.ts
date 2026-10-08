import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPost,
  createReply,
  getCommunityPosts,
  getGlobalPosts,
  getPost,
  getRecommendedPosts,
  getPostReplies,
  setPostFavorite,
  setReplyFavorite,
  votePost,
  voteReply,
} from '../services/forumService'
import type { ForumPostsQuery, GlobalPostsPage, GlobalPostsQuery, VoteType } from '../models/forumDTOs'

/** Filtros del feed global; la pagina y el limite los pone el scroll infinito. */
export type GlobalPostsFilters = Omit<GlobalPostsQuery, 'page' | 'limit'>

export const forumKeys = {
  all: ['forum'] as const,
  posts: (communityId: number, query: ForumPostsQuery) => ['forum', 'posts', communityId, query] as const,
  globalPosts: (filters: GlobalPostsFilters) => ['forum', 'global-posts', filters] as const,
  recommendedPosts: () => ['forum', 'recommended-posts'] as const,
  post: (postId: number) => ['forum', 'post', postId] as const,
  replies: (postId: number) => ['forum', 'replies', postId] as const,
}

const GLOBAL_POSTS_PAGE_SIZE = 10

/** Feed por intereses del home, con scroll infinito. No admite filtros. */
export const useRecommendedPosts = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: forumKeys.recommendedPosts(),
    queryFn: ({ pageParam }) => getRecommendedPosts(pageParam, GLOBAL_POSTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last: GlobalPostsPage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
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
