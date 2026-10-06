/**
 * Tipos del foro de una comunidad (modulo `forum` del backend): publicaciones,
 * respuestas, votos y favoritos.
 */
import type { CommunityTagItem, PaginatedResponse } from './communityDTOs'

export type VoteType = 'UP' | 'DOWN'

export interface ForumAuthor {
  communityProfileId: number
  displayName: string
  /** 'member' | 'moderator' | 'owner' */
  role: string
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

/** Comunidad a la que pertenece una publicacion del feed global. */
export interface ForumPostCommunity {
  id: number
  name: string
  slug: string
  imageUrl: string | null
}

/**
 * Publicacion del feed global (GET /posts): la misma del foro mas la comunidad
 * de donde salio, porque ahi se mezclan publicaciones de varias comunidades.
 */
export interface GlobalForumPost extends ForumPost {
  community: ForumPostCommunity | null
}

export type GlobalPostsPage = PaginatedResponse<GlobalForumPost>

export interface GlobalPostsQuery {
  page?: number
  /** Maximo 50 (ver GetGlobalPostsQueryDto). */
  limit?: number
  /** Busca en el titulo y el cuerpo. */
  search?: string
  /** Logica OR entre tags. */
  tagIds?: number[]
}
