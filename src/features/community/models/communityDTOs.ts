export interface CreateCommunityPayload {
  name: string
  description: string
  slug: string
  isPrivate: boolean
  categoryId: number
  tagIds: number[]
  rules: string[]
}

export interface CategoryOption {
  categoryId: number
  name: string
}


export interface TagOption {
  tagId: number
  name: string
  categoryId: number | null
  isInterest: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CommunitiesQuery {
  search?: string
  categoryId?: number
  sort?: 'popularity'
  page?: number
  limit?: number
}

export interface CommunityListItem {
  id: number
  name: string
  description: string
  slug: string
  isPrivate: boolean
  imageUrl: string | null
  bannerUrl: string | null
  createdAt: string
  category: CategoryOption | null
  memberCount: number
  recentPostCount: number
  popularityScore: number
  membershipRole?: string | null
}

export interface CommunityTagItem {
  tagId: number
  name: string
}

export interface CommunityRuleItem {
  communityRuleId: number
  description: string
}

export interface ForumPostAuthor {
  communityProfileId: number
  displayName: string
  role: string
}

/** Post del foro que viene dentro del detalle de la comunidad. */
export interface ForumPost {
  id: number
  title: string
  body: string
  postedAt: string
  upVotes: number
  downVotes: number
  timesSaved: number
  author: ForumPostAuthor | null
}

export interface CommunityDetail {
  id: number
  name: string
  description: string
  slug: string
  isPrivate: boolean
  imageUrl: string | null
  bannerUrl: string | null
  createdAt: string
  category: CategoryOption | null
  tags: CommunityTagItem[]
  rules: CommunityRuleItem[]
  memberCount: number
  recentPostCount: number
  popularityScore: number
  isMember: boolean
  membershipRole: string | null
  forumPosts: ForumPost[]
}

export interface RecommendedCommunityListItem extends CommunityListItem {
  matchedInterestCount: number
}

export interface CommunityStats {
  communityId: number
  memberCount: number
  postCount: number
  recentPostCount: number
}


export type JoinCommunityResultType = 'joined' | 'requested' | 'already_member' | 'already_requested'

export interface JoinCommunityResult {
  communityId: number
  result: JoinCommunityResultType
}

export interface CommunityJoinRequest {
  id: number
  userId: string
  communityId: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  user: {
    id: string
    username: string
    photoUrl: string | null
  }
}

// --------------------------------------------------------------------------
// Foro: posts de los feeds (GET /posts, GET /forums/me, GET /posts/me).
// Los tres devuelven la misma tarjeta de post (ver buildPostCards y
// mapFeedPosts en forum.service.ts del backend).
// --------------------------------------------------------------------------

export type PostVote = 'UP' | 'DOWN'

export interface FeedPostAuthor extends ForumPostAuthor {
  photoUrl: string | null
}

export interface FeedPostImage {
  id: number
  url: string
  order: number
}

export interface FeedPostTag {
  tagId: number
  name: string
}

export interface FeedPostCommunity {
  id: number
  name: string
  slug: string
  imageUrl: string | null
}

export interface FeedPost {
  id: number
  title: string
  body: string
  postedAt: string
  communityProfileId: number
  author: FeedPostAuthor | null
  tags: FeedPostTag[]
  /** Ya vienen ordenadas por `order`. */
  images: FeedPostImage[]
  upVotes: number
  downVotes: number
  timesSaved: number
  /** Voto del usuario autenticado sobre este post, si votó. */
  myVote: PostVote | null
  isSaved: boolean
  replyCount: number
  community: FeedPostCommunity | null
}

/** Criterios de orden de GET /forums/me (MyPostsSortBy en el backend). */
export type MyPostsSortBy = 'date' | 'upvotes' | 'downvotes' | 'saves'

export interface FeedPageQuery {
  page?: number
  limit?: number
}

export interface MyForumPostsQuery extends FeedPageQuery {
  sortBy?: MyPostsSortBy
  order?: 'asc' | 'desc'
}

/**
 * Producto dentro de GET /posts/me, /favorites/me y /users/:id/posts
 * (buildProductCards en el backend).
 */
export interface MyContentProduct {
  id: number
  title: string
  price: number | string
  discountPercent?: number | string | null
  /** Precio con descuento; si falta se muestra `price`. */
  finalPrice?: number | null
  currency: string
  imageUrl: string
  status: 'active' | 'sold' | 'inactive'
  type: 'sale' | 'exchange'
  condition: 'new' | 'like_new' | 'good_condition' | 'used_with_details'
  tags: FeedPostTag[]
  /** null = producto sin comunidad. */
  community: { id: number; name: string } | null
  seller: { sellerId: number; displayName: string; photoUrl: string | null; isVerified: boolean }
  isSaved: boolean
}

/** GET /posts/me mezcla posts y productos del usuario, ordenados por fecha. */
export type MyContentEntry =
  | { type: 'post'; date: string; post: FeedPost }
  | { type: 'product'; date: string; product: MyContentProduct }
