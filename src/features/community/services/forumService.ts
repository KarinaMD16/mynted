import myntedAPI from '@/api/apiConfig'
import type {
  ForumFavoriteResult,
  ForumPost,
  ForumPostsPage,
  ForumPostsQuery,
  ForumReply,
  ForumVoteResult,
  GlobalPostsPage,
  GlobalPostsQuery,
  VoteType,
} from '../models/forumDTOs'

/**
 * Foro de la comunidad. Todo pide sesion; publicar ademas exige ser miembro,
 * moderador o dueno (ver CommunityRoleGuard en forum.controller.ts).
 */

export const getCommunityPosts = async (
  communityId: number,
  query: ForumPostsQuery = {},
): Promise<ForumPostsPage> => {
  const { data } = await myntedAPI.get<ForumPostsPage>(`/communities/${communityId}/posts`, {
    params: query,
  })
  return data
}

/**
 * Feed global (GET /posts): publicaciones de todas las comunidades publicas
 * activas. Los tags van como lista separada por comas porque asi los lee
 * `parseIntegerArray` del backend sin depender de como axios serialice arreglos.
 */
export const getGlobalPosts = async (query: GlobalPostsQuery = {}): Promise<GlobalPostsPage> => {
  const { tagIds, ...rest } = query
  const { data } = await myntedAPI.get<GlobalPostsPage>('/posts', {
    params: {
      ...rest,
      ...(tagIds && tagIds.length > 0 && { tagIds: tagIds.join(',') }),
    },
  })
  return data
}

export const getPost = async (postId: number): Promise<ForumPost> => {
  const { data } = await myntedAPI.get<ForumPost>(`/posts/${postId}`)
  return data
}

export const getPostReplies = async (postId: number): Promise<ForumReply[]> => {
  const { data } = await myntedAPI.get<ForumReply[]>(`/posts/${postId}/replies`)
  return data
}

/** Multipart: titulo, cuerpo, tags opcionales y hasta 10 imagenes. */
export const createPost = async (communityId: number, body: FormData): Promise<ForumPost> => {
  const { data } = await myntedAPI.post<ForumPost>(`/communities/${communityId}/posts`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const createReply = async (
  postId: number,
  payload: { body: string; parentReplyId?: number },
): Promise<ForumReply> => {
  const { data } = await myntedAPI.post<ForumReply>(`/posts/${postId}/replies`, payload)
  return data
}

export const votePost = async (postId: number, voteType: VoteType): Promise<ForumVoteResult> => {
  const { data } = await myntedAPI.put<ForumVoteResult>(`/posts/${postId}/vote`, { voteType })
  return data
}

export const voteReply = async (replyId: number, voteType: VoteType): Promise<ForumVoteResult> => {
  const { data } = await myntedAPI.put<ForumVoteResult>(`/replies/${replyId}/vote`, { voteType })
  return data
}

/** Guardar y quitar de favoritos: el mismo endpoint con PUT y DELETE. */
export const setPostFavorite = async (postId: number, isSaved: boolean): Promise<ForumFavoriteResult> => {
  const url = `/posts/${postId}/favorite`
  const { data } = isSaved
    ? await myntedAPI.put<ForumFavoriteResult>(url)
    : await myntedAPI.delete<ForumFavoriteResult>(url)
  return data
}

export const setReplyFavorite = async (replyId: number, isSaved: boolean): Promise<ForumFavoriteResult> => {
  const url = `/replies/${replyId}/favorite`
  const { data } = isSaved
    ? await myntedAPI.put<ForumFavoriteResult>(url)
    : await myntedAPI.delete<ForumFavoriteResult>(url)
  return data
}
