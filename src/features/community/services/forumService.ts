import myntedAPI from '@/api/apiConfig'
import type {
  FeedPageQuery,
  FeedPost,
  MyContentEntry,
  MyForumPostsQuery,
  PaginatedResponse,
} from '../models/communityDTOs'

/** GET /forums/me — solo los posts (hilos) del usuario autenticado; ordenables por fecha, votos o guardados. */
export const getMyForumPosts = async (query: MyForumPostsQuery = {}): Promise<PaginatedResponse<FeedPost>> => {
  const { data } = await myntedAPI.get<PaginatedResponse<FeedPost>>('/forums/me', { params: query })
  return data
}

/** GET /posts/me — posts y productos del usuario autenticado mezclados por fecha (pestaña "Publicaciones"). */
export const getMyContent = async (
  query: FeedPageQuery & { order?: 'asc' | 'desc' } = {},
): Promise<PaginatedResponse<MyContentEntry>> => {
  const { data } = await myntedAPI.get<PaginatedResponse<MyContentEntry>>('/posts/me', { params: query })
  return data
}
