/**
 * Tipos del foro de una comunidad (modulo `forum` del backend): publicaciones,
 * respuestas, votos y favoritos.
 */
import type { CommunityTagItem, FeedPost, PaginatedResponse } from './communityDTOs'

export type VoteType = 'UP' | 'DOWN'

export interface ForumAuthor {
  communityProfileId: number
  displayName: string
  /** 'member' | 'moderator' | 'owner' */
  role: string
  /**
   * Foto del usuario detras del perfil de comunidad. El perfil de comunidad no
   * guarda una, asi que el backend la trae de `communityProfile.user`.
   */
  photoUrl: string | null
}

export interface ForumPostImage {
  id: number
  url: string
  order: number
}

/**
 * Contadores que acompanan a publicaciones y respuestas. `myVote` e `isSaved`
 * son del usuario de la sesion, asi que el boton ya sale marcado sin pedir nada aparte.
 */
export interface ForumMetrics {
  upVotes: number
  downVotes: number
  timesSaved: number
  myVote: VoteType | null
  isSaved: boolean
}

export interface ForumPost extends ForumMetrics {
  id: number
  title: string
  body: string
  postedAt: string
  communityProfileId: number
  author: ForumAuthor | null
  tags: CommunityTagItem[]
  images: ForumPostImage[]
  replyCount: number
}

export interface ForumReply extends ForumMetrics {
  id: number
  body: string
  postedAt: string
  postId: number
  communityProfileId: number
  /** null en las respuestas de primer nivel; si no, la respuesta a la que contesta. */
  parentReplyId: number | null
  author: ForumAuthor | null
}

export type ForumPostsPage = PaginatedResponse<ForumPost>

export interface ForumPostsQuery {
  page?: number
  /** Maximo 50 (ver GetPostsQueryDto). */
  limit?: number
}

/** Lo que devuelven votar y guardar. */
export interface ForumVoteResult extends ForumMetrics {
  postId?: number
  replyId?: number
}

export interface ForumFavoriteResult {
  itemId: number
  itemType: string
  isSaved: boolean
}

/**
 * Los feeds que mezclan comunidades (GET /posts y GET /users/me/recommended-posts)
 * devuelven la publicacion con su comunidad: es el mismo `FeedPost` que usan las
 * pantallas de perfil y favoritos.
 */
export type GlobalPostsPage = PaginatedResponse<FeedPost>

export interface GlobalPostsQuery {
  page?: number
  /** Maximo 50 (ver GetGlobalPostsQueryDto). */
  limit?: number
  /** Busca en el titulo y el cuerpo. */
  search?: string
  /** Logica OR entre tags. */
  tagIds?: number[]
}
